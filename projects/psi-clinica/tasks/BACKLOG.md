# Backlog — PsiClínica

## Épico 0: Infraestrutura

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-001](T-001-setup-monorepo.md) | Setup do monorepo (Turborepo + workspaces) | P1 | M | ✅ |
| [T-002](T-002-setup-nestjs-base.md) | Setup NestJS base (guards, pipes, crypto, R2, mail) | P1 | M | ✅ |
| [T-003](T-003-migrations-banco.md) | Migrations MySQL completas (todas as tabelas) | P1 | M | ✅ |
| [T-004](T-004-auth-api.md) | Auth API (register, login, refresh, logout, reset, confirm) | P1 | L | ✅ |
| [T-005](T-005-auth-frontend.md) | Auth frontend (login, register, forgot-password + api.ts) | P1 | M | ⬜ |
| [T-006](T-006-perfil-psicologo.md) | Perfil do psicólogo (API + frontend settings) | P1 | M | ⬜ |

## Épico 1: Pacientes

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-007](T-007-pacientes-api.md) | API de pacientes (CRUD, arquivar, limite plano) | P1 | M | ⬜ |
| [T-008](T-008-pacientes-lista-frontend.md) | Frontend lista de pacientes (busca, filtros, status) | P1 | M | ⬜ |
| [T-009](T-009-paciente-ficha-frontend.md) | Frontend ficha do paciente (abas: Resumo, Sessões, Financeiro) | P1 | M | ⬜ |
| [T-010](T-010-anamnese-api.md) | API de anamnese (criar/atualizar, dados criptografados) | P2 | S | ⬜ |
| [T-011](T-011-anamnese-frontend.md) | Frontend anamnese | P2 | S | ⬜ |
| [T-012](T-012-documentos-paciente.md) | Upload de documentos do paciente (R2, API + frontend) | P2 | M | ⬜ |

## Épico 2: Agenda

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-013](T-013-sessoes-api.md) | API de sessões (CRUD, recorrência, conflito de horário) | P1 | L | ⬜ |
| [T-014](T-014-bloqueios-slots-api.md) | API de bloqueios de período e slots disponíveis | P1 | M | ⬜ |
| [T-015](T-015-agenda-frontend.md) | Frontend agenda (views semana/dia/mês com Calendar) | P1 | L | ⬜ |
| [T-016](T-016-sessao-criar-editar.md) | Frontend criar/editar sessão (modal, recorrência, bloqueios) | P1 | M | ⬜ |
| [T-017](T-017-sessao-status.md) | Frontend mudança de status da sessão | P1 | S | ⬜ |

## Épico 3: Prontuário Digital

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-018](T-018-prontuario-api.md) | API de prontuário (CRUD criptografado, versionamento) | P1 | L | ⬜ |
| [T-019](T-019-plano-terapeutico-api.md) | API de plano terapêutico (criptografado, versões) | P2 | M | ⬜ |
| [T-020](T-020-editor-evolucao-frontend.md) | Frontend editor de evolução Tiptap | P1 | M | ⬜ |
| [T-021](T-021-plano-terapeutico-frontend.md) | Frontend plano terapêutico | P2 | M | ⬜ |
| [T-022](T-022-documentos-clinicos-api.md) | API documentos clínicos e exportação prontuário PDF | P2 | L | ⬜ |
| [T-023](T-023-documentos-clinicos-frontend.md) | Frontend geração de documentos clínicos | P2 | M | ⬜ |

## Épico 4: Controle Financeiro

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-024](T-024-financeiro-api.md) | API financeira (pagamentos manuais, inadimplência, relatório) | P1 | M | ⬜ |
| [T-025](T-025-financeiro-frontend.md) | Frontend financeiro (registro manual, lista, relatório) | P1 | M | ⬜ |
| [T-026](T-026-cobranca-digital-api.md) | API cobrança digital Stripe (charges + webhook) | P2 | L | ⬜ |
| [T-027](T-027-cobranca-digital-frontend.md) | Frontend cobrança digital | P2 | M | ⬜ |

## Épico 5: Comunicação Ética

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-028](T-028-comunicacao-api.md) | API comunicação (templates CRUD, envio, logs) | P1 | M | ⬜ |
| [T-029](T-029-jobs-lembretes.md) | Jobs de lembretes (RemindersScheduler + ReminderWorker BullMQ) | P2 | M | ⬜ |
| [T-030](T-030-comunicacao-frontend.md) | Frontend comunicação (templates, enviar mensagem, histórico) | P1 | M | ⬜ |

## Épico 6: Agendamento Público

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-031](T-031-agendamento-publico-api.md) | API pública (perfil, slots disponíveis, book) | P2 | M | ⬜ |
| [T-032](T-032-agendamento-publico-frontend.md) | Frontend página pública de agendamento ([slug]) | P2 | M | ⬜ |

## Épico 7: Dashboard e Insights

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-033](T-033-dashboard-api.md) | API dashboard (métricas do dia, inadimplência, abandono) | P1 | M | ⬜ |
| [T-034](T-034-dashboard-frontend.md) | Frontend dashboard (cards, alertas, lista do dia) | P1 | M | ⬜ |

## Épico 8: Planos e Assinatura

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-035](T-035-assinaturas-api.md) | API assinaturas (plano atual, checkout, portal Stripe) | P1 | M | ⬜ |
| [T-036](T-036-webhook-stripe-assinatura.md) | Webhook Stripe (eventos de subscription, trial end, falha) | P1 | M | ⬜ |
| [T-037](T-037-assinaturas-frontend.md) | Frontend assinaturas (página upgrade, PlanGuard no frontend) | P1 | M | ⬜ |

---

## Features (pós-MVP)

| ID | Título | Status |
|----|--------|--------|
| — | Gestão multiprofissional / clínica | — |
| — | Emissão de nota fiscal eletrônica | — |
| — | Telemedicina / videochamada integrada | — |
| — | App mobile nativo | — |
| — | WhatsApp Business API | — |
| — | Relatórios Pro avançados (taxa de falta, retenção, horários produtivos) | — |

## Bugs

| ID | Título | Status |
|----|--------|--------|
| — | — | — |

## UI/Layout

| ID | Título | Status |
|----|--------|--------|
| — | — | — |

---

## Ordem de desenvolvimento recomendada

1. **T-001** → Monorepo: estrutura que tudo depende
2. **T-002** → NestJS base: guards, crypto, serviços comuns
3. **T-003** → Migrations: schema completo antes de qualquer feature
4. **T-035 + T-036** → Assinaturas + Webhook Stripe: precisa existir para T-004 criar trial corretamente
5. **T-004** → Auth API: register já cria subscription em trial
6. **T-005** → Auth frontend: login/cadastro + api.ts com refresh
7. **T-006** → Perfil: grade de horários usada pela agenda
8. **T-007** → Pacientes API: base para sessões e prontuário
9. **T-008 + T-009** → Pacientes frontend: lista e ficha
10. **T-013 + T-014** → Sessões API: lógica de conflito e recorrência
11. **T-015 + T-016 + T-017** → Agenda frontend: calendar, modal, status
12. **T-018 + T-020** → Prontuário API + editor Tiptap: core clínico
13. **T-024 + T-025** → Financeiro: pagamentos manuais
14. **T-033 + T-034** → Dashboard: visão geral do consultório
15. **T-028 + T-030** → Comunicação: templates e envio
16. **T-010 + T-011** → Anamnese
17. **T-019 + T-021** → Plano terapêutico
18. **T-022 + T-023** → Documentos clínicos PDF
19. **T-012** → Upload de documentos do paciente
20. **T-029** → Jobs de lembretes BullMQ
21. **T-031 + T-032** → Agendamento público
22. **T-026 + T-027** → Cobrança digital Stripe
23. **T-037** → Frontend assinaturas / upgrade
24. **T-036** (webhook cobrança avulsa) → parte do épico 4

---

## Progresso

- Total MVP: 37 tarefas
- Concluídas: 2 / 37
- Em andamento: —
