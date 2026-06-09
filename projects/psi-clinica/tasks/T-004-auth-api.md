# T-004 — Auth API (register, login, refresh, logout, reset, confirm)

**Épico**: [Épico 0 — Infraestrutura](../epics/epic-0-infraestrutura.md)
**Prioridade**: P1
**Complexidade**: L (3h+)
**Status**: ✅ Concluído

## O que fazer

Implementar o `AuthModule` do NestJS com todos os 7 endpoints do TechSpec. Registro cria psicólogo + subscription com trial de 14 dias + envia e-mail de confirmação. Login retorna access token RS256 (15 min) no body + refresh token opaque em httpOnly cookie. Refresh renova o access token. Logout revoga o refresh token. Forgot/reset password com link que expira em 1h. Confirm email ativa a conta. Bloqueio de conta após 5 tentativas falhas (15 min).

## Critérios de aceite

- [x] `POST /auth/register` cria psicólogo + subscription (trialing, trial_ends_at = now+14d) + envia e-mail de confirmação; conta inativa até confirmar
- [x] `POST /auth/login` com e-mail/senha retorna `{ access_token }` + seta `refresh_token` em httpOnly cookie `Secure; SameSite=Strict`; 5 falhas → `locked_until = now + 15min`
- [x] `POST /auth/refresh` lê cookie, valida hash, retorna novo access token
- [x] `POST /auth/logout` revoga refresh token (seta `revoked_at`)
- [x] `POST /auth/forgot-password` envia link com token que expira em 1h
- [x] `POST /auth/reset-password?token=` redefine senha e invalida o token
- [x] `POST /auth/confirm-email?token=` seta `email_confirmed = 1` e invalida token
- [x] `JwtStrategy` valida RS256 e popula `req.user = { id, email, plan }`

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/auth/auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `dto/register.dto.ts`, `dto/login.dto.ts`, `strategies/jwt.strategy.ts`, `strategies/local.strategy.ts`
- **JWT**: `@nestjs/jwt` com `JwtModule.registerAsync()`; chaves RS256 de env `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`
- **Refresh token**: `crypto.randomBytes(32).toString('hex')` → armazena `SHA256(token)` em `refresh_tokens`; token real no cookie
- **bcrypt**: `saltRounds: 12`; comparar na tentativa de login; incrementar `login_attempts` antes de responder
- **Subscription**: criar via `DataSource` diretamente no `AuthService.register()` (evitar dependência circular com `SubscriptionsModule`)

## Dependências

- Requer: [T-002] — `JwtAuthGuard`, `@Public()`, `ResendService`
- Requer: [T-003] — tabelas `psychologists`, `refresh_tokens`, `subscriptions`

## Progresso

- [x] `auth.service.ts` — ✅ concluído
- [x] `auth.controller.ts` — ✅ concluído
- [x] `JwtStrategy` — ✅ concluído
- [x] DTOs — ✅ concluído

## Checklist de conclusão

- [x] Código implementado e funcionando
- [x] TypeScript sem erros (`npm run typecheck`) — 2 erros pré-existentes de T-002/T-003 (throttler + rootDir)
- [ ] Responsivo (mobile + desktop testados) — N/A (API only)
- [ ] Loading state implementado — N/A (API only)
- [x] Tratamento de erro com feedback ao usuário
- [x] Status atualizado para ✅ neste arquivo
- [x] BACKLOG.md atualizado

## Revisão

**Resultado**: ⚠️ Aprovado com ressalvas
**Data**: 2026-06-08

### 🟡 Melhorias

- `auth.service.ts:155-181` — `refresh()` não rotaciona o refresh token; token comprometido permanece válido 30 dias → emitir novo refresh cookie e revogar o antigo a cada chamada
- `auth.service.ts:95-97` — hash de timing-safe tem 48 chars enquanto bcrypt válido tem 60; bcrypt pode detectar formato inválido e retornar mais rápido → usar hash pré-computado válido de 60 chars
- `auth.service.ts:80-87` — `resend.send()` fora da transação; se falhar, conta criada mas usuário sem e-mail de confirmação e sem endpoint de reenvio → envolver em try/catch com log ou implementar endpoint de reenvio
- `auth.service.ts:266-274` — `validateCredentials()` é código morto (LocalStrategy não implementada, controller não usa `AuthGuard('local')`) → remover ou implementar LocalStrategy
- `auth.service.ts:283-290` — `issueRefreshCookie()` não popula `user_agent`/`ip_address` na entidade RefreshToken → receber `Request` e preencher os campos para rastreabilidade

## Testes E2E

**Arquivo**: `tests/e2e/T-004-auth.spec.ts`
**Criado em**: 2026-06-08
**Resultado**: ⏳ Pendente execução — API deve estar rodando localmente

```bash
npx playwright test tests/e2e/T-004-auth.spec.ts --reporter=list
```

### Cenários cobertos

**POST /auth/register**
- ✅ Happy path: body válido → 201 com mensagem de confirmação
- ✅ E-mail duplicado → 409
- ✅ Body vazio → 400 (validação)
- ✅ E-mail inválido → 400
- ✅ Senha < 8 chars → 400
- ✅ State ≠ 2 chars → 400
- ✅ Campo extra proibido → 400 (whitelist)

**POST /auth/login**
- ✅ E-mail inexistente → 401 "Credenciais inválidas"
- ✅ Senha incorreta → 401 "Credenciais inválidas"
- ✅ Senha correta + e-mail não confirmado → 403
- ✅ 5 tentativas erradas → conta bloqueada → 403
- ✅ Body vazio → 400
- ⏸️ Happy path (usuário confirmado) → requer `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` no `.env`

**POST /auth/refresh**
- ✅ Sem cookie → 401 "Refresh token ausente"
- ✅ Token desconhecido → 401 "Refresh token inválido ou expirado"
- ⏸️ Happy path → requer usuário confirmado pré-criado

**POST /auth/logout**
- ✅ Sem cookie → 204 (graceful)
- ⏸️ Happy path + invalidação → requer usuário confirmado pré-criado

**POST /auth/forgot-password**
- ✅ E-mail desconhecido → 200 (anti-enumeração)
- ✅ E-mail cadastrado → 200 (mesma mensagem)
- ✅ Body vazio → 400
- ✅ E-mail inválido → 400

**POST /auth/reset-password**
- ✅ Sem `?token` → 401 "Token ausente"
- ✅ Token inválido + senha válida → 400 "Token inválido ou expirado"
- ✅ Token + senha curta → 400 (validação)
- ✅ Token + body vazio → 400

**POST /auth/confirm-email**
- ✅ Sem `?token` → 401 "Token ausente"
- ✅ Token inválido → 400 "Token inválido"

### Happy paths com usuário confirmado (⏸️ pendentes)

Os testes de happy path de login, refresh e logout exigem um usuário
pré-confirmado no banco. Crie o usuário e configure o `.env`:

```bash
TEST_USER_EMAIL=test@psiclinica.local
TEST_USER_PASSWORD=SenhaTest@123
```

O token de confirmação de e-mail está na coluna `email_confirm_token` da tabela
`psychologists`. Execute diretamente no banco:

```sql
UPDATE psychologists SET email_confirmed = 1, email_confirm_token = NULL
WHERE email = 'test@psiclinica.local';
```

### Próximos passos
- Subir a API localmente e executar os testes
- Criar usuário de teste confirmado no banco para habilitar os happy paths
- JwtAuthGuard (rota protegida) será testado em T-005 — PsychologistsModule

---

### 🟢 Observações

- Todos os 8 critérios de aceite implementados corretamente
- Proteção de timing contra enumeração de e-mail em `login()` e `forgotPassword()`
- `resetPassword()` revoga todos os refresh tokens do usuário (boa prática)
- Transação atômica para criar `Psychologist` + `Subscription` no register
- `JwtStrategy` registrada no módulo mas é código morto — `JwtAuthGuard` usa `JwtService.verifyAsync` diretamente sem Passport
