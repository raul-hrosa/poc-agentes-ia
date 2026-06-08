import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { PlanGuard } from './plan.guard'

function makeGuard(dbRows: Array<{ plan: string }> = []) {
  const dataSource = {
    query: jest.fn().mockResolvedValue(dbRows),
  } as unknown as DataSource
  const reflector = new Reflector()
  const guard = new PlanGuard(dataSource, reflector)
  return { guard, dataSource, reflector }
}

function buildContext(
  requiredPlan: string | undefined,
  userId: string | undefined,
  reflector: Reflector,
): ExecutionContext {
  const request = { user: userId ? { sub: userId } : undefined }
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredPlan as any)
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext
}

describe('PlanGuard', () => {
  it('permite acesso quando nenhum plano é exigido', async () => {
    const { guard, reflector } = makeGuard()
    const ctx = buildContext(undefined, 'user-1', reflector)
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
  })

  it('permite acesso quando usuário tem plano pro e rota exige pro', async () => {
    const { guard, reflector } = makeGuard([{ plan: 'pro' }])
    const ctx = buildContext('pro', 'user-1', reflector)
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
  })

  it('permite acesso quando usuário tem plano clinic e rota exige pro', async () => {
    const { guard, reflector } = makeGuard([{ plan: 'clinic' }])
    const ctx = buildContext('pro', 'user-1', reflector)
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
  })

  it('permite acesso quando usuário tem plano clinic e rota exige clinic', async () => {
    const { guard, reflector } = makeGuard([{ plan: 'clinic' }])
    const ctx = buildContext('clinic', 'user-1', reflector)
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
  })

  it('lança ForbiddenException quando usuário tem plano free e rota exige pro', async () => {
    const { guard, reflector } = makeGuard([{ plan: 'free' }])
    const ctx = buildContext('pro', 'user-1', reflector)
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException)
    await expect(guard.canActivate(ctx)).rejects.toThrow('Plano insuficiente')
  })

  it('lança ForbiddenException quando usuário não tem assinatura ativa', async () => {
    const { guard, reflector } = makeGuard([])
    const ctx = buildContext('pro', 'user-1', reflector)
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException)
  })

  it('lança ForbiddenException quando user.sub está ausente', async () => {
    const { guard, reflector } = makeGuard()
    const ctx = buildContext('pro', undefined, reflector)
    await expect(guard.canActivate(ctx)).rejects.toThrow('Acesso negado')
  })

  it('consulta banco apenas quando plano é exigido', async () => {
    const { guard, dataSource, reflector } = makeGuard()
    const ctx = buildContext(undefined, 'user-1', reflector)
    await guard.canActivate(ctx)
    expect(dataSource.query).not.toHaveBeenCalled()
  })
})
