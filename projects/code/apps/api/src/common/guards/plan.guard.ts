import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { REQUIRED_PLAN_KEY } from '../decorators/plan.decorator'

const PLAN_HIERARCHY: Record<string, string[]> = {
  pro: ['pro', 'clinic'],
  clinic: ['clinic'],
}

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<string>(REQUIRED_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredPlan) return true

    const request = context.switchToHttp().getRequest()
    const psychologistId: string = request.user?.sub
    if (!psychologistId) throw new ForbiddenException('Acesso negado')

    const [subscription] = await this.dataSource.query<Array<{ plan: string }>>(
      `SELECT plan FROM subscriptions WHERE psychologist_id = ? AND status = 'active' LIMIT 1`,
      [psychologistId],
    )

    const allowed = PLAN_HIERARCHY[requiredPlan] ?? []
    if (!subscription || !allowed.includes(subscription.plan)) {
      throw new ForbiddenException('Plano insuficiente para acessar este recurso')
    }

    return true
  }
}
