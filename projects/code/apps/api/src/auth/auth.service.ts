import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { Response } from 'express'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshToken } from './entities/refresh-token.entity'
import { Psychologist } from '../psychologists/entities/psychologist.entity'
import { Subscription } from '../subscriptions/entities/subscription.entity'
import { ResendService } from '../common/mail/resend.service'
import { LoginResponse, SubscriptionPlan, SubscriptionStatus } from '@psiclinica/types'

const BCRYPT_ROUNDS = 12
const REFRESH_TOKEN_TTL_DAYS = 30
const LOGIN_MAX_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15
const RESET_TOKEN_TTL_HOURS = 1
const TRIAL_DURATION_DAYS = 14

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly resend: ResendService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const psychologistRepo = this.dataSource.getRepository(Psychologist)

    const existing = await psychologistRepo.findOne({ where: { email: dto.email } })
    if (existing) throw new ConflictException('E-mail já cadastrado')

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
    const confirmToken = crypto.randomBytes(32).toString('hex')
    const slug = this.buildSlug(dto.full_name, dto.crp)

    await this.dataSource.transaction(async (manager) => {
      const psychologist = manager.create(Psychologist, {
        email: dto.email,
        password_hash: passwordHash,
        full_name: dto.full_name,
        crp: dto.crp,
        state: dto.state,
        email_confirmed: false,
        email_confirm_token: confirmToken,
        public_booking_slug: slug,
        login_attempts: 0,
      })
      const saved = await manager.save(psychologist)

      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS)

      await manager.save(
        manager.create(Subscription, {
          psychologist_id: saved.id,
          plan: SubscriptionPlan.Free,
          status: SubscriptionStatus.Trialing,
          trial_ends_at: trialEndsAt,
        }),
      )
    })

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000')
    const confirmUrl = `${frontendUrl}/confirmar-email?token=${confirmToken}`

    await this.resend.send(
      dto.email,
      'Confirme seu e-mail — PsiClínica',
      `<p>Olá, ${dto.full_name}!</p><p>Clique no link abaixo para ativar sua conta:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p><p>O link não expira.</p>`,
    )

    return { message: 'Conta criada. Verifique seu e-mail para ativar a conta.' }
  }

  async login(dto: LoginDto, res: Response): Promise<LoginResponse> {
    const psychologistRepo = this.dataSource.getRepository(Psychologist)
    const psychologist = await psychologistRepo.findOne({ where: { email: dto.email } })

    if (!psychologist) {
      // Dummy compare to prevent timing-based email enumeration
      await bcrypt.compare(dto.password, '$2b$12$invalidhashfortimingsafetyx.placeholder00')
      throw new UnauthorizedException('Credenciais inválidas')
    }

    if (psychologist.locked_until && psychologist.locked_until > new Date()) {
      throw new ForbiddenException('Conta bloqueada temporariamente. Tente novamente em alguns minutos.')
    }

    const passwordValid = await bcrypt.compare(dto.password, psychologist.password_hash)

    if (!passwordValid) {
      const attempts = (psychologist.login_attempts ?? 0) + 1
      const update: Partial<Psychologist> = { login_attempts: attempts }

      if (attempts >= LOGIN_MAX_ATTEMPTS) {
        const lockedUntil = new Date()
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES)
        update.locked_until = lockedUntil
      }

      await psychologistRepo.update(psychologist.id, update)
      throw new UnauthorizedException('Credenciais inválidas')
    }

    if (!psychologist.email_confirmed) {
      throw new ForbiddenException('Confirme seu e-mail antes de fazer login.')
    }

    await psychologistRepo.update(psychologist.id, { login_attempts: 0, locked_until: null })

    const subscription = await this.dataSource
      .getRepository(Subscription)
      .findOne({ where: { psychologist_id: psychologist.id } })

    const plan = subscription?.plan ?? SubscriptionPlan.Free

    const accessToken = await this.jwtService.signAsync(
      { sub: psychologist.id, email: psychologist.email, plan },
      { algorithm: 'RS256', expiresIn: '15m' },
    )

    await this.issueRefreshCookie(psychologist.id, res)

    return {
      accessToken,
      psychologist: {
        id: psychologist.id,
        name: psychologist.full_name,
        email: psychologist.email,
        avatarUrl: null,
        slug: psychologist.public_booking_slug,
      },
      subscription: {
        plan,
        status: subscription?.status ?? SubscriptionStatus.Trialing,
      },
    }
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    const tokenHash = this.hashToken(token)

    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { token_hash: tokenHash },
      relations: ['psychologist'],
    })

    if (!refreshToken || refreshToken.revoked_at || refreshToken.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado')
    }

    const subscription = await this.dataSource
      .getRepository(Subscription)
      .findOne({ where: { psychologist_id: refreshToken.psychologist_id } })

    const accessToken = await this.jwtService.signAsync(
      {
        sub: refreshToken.psychologist_id,
        email: refreshToken.psychologist.email,
        plan: subscription?.plan ?? SubscriptionPlan.Free,
      },
      { algorithm: 'RS256', expiresIn: '15m' },
    )

    return { accessToken }
  }

  async logout(token: string): Promise<void> {
    const tokenHash = this.hashToken(token)
    await this.refreshTokenRepo.update({ token_hash: tokenHash }, { revoked_at: new Date() })
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const psychologistRepo = this.dataSource.getRepository(Psychologist)
    const psychologist = await psychologistRepo.findOne({ where: { email } })

    // Always succeed to prevent email enumeration
    if (!psychologist) return { message: 'Se o e-mail estiver cadastrado, você receberá um link em breve.' }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_TTL_HOURS)

    await psychologistRepo.update(psychologist.id, {
      password_reset_token: resetToken,
      password_reset_expires_at: expiresAt,
    })

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000')
    const resetUrl = `${frontendUrl}/redefinir-senha?token=${resetToken}`

    await this.resend.send(
      email,
      'Redefinição de senha — PsiClínica',
      `<p>Você solicitou a redefinição de senha.</p><p><a href="${resetUrl}">Clique aqui para redefinir sua senha</a> (válido por 1 hora).</p><p>Se não foi você, ignore este e-mail.</p>`,
    )

    return { message: 'Se o e-mail estiver cadastrado, você receberá um link em breve.' }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const psychologistRepo = this.dataSource.getRepository(Psychologist)
    const psychologist = await psychologistRepo.findOne({
      where: { password_reset_token: token },
    })

    if (
      !psychologist ||
      !psychologist.password_reset_expires_at ||
      psychologist.password_reset_expires_at < new Date()
    ) {
      throw new BadRequestException('Token inválido ou expirado')
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

    await psychologistRepo.update(psychologist.id, {
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires_at: null,
      login_attempts: 0,
      locked_until: null,
    })

    // Invalidate all refresh tokens after password reset for security
    await this.refreshTokenRepo.update(
      { psychologist_id: psychologist.id },
      { revoked_at: new Date() },
    )

    return { message: 'Senha redefinida com sucesso.' }
  }

  async confirmEmail(token: string): Promise<{ message: string }> {
    const psychologistRepo = this.dataSource.getRepository(Psychologist)
    const psychologist = await psychologistRepo.findOne({
      where: { email_confirm_token: token },
    })

    if (!psychologist) throw new BadRequestException('Token inválido')

    await psychologistRepo.update(psychologist.id, {
      email_confirmed: true,
      email_confirm_token: null,
    })

    return { message: 'E-mail confirmado com sucesso.' }
  }

  // Used by LocalStrategy for credentials validation
  async validateCredentials(email: string, password: string): Promise<Psychologist | null> {
    const psychologist = await this.dataSource
      .getRepository(Psychologist)
      .findOne({ where: { email } })

    if (!psychologist) return null
    const valid = await bcrypt.compare(password, psychologist.password_hash)
    return valid ? psychologist : null
  }

  private async issueRefreshCookie(psychologistId: string, res: Response): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(rawToken)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS)

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        psychologist_id: psychologistId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        revoked_at: null,
      }),
    )

    const isProduction = this.config.get<string>('NODE_ENV') === 'production'

    res.cookie('refresh_token', rawToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  private buildSlug(fullName: string, crp: string): string {
    const namePart = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const crpPart = crp.replace(/[^a-z0-9]/gi, '').toLowerCase()
    const suffix = crypto.randomBytes(4).toString('hex')

    return `${namePart}-${crpPart}-${suffix}`.slice(0, 100)
  }
}
