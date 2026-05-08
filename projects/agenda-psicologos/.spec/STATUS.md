# STATUS — agenda-psicologos

## Fase atual: Concluído — MVP entregue

## Estado: mvp-done

## Fases
- [x] Fase 0 — Produto (product.md, mvp-scope.md)
- [x] Fase 1 — Arquitetura (tech-stack.md, architecture.md, data-model.md, definition-of-done.md)
- [x] Fase 1.5 — Bootstrap (runtime-constraints.md ✅ | design-tokens.md ✅ | bootstrap.md ✅ | bootstrap-agent: concluído)
- [x] Fase 2 — Specs
- [x] Fase 3 — Tarefas
- [x] Fase 4 — Implementação
- [x] Fase 4.5 — Build Gate (passed — typecheck ✅ | build ✅ | test ✅ 438/438)
- [x] Fase 5 — Revisão (todas as features aprovadas)

## Gates
- produto_aprovado: true
- arquitetura_aprovada: true
- runtime_constraints: criado (2026-05-07)
- design_tokens: criado (2026-05-07)
- bootstrap_aprovado: true (2026-05-07)
- build_gate_bootstrap: passed (typecheck ✅ | build ✅ | test 438/438 ✅)
- specs_aprovadas: true
- tarefas_aprovadas: true
- implementacao_aprovada: true
- revisao_aprovada: true

## Blockers ativos

Nenhum blocker ativo.

## Stack definida: sim
## Resumo: Next.js 14 + TypeScript + Prisma + PostgreSQL (Supabase) + Vercel

## Specs criadas

| Feature              | Arquivo                          | Status                                             |
|----------------------|----------------------------------|----------------------------------------------------|
| autenticacao         | features/autenticacao.md         | spec: aprovada — review: approved (com ressalvas)  |
| cadastro-pacientes   | features/cadastro-pacientes.md   | spec: aprovada — review: approved                  |
| agenda-consultas     | features/agenda-consultas.md     | spec: aprovada — review: approved                  |
| lembretes-consulta   | features/lembretes-consulta.md   | spec: aprovada — review: approved                  |
| confirmacao-paciente | features/confirmacao-paciente.md | spec: aprovada — review: approved                  |
| prontuario-sessao    | features/prontuario-sessao.md    | spec: aprovada — review: approved                  |
| controle-financeiro  | features/controle-financeiro.md  | spec: aprovada — review: approved                  |
| polimento-visual     | features/polimento-visual.md     | spec: aprovada — tasks: aprovadas |

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
| polimento-visual     | tasks/polimento-visual.md     | tasks: aprovadas |

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
| prontuario-sessao/TASK-01      | done   |
| prontuario-sessao/TASK-02      | done   |
| prontuario-sessao/TASK-03      | done   |
| prontuario-sessao/TASK-04      | done   |
| prontuario-sessao/TASK-06      | done   |
| prontuario-sessao/TASK-05      | done   |
| controle-financeiro/TASK-01    | done   |
| controle-financeiro/TASK-02    | done   |
| controle-financeiro/TASK-03    | done   |
| controle-financeiro/TASK-04    | done   |
| controle-financeiro/TASK-05    | done   |
| controle-financeiro/TASK-06    | done   |
| controle-financeiro/TASK-07    | done   |

| lembretes-consulta/TASK-01   | done   |
| lembretes-consulta/TASK-02   | done   |
| lembretes-consulta/TASK-03   | done   |
| lembretes-consulta/TASK-04   | done   |
| lembretes-consulta/TASK-05   | done   |
| lembretes-consulta/TASK-06   | done   |
| lembretes-consulta/TASK-07   | done   |
| lembretes-consulta/TASK-08   | done   |
| confirmacao-paciente/TASK-01 | done   |
| confirmacao-paciente/TASK-02 | done   |
| confirmacao-paciente/TASK-03 | done   |
| confirmacao-paciente/TASK-04 | done   |
| confirmacao-paciente/TASK-05 | done   |
| polimento-visual/TASK-01     | done   |

## Blockers ativos

Nenhum blocker ativo.

## Decisões registradas

| Arquivo | Decisão |
|---|---|
| ADR/session-payments-schema-missing.md | SessionPayment ausente no schema Prisma — adicionado modelo e migration |
| ADR/monolito-vs-microsservicos.md | Monolito modular Next.js — sem backend separado |
| ADR/multitenancy-rls.md | Isolamento por user_id com Row Level Security no PostgreSQL |
| ADR/token-confirmacao.md | Tokens de confirmação gerados com HMAC-SHA256, expiração 72h, uso único |
| ADR/auth-prontuario-cfp.md | Supabase Auth satisfaz requisito CFP — sem segunda senha no MVP |
| ADR/user-id-denormalizacao-rls.md | user_id denormalizado em session_notes e session_payments para RLS eficiente |
| ADR/prisma-version-7x.md | Prisma 7.x com @prisma/adapter-mariadb para MySQL — breaking changes documentados |
| ADR/zod-version-4x.md | Zod 4.x instalado pelo pnpm — usar .issues em vez de .errors nos testes |
| ADR/patient-actions-user-plan.md | Buscar plan do usuário via query Prisma nas actions — AuthUser não expõe plan |
| ADR/nextjs14-webpack-node-scheme.md | webpack externals para node: scheme do Prisma 7.x + serverComponentsExternalPackages |
| ADR/notes-url-integration-appointmentdetails.md | URLs de prontuário corrigidas: `/notes/new?appointment=[id]` e `/notes/[noteId]` — AppointmentDetails.tsx atualizado |
| ADR/patients-dynamic-segment-consistency.md | Rota `patients/[id]/notes` usa `[id]` para consistência com outras rotas do módulo patients |

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
- 2026-05-02: Review de agenda-consultas concluído pelo review-agent — needs-fix: 1 blocker (BLK-01: clique em consulta no WeeklyCalendar navega para DayView em vez de abrir AppointmentDetailPanel, viola AC-10)
- 2026-05-02: agenda-consultas — BLK-01 corrigido: WeeklyCalendar agora abre AppointmentDetailPanel ao clicar em consulta
- 2026-05-07: Re-review de agenda-consultas — approved após correção de BLK-01
- 2026-05-02: prontuario-sessao/TASK-01 concluída — schema Zod e tipos TypeScript do módulo notes criados
- 2026-05-02: prontuario-sessao/TASK-02 concluída — queries getSessionNoteByAppointment, getSessionNoteById e getPatientSessionNotes criadas com testes
- 2026-05-02: prontuario-sessao/TASK-03 concluída — Server Actions createSessionNote, updateSessionNote e deleteSessionNote criadas com testes
- 2026-05-02: prontuario-sessao/TASK-04 concluída — página /notes/new, SessionNoteForm e AppointmentNotCompletedError criados
- 2026-05-02: prontuario-sessao/TASK-06 concluída — página /patients/[id]/notes, PatientNotesList e truncateNotePreview criados com testes
- 2026-05-02: prontuario-sessao/TASK-05 concluída — página /notes/[note_id], SessionNoteView e integração na página de detalhes da consulta
- 2026-05-02: Feature prontuario-sessao — todas as 6 tasks concluídas
- 2026-05-02: controle-financeiro/TASK-01 concluída — tipos TypeScript, schemas Zod e utilitários formatCurrency/parseCurrencyToCents criados; modelo SessionPayment adicionado ao schema Prisma
- 2026-05-02: controle-financeiro/TASK-02 concluída — queries getFinancialSummary, getSessionPaymentsByPeriod e getSessionPaymentByAppointment criadas com testes
- 2026-05-02: controle-financeiro/TASK-03 concluída — Server Actions createSessionPayment e updateSessionPayment criadas com testes
- 2026-05-02: controle-financeiro/TASK-04 concluída — componente PaymentSheet criado como sheet lateral com formulário de criação e edição
- 2026-05-02: controle-financeiro/TASK-05 concluída — AppointmentPaymentSection integrado em /appointments/[id] para consultas realizadas
- 2026-05-02: controle-financeiro/TASK-06 concluída — página /financeiro com UpgradeGate (plano free) e FinancialDashboard (plano pro) criados
- 2026-05-02: controle-financeiro/TASK-07 concluída — testes de integração createSessionPayment, updateSessionPayment e getFinancialSummary criados
- 2026-05-02: Feature controle-financeiro — todas as tasks concluídas
- 2026-05-03: lembretes-consulta — todas as 8 tasks concluídas
- 2026-05-03: Review de lembretes-consulta concluído pelo review-agent — approved
- 2026-05-03: confirmacao-paciente/TASK-01 concluída — tipos TypeScript e schema Zod para cancelamento de consulta criados
- 2026-05-03: confirmacao-paciente/TASK-02 concluída — queries getAppointmentsForWeek e getAppointmentById atualizadas com join em appointment_tokens
- 2026-05-03: confirmacao-paciente/TASK-03 concluída — Server Action cancelAppointment criada com transação atômica
- 2026-05-04: confirmacao-paciente/TASK-04 concluída — AppointmentStatusBadge criado e blocos da agenda atualizados com indicadores visuais de status
- 2026-05-04: confirmacao-paciente/TASK-05 concluída — CancelAppointmentDialog criado e painel de detalhes atualizado com botão de cancelamento, badge de status e dados do token
- 2026-05-07: Review de prontuario-sessao concluído pelo review-agent — approved (2 minors sem blockers)
- 2026-05-07: Review de controle-financeiro concluído pelo review-agent — needs-fix: BLK-01 (mensagem de erro para valor não numérico incorreta em AC-19)
- 2026-05-07: controle-financeiro — BLK-01 corrigido: schema Zod separado em dois .refine() sequenciais; 8/8 testes passando
- 2026-05-07: MVP concluído — todas as 7 features implementadas e aprovadas
- 2026-05-07: Bootstrap retroativo executado — homepage, layout autenticado, dashboard, seed.ts, .env.example e migration init criados
- 2026-05-07: Build gate bootstrap: typecheck ✅ | build ✅ | test 438/438 ✅ | runtime violation corrigida (middleware → auth.config)
- 2026-05-07: Bootstrap aprovado pelo usuário — gate bootstrap_aprovado: true
- 2026-05-07: MVP concluído e aprovado — todas as fases entregues, projeto em estado final
- 2026-05-07: Spec de polimento-visual criada pelo spec-agent — aguardando aprovação
- 2026-05-08: polimento-visual/TASK-01 concluída — paleta warm-sage aplicada, Toaster global configurado
