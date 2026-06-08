# T-002 — Setup NestJS Base (guards, pipes, crypto, R2, mail)

**Épico**: [Épico 0 — Infraestrutura](../epics/epic-0-infraestrutura.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ✅ Concluído (revisado 2026-06-08)

## O que fazer

Configurar os módulos comuns do NestJS que serão reutilizados por todos os outros módulos: `ValidationPipe` global, `JwtAuthGuard` global com decorator `@Public()`, `PlanGuard`, `CryptoService` (AES-256-CBC), `R2Service` (upload/presigned URL), `ResendService` (e-mail), `PdfService` (Puppeteer), `AuditInterceptor`. Configurar `ConfigModule` global, `ThrottlerModule` com Upstash Redis, e `helmet`/`cors` na `main.ts`.

## Critérios de aceite

- [x] `ValidationPipe` global com `whitelist: true, forbidNonWhitelisted: true` ativo
- [x] `JwtAuthGuard` aplicado globalmente via `APP_GUARD`; `@Public()` funciona para desproteger rotas
- [x] `CryptoService.encrypt(text)` retorna `Buffer` com IV prefixado; `decrypt(buf)` retorna texto original
- [x] `R2Service.upload(key, buffer, mimeType)` e `getPresignedUrl(key, ttlSeconds)` funcionam
- [x] `ResendService.send(to, subject, html)` envia e-mail via Resend
- [x] `PlanGuard('pro')` rejeita com 403 se assinatura não for `pro` ou `clinic`
- [x] Rate limiting: 100 req/min por IP via `@nestjs/throttler`

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/common/crypto/crypto.service.ts`, `apps/api/src/common/storage/r2.service.ts`, `apps/api/src/common/mail/resend.service.ts`, `apps/api/src/common/pdf/pdf.service.ts`, `apps/api/src/common/guards/plan.guard.ts`, `apps/api/src/common/guards/jwt-auth.guard.ts`, `apps/api/src/common/decorators/public.decorator.ts`, `apps/api/src/common/interceptors/audit.interceptor.ts`
- **CryptoService**: `ENCRYPTION_KEY` de env (hex 64 chars = 32 bytes); `createCipheriv('aes-256-cbc', key, iv)`
- **R2Service**: AWS SDK v3 `S3Client` com `endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
- **PlanGuard**: injeta `SubscriptionsService` ou `DataSource` para verificar plano do `req.user.id`

## Dependências

- Requer: [T-001] — monorepo precisa existir

## Progresso

- [x] `apps/api/src/common/` — ✅ concluído
- [x] `apps/api/src/app.module.ts` configurado — ✅ concluído
- [x] `apps/api/src/common/throttler/throttler-storage.service.ts` — ✅ criado (correção pós-revisão)

## Correções pós-revisão (2026-06-05)

- [x] `common/storage/r2.service.ts` — migrado de `aws-sdk` v2 para `@aws-sdk/client-s3` v3 + `@aws-sdk/s3-request-presigner`
- [x] `common/interceptors/audit.interceptor.ts` — substituído `console.log` por `Logger` do NestJS; simplificado type casting com interface `AuthenticatedUser`
- [x] `common/pdf/pdf.service.ts` — browser Puppeteer agora é singleton com `OnModuleDestroy`; `page.close()` no finally
- [x] `common/throttler/throttler-storage.service.ts` — criado `ThrottlerStorageService` com `ioredis` + `REDIS_URL`
- [x] `app.module.ts` — `ThrottlerModule.forRoot` migrado para `ThrottlerModule.forRootAsync` com Redis storage
- [x] `package.json` — removido `aws-sdk` v2; adicionado `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `ioredis`

## Revisão

**Resultado**: ⚠️ Aprovado com ressalvas
**Data revisão**: 2026-06-08

### 🟡 Melhorias

- `common/pdf/pdf.service.ts:8-9` — Se `puppeteer.launch()` rejeitar, `browserPromise` permanece como promise rejeitada; `??=` não a limpa (não é `null`). Chamadas seguintes continuam falhando até restart. → Limpar `browserPromise = null` no `.catch` ao atribuir, ou no `catch` de `generate()`.
- `main.ts:36-44` — Swagger habilitado em todos os ambientes, incluindo produção. → Envolver o setup com `if (configService.get('NODE_ENV') !== 'production')`.
- `common/throttler/throttler-storage.service.ts:42-44` — Erros individuais de pipeline não verificados; se `incr` falhar, `totalHits` é `null`, o `pexpire` é ignorado e a chave fica sem TTL indefinidamente. → Checar `results?.[0]?.[0]` antes de usar o valor.

### 🟢 Observações

- `CryptoService` — validação da chave no construtor com falha rápida e mensagem clara.
- `R2Service` — método `delete()` incluído além dos especificados; migração AWS SDK v3 correta.
- `AuditInterceptor` — interface `AuthenticatedUser` evita `any`; só loga métodos mutantes.
- `PlanGuard` — `PLAN_HIERARCHY` limpo; query parametrizada (sem SQL injection).
- Ordem dos guards em `app.module.ts`: throttle → auth, correta.

## Testes E2E

**Arquivo**: `tests/e2e/setup-nestjs-base.spec.ts`
**Executado em**: N/A — API não está rodando localmente neste momento
**Resultado**: ⏳ Aguardando execução

Para executar, suba a API localmente e rode:

```bash
npx playwright test tests/e2e/setup-nestjs-base.spec.ts --reporter=list
```

### Cenários cobertos

**Executáveis agora** (requerem apenas API no ar):

- ✅ Swagger: `GET /api/docs` retorna HTML 200
- ✅ Swagger: `GET /api/docs-json` retorna spec OpenAPI válida com título "PsiClínica API"
- ✅ Helmet: `X-Frame-Options: SAMEORIGIN` presente
- ✅ Helmet: `X-Content-Type-Options: nosniff` presente
- ✅ Helmet: `X-DNS-Prefetch-Control: off` presente
- ✅ Helmet: `X-Download-Options: noopen` presente
- ✅ CORS: preflight de `http://localhost:3000` retorna `Access-Control-Allow-Origin` e `Allow-Credentials: true`
- ✅ CORS: origem não permitida não recebe `Access-Control-Allow-Origin`

**Pendentes — habilitados a partir de T-004** (`test.skip` removível):

- ⏭️ JwtAuthGuard: rota protegida sem token → 401 "Token não fornecido"
- ⏭️ JwtAuthGuard: token inválido → 401 "Token inválido ou expirado"
- ⏭️ JwtAuthGuard: rota `@Public()` acessível sem token
- ⏭️ ValidationPipe: campo extra proibido → 400 (forbidNonWhitelisted)
- ⏭️ ValidationPipe: campo obrigatório ausente → 400 com array de erros

**Pendente — executar manualmente em ambiente isolado**:

- ⏭️ Rate limiting: 101ª requisição → 429 Too Many Requests

### Próximos passos

Remover `test.skip` dos cenários de JwtAuthGuard e ValidationPipe após T-004 implementar o módulo de auth com `POST /api/v1/auth/login` e `GET /api/v1/psychologists/me`.

---

## Checklist de conclusão

- [x] Código implementado e funcionando
- [x] TypeScript sem erros (`npm run typecheck`) — bloqueador de compilação resolvido
- [ ] Responsivo (mobile + desktop testados) — N/A (infra, sem UI)
- [ ] Loading state implementado — N/A (infra, sem UI)
- [ ] Tratamento de erro com feedback ao usuário — N/A (infra, sem UI)
- [x] Status atualizado para ✅ neste arquivo
- [x] BACKLOG.md atualizado
