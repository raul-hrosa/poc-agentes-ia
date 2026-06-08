import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CryptoService } from './crypto/crypto.service'
import { R2Service } from './storage/r2.service'
import { ResendService } from './mail/resend.service'
import { PdfService } from './pdf/pdf.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { PlanGuard } from './guards/plan.guard'
import { AuditInterceptor } from './interceptors/audit.interceptor'
import { ThrottlerStorageService } from './throttler/throttler-storage.service'

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        publicKey: config
          .getOrThrow<string>('JWT_PUBLIC_KEY')
          .replace(/\\n/g, '\n'),
        verifyOptions: { algorithms: ['RS256'] },
      }),
    }),
  ],
  providers: [
    CryptoService,
    R2Service,
    ResendService,
    PdfService,
    JwtAuthGuard,
    PlanGuard,
    AuditInterceptor,
    ThrottlerStorageService,
  ],
  exports: [
    CryptoService,
    R2Service,
    ResendService,
    PdfService,
    JwtModule,
    JwtAuthGuard,
    PlanGuard,
    AuditInterceptor,
    ThrottlerStorageService,
  ],
})
export class CommonModule {}
