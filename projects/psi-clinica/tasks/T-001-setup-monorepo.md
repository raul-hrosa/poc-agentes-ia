# T-001 — Setup do Monorepo (Turborepo + workspaces)

**Épico**: [Épico 0 — Infraestrutura](../epics/epic-0-infraestrutura.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ✅ Concluído

## O que fazer

Criar a estrutura do monorepo com npm workspaces + Turborepo. O monorepo tem três pacotes: `apps/api` (NestJS), `apps/web` (Next.js 14) e `packages/types` (@psiclinica/types). Configurar `turbo.json` com pipelines de build, dev e typecheck. Configurar TypeScript `strict` em todos os pacotes com `tsconfig.base.json` na raiz. Criar `.env.example` para api e web.

## Critérios de aceite

- [x] `npm run dev` na raiz inicia api (porta 3001) e web (porta 3000) em paralelo via Turborepo
- [x] `npm run build` compila os três pacotes sem erros
- [x] `packages/types` exporta tipos básicos usáveis em api e web via `@psiclinica/types`
- [x] TypeScript strict habilitado e `npm run typecheck` passa nos três pacotes
- [x] `.env.example` documenta todas as variáveis necessárias de cada app

## Notas técnicas

- **Arquivos a criar**: `package.json` (raiz), `turbo.json`, `tsconfig.base.json`, `apps/api/`, `apps/web/`, `packages/types/`
- **Turborepo pipeline**: `build` depende de `^build`; `dev` roda em paralelo; `typecheck` depende de `^typecheck`
- **@psiclinica/types**: começar com tipos básicos — `Psychologist`, `Patient`, `Session`, `Subscription`
- **NestJS**: scaffold via `nest new apps/api --skip-git --package-manager npm`
- **Next.js**: scaffold via `npx create-next-app@latest apps/web --typescript --tailwind --app --src-dir --skip-git`

## Dependências

Nenhuma — ponto de partida.

## Progresso

- [x] `package.json` raiz com workspaces — ✅ concluído
- [x] `turbo.json` configurado — ✅ concluído
- [x] `packages/types` criado — ✅ concluído
- [x] `apps/api` scaffold NestJS — ✅ concluído
- [x] `apps/web` scaffold Next.js — ✅ concluído
- [x] `.env.example` documentado — ✅ concluído

## Checklist de conclusão

- [x] Código implementado e funcionando
- [x] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados) — N/A (infra, sem UI)
- [ ] Loading state implementado — N/A (infra, sem UI)
- [ ] Tratamento de erro com feedback ao usuário — N/A (infra, sem UI)
- [x] Status atualizado para ✅ neste arquivo
- [x] BACKLOG.md atualizado
