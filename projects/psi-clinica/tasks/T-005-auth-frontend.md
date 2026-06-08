# T-005 — Auth Frontend (login, register, forgot-password + api.ts)

**Épico**: [Épico 0 — Infraestrutura](../epics/epic-0-infraestrutura.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar as páginas de autenticação em `app/(auth)/` e o wrapper `lib/api.ts` que intercepta 401 para renovar o access token automaticamente. As páginas usam shadcn/ui `Form`, `Input`, `Button` e React Hook Form com Zod. O middleware Next.js protege rotas do dashboard. O access token é armazenado em memória (variável de módulo); o refresh token está no httpOnly cookie e é renovado via `POST /auth/refresh` em background.

## Critérios de aceite

- [ ] Página `/login` valida campos, exibe erro de credenciais inválidas, redireciona para `/` após login
- [ ] Página `/register` valida todos os campos (senha mín. 8 chars, 1 maiúscula, 1 número), exibe mensagem de sucesso e instrução para confirmar e-mail
- [ ] Página `/forgot-password` envia requisição e exibe feedback
- [ ] `lib/api.ts`: toda request inclui `Authorization: Bearer <token>`; ao receber 401, chama `/auth/refresh`, atualiza token em memória e repete a request original
- [ ] Middleware Next.js redireciona usuário não autenticado de `/dashboard/*` para `/login`
- [ ] `useAuth()` hook expõe `user`, `logout()` e `isLoading`

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/(auth)/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/middleware.ts`, `apps/web/src/hooks/use-auth.ts`
- **api.ts**: módulo com `let accessToken: string | null` em escopo de módulo; função `apiFetch(path, options)` que adiciona header, trata 401 com retry único
- **Middleware**: `matcher: ['/(dashboard)/:path*']`; verifica presença de token ou tenta refresh silencioso
- **shadcn/ui**: instalar `Form`, `Input`, `Button`, `Label`, `Card` via `npx shadcn-ui@latest add`

## Dependências

- Requer: [T-001] — Next.js app scaffoldado
- Requer: [T-004] — Auth API funcionando

## Progresso

- [ ] `apps/web/src/lib/api.ts` — pendente
- [ ] Páginas (auth) — pendente
- [ ] Middleware — pendente
- [ ] `useAuth` hook — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
