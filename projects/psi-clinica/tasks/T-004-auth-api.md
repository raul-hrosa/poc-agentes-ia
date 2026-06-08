# T-004 — Auth API (register, login, refresh, logout, reset, confirm)

**Épico**: [Épico 0 — Infraestrutura](../epics/epic-0-infraestrutura.md)
**Prioridade**: P1
**Complexidade**: L (3h+)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `AuthModule` do NestJS com todos os 7 endpoints do TechSpec. Registro cria psicólogo + subscription com trial de 14 dias + envia e-mail de confirmação. Login retorna access token RS256 (15 min) no body + refresh token opaque em httpOnly cookie. Refresh renova o access token. Logout revoga o refresh token. Forgot/reset password com link que expira em 1h. Confirm email ativa a conta. Bloqueio de conta após 5 tentativas falhas (15 min).

## Critérios de aceite

- [ ] `POST /auth/register` cria psicólogo + subscription (trialing, trial_ends_at = now+14d) + envia e-mail de confirmação; conta inativa até confirmar
- [ ] `POST /auth/login` com e-mail/senha retorna `{ access_token }` + seta `refresh_token` em httpOnly cookie `Secure; SameSite=Strict`; 5 falhas → `locked_until = now + 15min`
- [ ] `POST /auth/refresh` lê cookie, valida hash, retorna novo access token
- [ ] `POST /auth/logout` revoga refresh token (seta `revoked_at`)
- [ ] `POST /auth/forgot-password` envia link com token que expira em 1h
- [ ] `POST /auth/reset-password?token=` redefine senha e invalida o token
- [ ] `POST /auth/confirm-email?token=` seta `email_confirmed = 1` e invalida token
- [ ] `JwtStrategy` valida RS256 e popula `req.user = { id, email, plan }`

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

- [ ] `auth.service.ts` — pendente
- [ ] `auth.controller.ts` — pendente
- [ ] `JwtStrategy` — pendente
- [ ] DTOs — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
