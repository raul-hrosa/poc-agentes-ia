import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { SubscriptionPlan } from '@psiclinica/types'

interface JwtPayload {
  sub: string
  email: string
  plan: SubscriptionPlan
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
    })
  }

  validate(payload: JwtPayload): { id: string; email: string; plan: SubscriptionPlan } {
    return { id: payload.sub, email: payload.email, plan: payload.plan }
  }
}
