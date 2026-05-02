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

| Task                           | Status |
|--------------------------------|--------|
| autenticacao/TASK-01           | done   |
| autenticacao/TASK-03           | done   |
| autenticacao/TASK-02           | done   |
| autenticacao/TASK-06           | done   |
| autenticacao/TASK-04           | done   |
| autenticacao/TASK-05           | done   |
| autenticacao/TASK-07           | done   |
| autenticacao/TASK-08           | done   |
| autenticacao/TASK-09           | done   |
| autenticacao/TASK-10           | done   |
| cadastro-pacientes/TASK-01     | done   |
| cadastro-pacientes/TASK-02     | done   |
| cadastro-pacientes/TASK-03     | done   |
| cadastro-pacientes/TASK-04     | done   |
| cadastro-pacientes/TASK-05     | done   |
| cadastro-pacientes/TASK-06     | done   |
| cadastro-pacientes/TASK-07     | done   |
| agenda-consultas/TASK-01       | done   |
| agenda-consultas/TASK-02       | done   |
| agenda-consultas/TASK-03       | done   |
| agenda-consultas/TASK-04       | done   |
| agenda-consultas/TASK-05       | done   |
| agenda-consultas/TASK-06       | done   |
| agenda-consultas/TASK-07       | done   |
| agenda-consultas/TASK-08       | done   |
| agenda-consultas/TASK-09       | done   |

## Blockers ativos

_Nenhum blocker ativo._

## Decisões registradas

| Arquivo | Decisão |
|---|---|
| ADR/monolito-vs-microsservicos.md | Monolito modular Next.js — sem backend separado |
| ADR/multitenancy-rls.md | Isolamento por user_id com Row Level Security no PostgreSQL |
| ADR/token-confirmacao.md | Tokens de confirmação gerados com HMAC-SHA256, expiração 72h, uso único |
| ADR/auth-prontuario-cfp.md | Supabase Auth satisfaz requisito CFP — sem segunda senha no MVP |
| ADR/user-id-denormalizacao-rls.md | user_id denormalizado em session_notes e session_payments para RLS eficiente |
| ADR/prisma-version-7x.md | Prisma 7.x com @prisma/adapter-mariadb para MySQL — breaking changes documentados |
| ADR/zod-version-4x.md | Zod 4.x instalado pelo pnpm — usar .issues em vez de .errors nos testes |
| ADR/patient-actions-user-plan.md | Buscar plan do usuário via query Prisma nas actions — AuthUser não expõe plan |
| ADR/nextjs14-webpack-node-scheme.md | webpack externals para node: scheme do Prisma 7.x + serverComponentsExternalPackages |

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
- 2026-04-29: TASK-06 concluída — middleware de proteção de rotas e estrutura (public)/(auth) criados
- 2026-04-29: TASK-04 concluída — Server Action registerUser implementada com testes
- 2026-04-29: TASK-05 concluída — Server Actions forgotPassword e resetPassword implementadas com testes
- 2026-04-30: TASK-07 concluída — página /register e componente RegisterForm criados
- 2026-04-30: TASK-08 concluída — página /login, LoginForm e SessionProvider criados
- 2026-04-30: TASK-09 concluída — páginas /forgot-password e /reset-password com formulários criados
- 2026-04-30: TASK-10 concluída — UserMenu com logout e layout (auth) implementados
- 2026-04-30: Feature autenticacao — todas as 10 tasks concluídas, acionando review-agent
- 2026-04-30: Review de autenticacao concluído pelo review-agent — aprovado com ressalva (MAJ-01: toast ausente no AC-26)
- 2026-04-30: cadastro-pacientes/TASK-01 concluída — tipos TypeScript e schema Zod da feature patients criados
- 2026-04-30: cadastro-pacientes/TASK-02 concluída — queries getActivePatients, getArchivedPatients, getPatientById e countActivePatients criadas
- 2026-04-30: cadastro-pacientes/TASK-03 concluída — Server Actions createPatient, updatePatient, archivePatient e restorePatient criadas
- 2026-05-01: cadastro-pacientes/TASK-04 concluída — página /patients com listagem, abas, busca e restauração implementadas
- 2026-05-01: cadastro-pacientes/TASK-05 concluída — página /patients/[id] com perfil e arquivamento implementados
- 2026-05-01: cadastro-pacientes/TASK-06 concluída — formulários /patients/new e /patients/[id]/edit implementados
- 2026-05-01: cadastro-pacientes/TASK-07 concluída — testes de integração de actions, queries e utils criados
- 2026-05-01: Review de cadastro-pacientes concluído pelo review-agent — needs-fix: 2 blockers (acesso direto ao Prisma em new/page.tsx, cast as unknown as em PatientFormPage.tsx) e 1 major (threshold de busca 1 caractere vs 2 exigidos)
- 2026-05-01: cadastro-pacientes — BLK-01, BLK-02 e MAJ-01 corrigidos após review
- 2026-05-01: Re-review de cadastro-pacientes — approved após correções de BLK-01, BLK-02 e MAJ-01
- 2026-05-01: agenda-consultas/TASK-01 concluída — tipos TypeScript e schemas Zod da feature appointments criados
- 2026-05-01: agenda-consultas/TASK-02 concluída — queries getWeekAppointments, getDayAppointments, getAppointmentById, getPatientAppointments e getConflictingAppointments criadas
- 2026-05-01: agenda-consultas/TASK-03 concluída — Server Actions createAppointment e updateAppointment criadas
- 2026-05-01: agenda-consultas/TASK-04 concluída — Server Actions cancelAppointment, completeAppointment e markNoShow criadas
- 2026-05-01: agenda-consultas/TASK-05 concluída — visualização semanal /appointments com WeeklyCalendar, AppointmentCard e StatusBadge criados
- 2026-05-02: agenda-consultas/TASK-06 concluída — visualização diária /appointments/day/[date], DayView, AppointmentDetailPanel e CancelDialog criados
- 2026-05-02: agenda-consultas/TASK-07 concluída — páginas /appointments/new e /appointments/[id]/edit com AppointmentForm criados
- 2026-05-02: agenda-consultas/TASK-08 concluída — página /appointments/[id] com AppointmentDetails criada
- 2026-05-02: agenda-consultas/TASK-09 concluída — testes de integração dos 5 fluxos de agenda criados
