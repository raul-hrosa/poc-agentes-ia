import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request } from 'express'

interface AuthenticatedUser {
  sub: string
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()
    const { method, url } = request
    const user = (request as Request & { user?: AuthenticatedUser }).user
    const userId = user?.sub ?? 'anon'

    return next.handle().pipe(
      tap(() => {
        if (MUTATING_METHODS.has(method)) {
          this.logger.log(`${method} ${url} | user:${userId}`)
        }
      }),
    )
  }
}
