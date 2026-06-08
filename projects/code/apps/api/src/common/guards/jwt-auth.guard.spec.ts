import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { JwtAuthGuard } from './jwt-auth.guard'

function makeContext(overrides: {
  authorization?: string
  isPublic?: boolean
}): ExecutionContext {
  const request = {
    headers: { authorization: overrides.authorization },
  } as any

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(overrides.isPublic ?? false),
  } as unknown as Reflector

  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext

  return { ...context, _reflector: reflector, _request: request } as any
}

function makeGuard(verifyResult: unknown = { sub: 'user-1' }) {
  const jwtService = {
    verifyAsync: jest.fn().mockResolvedValue(verifyResult),
  } as unknown as JwtService
  const reflector = new Reflector()
  const guard = new JwtAuthGuard(jwtService, reflector)
  return { guard, jwtService, reflector }
}

function buildContext(
  authHeader: string | undefined,
  isPublic: boolean,
  jwtService: JwtService,
  reflector: Reflector,
): ExecutionContext {
  const request: Record<string, unknown> = { headers: { authorization: authHeader } }
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic as any)

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
    _request: request,
  } as unknown as ExecutionContext
}

describe('JwtAuthGuard', () => {
  it('permite rota pública sem token', async () => {
    const { guard, jwtService, reflector } = makeGuard()
    const ctx = buildContext(undefined, true, jwtService, reflector)
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(jwtService.verifyAsync).not.toHaveBeenCalled()
  })

  it('permite acesso com Bearer token válido e popula req.user', async () => {
    const { guard, jwtService, reflector } = makeGuard({ sub: 'user-42' })
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer valid.jwt.token' } }
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false as any)
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext

    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(request['user']).toEqual({ sub: 'user-42' })
  })

  it('lança UnauthorizedException quando Authorization está ausente', async () => {
    const { guard, jwtService, reflector } = makeGuard()
    const request: Record<string, unknown> = { headers: {} }
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false as any)
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
    await expect(guard.canActivate(ctx)).rejects.toThrow('Token não fornecido')
  })

  it('lança UnauthorizedException quando prefixo não é Bearer', async () => {
    const { guard, jwtService, reflector } = makeGuard()
    const request: Record<string, unknown> = { headers: { authorization: 'Basic abc123' } }
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false as any)
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext

    await expect(guard.canActivate(ctx)).rejects.toThrow('Token não fornecido')
  })

  it('lança UnauthorizedException quando JwtService rejeita o token', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockRejectedValue(new Error('expired')),
    } as unknown as JwtService
    const reflector = new Reflector()
    const guard = new JwtAuthGuard(jwtService, reflector)
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer bad.token' } }
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false as any)
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext

    await expect(guard.canActivate(ctx)).rejects.toThrow('Token inválido ou expirado')
  })
})
