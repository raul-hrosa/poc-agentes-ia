# STATUS — agenda-psicologos

## Fase atual: 4 — Implementação

## Estado: em andamento

## Fases
- [x] Fase 0 — Produto (product.md, mvp-scope.md)
- [x] Fase 1 — Arquitetura (tech-stack.md, architecture.md, data-model.md, definition-of-done.md)
- [x] Fase 2 — Specs
- [x] Fase 3 — Tarefas
- [ ] Fase 4 — Implementação
- [ ] Fase 5 — Revisão

## Gates
- produto_aprovado: true
- arquitetura_aprovada: true
- specs_aprovadas: true
- tarefas_aprovadas: true
- implementacao_aprovada: false
- revisao_aprovada: false

## Stack definida: sim
## Resumo: Next.js 14 + TypeScript + Prisma + PostgreSQL (Supabase) + Vercel

## Specs criadas

| Feature              | Arquivo                          | Status         |
|----------------------|----------------------------------|----------------|
| cadastro-pacientes   | features/cadastro-pacientes.md   | spec: aprovada |
| agenda-consultas     | features/agenda-consultas.md     | spec: aprovada |
| lembretes-consulta   | features/lembretes-consulta.md   | spec: aprovada |
| confirmacao-paciente | features/confirmacao-paciente.md | spec: aprovada |
| prontuario-sessao    | features/prontuario-sessao.md    | spec: aprovada |
| autenticacao         | features/autenticacao.md         | spec: aprovada |
| controle-financeiro  | features/controle-financeiro.md  | spec: aprovada |

## Tasks criadas

| Feature              | Arquivo                       | Status           |
|----------------------|-------------------------------|------------------|
| autenticacao         | tasks/autenticacao.md         | tasks: aprovadas |
| cadastro-pacientes   | tasks/cadastro-pacientes.md   | tasks: aprovadas |
| agenda-consultas     | tasks/agenda-consultas.md     | tasks: aprovadas |
| lembretes-consulta   | tasks/lembretes-consulta.md   | tasks: aprovadas |
| confirmacao-paciente | tasks/confirmacao-paciente.md | tasks: aprovadas |
| prontuario-sessao    | tasks/prontuario-sessao.md    | tasks: aprovadas |
| controle-financeiro  | tasks/controle-financeiro.md  | tasks: aprovadas |

## Progresso de implementação

| Task                  | Status |
|-----------------------|--------|
| autenticacao/TASK-01  | done   |
| autenticacao/TASK-03  | done   |
| autenticacao/TASK-02  | done   |
| autenticacao/TASK-06  | done   |

## Decisões registradas

| Arquivo | Decisão |
|---|---|
| ADR/monolito-vs-microsservicos.md | Monolito modular Next.js — sem backend separado |
| ADR/multitenancy-rls.md | Isolamento por user_id com Row Level Security no PostgreSQL |
| ADR/token-confirmacao.md | Tokens de confirmação gerados com HMAC-SHA256, expiração 72h, uso único |
| ADR/auth-prontuario-cfp.md | Supabase Auth satisfaz requisito CFP — sem segunda senha no MVP |
| ADR/user-id-denormalizacao-rls.md | user_id denormalizado em session_notes e session_payments para RLS eficiente |
| ADR/prisma-version-7x.md | Prisma 7.x com @prisma/adapter-mariadb para MySQL — breaking changes documentados |

## Histórico de aprovações de specs

- cadastro-pacientes: aprovada
- agenda-consultas: aprovada em 2026-04-27
- lembretes-consulta: aprovada em 2026-04-27
- confirmacao-paciente: aprovada em 2026-04-27
- prontuario-sessao: aprovada em 2026-04-27
- autenticacao: aprovada em 2026-04-27
- controle-financeiro: aprovada em 2026-04-27

## Histórico
- 2026-04-27: Projeto criado, product-agent executou Fase 0
- 2026-04-27: Fase 0 aprovada pelo usuário, tech-agent acionado para Fase 1
- 2026-04-27: Fase 1 concluída — tech-stack.md, architecture.md, data-model.md, definition-of-done.md e 5 ADRs criados
- 2026-04-27: Fase 1 aprovada pelo usuário, spec-agent acionado para Fase 2
- 2026-04-27: Spec de cadastro-pacientes aprovada pelo usuário
- 2026-04-27: Spec de agenda-consultas criada pelo spec-agent — aguardando aprovação
- 2026-04-27: Spec de lembretes-consulta criada pelo spec-agent — aguardando aprovação
- 2026-04-27: Spec de confirmacao-paciente criada pelo spec-agent — aguardando aprovação
- 2026-04-27: Spec de confirmacao-paciente aprovada pelo usuário
- 2026-04-27: Spec de prontuario-sessao criada pelo spec-agent — aguardando aprovação
- 2026-04-27: Spec de prontuario-sessao aprovada pelo usuário
- 2026-04-27: spec-agent acionado para autenticacao
- 2026-04-27: Spec de autenticacao criada pelo spec-agent — aguardando aprovação
- 2026-04-27: Spec de autenticacao aprovada pelo usuário
- 2026-04-27: spec-agent acionado para controle-financeiro
- 2026-04-27: Spec de controle-financeiro criada pelo spec-agent — aguardando aprovação
- 2026-04-27: Spec de controle-financeiro aprovada pelo usuário
- 2026-04-27: Fase 2 concluída — todas as 7 specs aprovadas
- 2026-04-27: Fase 3 iniciada — tasks-agent acionado para autenticacao
- 2026-04-27: Tasks de autenticacao criadas pelo tasks-agent — aguardando aprovação
- 2026-04-28: Tasks de confirmacao-paciente criadas pelo tasks-agent — aguardando aprovação
- 2026-04-28: Tasks de prontuario-sessao criadas pelo tasks-agent — aguardando aprovação
- 2026-04-29: Tasks de cadastro-pacientes criadas pelo tasks-agent — aguardando aprovação
- 2026-04-29: Tasks de lembretes-consulta criadas pelo tasks-agent — aguardando aprovação
- 2026-04-29: Tasks de controle-financeiro criadas pelo tasks-agent — aguardando aprovação
- 2026-04-29: Fase 3 aprovada pelo usuário — todas as 7 tasks aprovadas, Fase 4 liberada
- 2026-04-29: TASK-01 concluída — projeto Next.js inicializado, NextAuth.js v5 configurado com Credentials Provider e Prisma Adapter (Prisma 7.x + @prisma/adapter-mariadb)
- 2026-04-29: TASK-02 concluída — modelo PasswordResetToken adicionado ao schema Prisma
- 2026-04-29: TASK-03 concluída — schemas Zod, getCurrentUser e getUserByEmail criados com testes
