# Épico 5 — Comunicação Ética

## Objetivo

Central de templates de mensagem revisados pelo CFP, envio manual via WhatsApp/e-mail, histórico por paciente e (plano Pro) automações de lembrete via BullMQ.

## Tarefas

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-028](../tasks/T-028-comunicacao-api.md) | API comunicação (templates CRUD, envio, logs) | P1 | M | ⬜ |
| [T-029](../tasks/T-029-jobs-lembretes.md) | Jobs de lembretes (RemindersScheduler @Cron + ReminderWorker BullMQ) | P2 | M | ⬜ |
| [T-030](../tasks/T-030-comunicacao-frontend.md) | Frontend comunicação (templates, enviar mensagem, histórico) | P1 | M | ⬜ |

## Dependências

- Requer épico 0 — auth, Resend, banco
- Requer épico 1 — pacientes
- Requer épico 2 — sessões (lembretes vinculados a sessões)
- T-029 requer Upstash Redis configurado

## Definição de pronto

- [ ] Todas as tarefas do épico concluídas
- [ ] Revisão feita (agents/05-review.md)
- [ ] Testes criados (agents/06-tester.md)
