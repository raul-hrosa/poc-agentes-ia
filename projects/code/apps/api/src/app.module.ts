import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { CommonModule } from './common/common.module'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { AuditInterceptor } from './common/interceptors/audit.interceptor'
import { ThrottlerStorageService } from './common/throttler/throttler-storage.service'
import { AuthModule } from './auth/auth.module'
import { PsychologistsModule } from './psychologists/psychologists.module'
import { PatientsModule } from './patients/patients.module'
import { SessionsModule } from './sessions/sessions.module'
import { RecordsModule } from './records/records.module'
import { DocumentsModule } from './documents/documents.module'
import { FinancialModule } from './financial/financial.module'
import { CommunicationModule } from './communication/communication.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRootAsync({
      imports: [CommonModule],
      inject: [ThrottlerStorageService],
      useFactory: (storage: ThrottlerStorageService) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        storage,
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'psiclinica'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
        charset: 'utf8mb4',
      }),
    }),

    CommonModule,
    AuthModule,
    PsychologistsModule,
    PatientsModule,
    SessionsModule,
    RecordsModule,
    DocumentsModule,
    FinancialModule,
    CommunicationModule,
    SubscriptionsModule,
  ],
  providers: [
    // Rate limiting (100 req/min por IP)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Auth global — rotas públicas usam @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Auditoria de mutações (POST/PUT/PATCH/DELETE)
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
