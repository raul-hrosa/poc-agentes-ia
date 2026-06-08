import { ExecutionContext, CallHandler } from '@nestjs/common'
import { of } from 'rxjs'
import { AuditInterceptor } from './audit.interceptor'

function buildContext(method: string, url: string, userId?: string): ExecutionContext {
  const request = {
    method,
    url,
    user: userId ? { sub: userId } : undefined,
  }
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext
}

function buildHandler(): CallHandler {
  return { handle: () => of({ ok: true }) }
}

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor
  let logSpy: jest.SpyInstance

  beforeEach(() => {
    interceptor = new AuditInterceptor()
    logSpy = jest.spyOn((interceptor as any).logger, 'log').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'registra log para método mutante %s',
    (method) => {
      return new Promise<void>((resolve) => {
        const ctx = buildContext(method, '/api/patients', 'user-1')
        interceptor.intercept(ctx, buildHandler()).subscribe(() => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining(method),
          )
          resolve()
        })
      })
    },
  )

  it('não registra log para GET', () => {
    return new Promise<void>((resolve) => {
      const ctx = buildContext('GET', '/api/patients', 'user-1')
      interceptor.intercept(ctx, buildHandler()).subscribe(() => {
        expect(logSpy).not.toHaveBeenCalled()
        resolve()
      })
    })
  })

  it('usa "anon" quando usuário não está autenticado', () => {
    return new Promise<void>((resolve) => {
      const ctx = buildContext('POST', '/api/something')
      interceptor.intercept(ctx, buildHandler()).subscribe(() => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('anon'))
        resolve()
      })
    })
  })

  it('inclui userId no log quando autenticado', () => {
    return new Promise<void>((resolve) => {
      const ctx = buildContext('DELETE', '/api/records/1', 'user-42')
      interceptor.intercept(ctx, buildHandler()).subscribe(() => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user:user-42'))
        resolve()
      })
    })
  })
})
