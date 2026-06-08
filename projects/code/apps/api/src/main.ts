import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT', 3001)
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000')

  app.use(helmet())
  app.use(cookieParser())

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.setGlobalPrefix('api/v1')

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PsiClínica API')
    .setDescription('API do sistema de gestão de consultório para psicólogos')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(port)
  new Logger('Bootstrap').log(`API rodando em http://localhost:${port}/api/v1`)
}

bootstrap()
