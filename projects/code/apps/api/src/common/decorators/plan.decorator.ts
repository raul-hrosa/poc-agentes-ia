import { SetMetadata } from '@nestjs/common'

export const REQUIRED_PLAN_KEY = 'requiredPlan'
export const RequiresPlan = (plan: 'pro' | 'clinic') => SetMetadata(REQUIRED_PLAN_KEY, plan)
