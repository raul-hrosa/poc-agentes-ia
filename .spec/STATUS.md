# STATUS.md — Estado atual do projeto

## Projeto

Nome: URL Shortener Pessoal
Iniciado em: 2026-04-22

## Fase atual

Fase: 2 — Specs
Feature especificada: persistencia-de-links
Próxima feature pendente: criacao-de-link
Aguardando: decisão do usuário (nova spec ou tasks de persistencia-de-links)

## Gates

- [x] Fase 0 — Produto: aprovado em 2026-04-22
- [x] Fase 1 — Arquitetura: aprovado em 2026-04-22
- [x] Fase 2 — Specs
- [x] Fase 3 — Tarefas: aprovado em 2026-04-22
- [ ] Fase 4 — Implementação
- [ ] Fase 5 — Revisão
- [ ] Fase 6 — Bug fix

## Aprovações

- product.md: aprovado
- mvp-scope.md: aprovado
- tech-stack.md: aprovado
- architecture.md: aprovado
- data-model.md: aprovado
- definition-of-done.md: aprovado
- features/persistencia-de-links.md: aprovado em 2026-04-22
- tasks/persistencia-de-links.md: aprovado em 2026-04-22

## Decisões registradas

| ADR | Decisão |
|---|---|
| ADR/stack-escolha.md | Next.js full-stack em vez de backend separado + frontend separado |
| ADR/redirect-middleware.md | Redirecionamento por slug no middleware Next.js em vez de API route |
| ADR/db-singleton.md | Singleton de conexão SQLite para evitar conflitos com HMR em desenvolvimento |

## Tasks em andamento

| Task | Target path | Depende de | done | can_parallelize |
| --- | --- | --- | --- | --- |
| task-01 | `drizzle.config.ts`, `package.json` | — | true | false |
| task-02 | `drizzle/schema.ts` | task-01 | true | false |
| task-03 | `drizzle/migrations/`, `data/.gitkeep` | task-02 | false | false |
| task-04 | `src/lib/db.ts` | task-02 | false | false |
| task-05 | `.env.example`, `.gitignore` | task-03 | false | false |

## Histórico

- 2026-04-22: Projeto iniciado. Briefing coletado. Perguntas de refinamento respondidas.
- 2026-04-22: product.md e mvp-scope.md criados. Fase 0 aprovada.
- 2026-04-22: tech-stack.md, architecture.md, data-model.md e definition-of-done.md criados. 3 ADRs registrados. Fase 1 aguardando aprovação.
- 2026-04-22: Fase 1 aprovada. Iniciando Fase 2 — Specs. Primeira feature: persistencia-de-links.
- 2026-04-22: Spec de persistencia-de-links criada. 5 user stories, 14 critérios de aceite (AC-01 a AC-14). Aprovada.
- 2026-04-22: Aguardando decisão: especificar próxima feature (criacao-de-link) ou avançar para tasks de persistencia-de-links.
- 2026-04-22: Tasks de persistencia-de-links criadas. 5 tasks em 5 camadas. Aguardando aprovação.
