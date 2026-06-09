import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Public } from '../common/decorators/public.decorator'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: Request) {
    const token = req.cookies?.['refresh_token'] as string | undefined
    if (!token) throw new UnauthorizedException('Refresh token ausente')
    return this.authService.refresh(token)
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'] as string | undefined
    if (token) await this.authService.logout(token)
    res.clearCookie('refresh_token', { path: '/api/v1/auth' })
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email)
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Query('token') token: string, @Body() dto: ResetPasswordDto) {
    if (!token) throw new UnauthorizedException('Token ausente')
    return this.authService.resetPassword(token, dto.password)
  }

  @Public()
  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  confirmEmail(@Query('token') token: string) {
    if (!token) throw new UnauthorizedException('Token ausente')
    return this.authService.confirmEmail(token)
  }
}
