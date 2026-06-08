# T-029 — Jobs de Lembretes (RemindersScheduler @Cron + ReminderWorker BullMQ)

**Épico**: [Épico 5 — Comunicação Ética](../epics/epic-5-comunicacao.md)
**Prioridade**: P2
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `JobsModule` com `RemindersScheduler` (cron a cada hora) e `ReminderWorker` (processa fila BullMQ). O scheduler busca sessões que precisam de lembrete em 2h e 24h e enfileira jobs. O worker interpola o template, envia por e-mail (Resend) ou registra log de WhatsApp, com retry 3x com backoff exponencial. Jobs são idempotentes (verifica se lembrete já foi enviado).

## Critérios de aceite

- [ ] `@Cron('0 * * * *')`: enfileira jobs para sessões com `scheduled_at` entre now+1h50min e now+2h10min (lembrete 2h) e between now+23h50min e now+24h10min (lembrete 24h)
- [ ] Jobs apenas para psicólogos com plano Pro (automações são feature Pro)
- [ ] `ReminderWorker` processa job: busca template de lembrete, interpola variáveis, envia/registra
- [ ] Se lembrete já foi enviado para a sessão+tipo (check em `communication_logs`), job é descartado (idempotência)
- [ ] Retry 3x com backoff exponencial (1s, 4s, 16s) configurado no BullMQ
- [ ] `@nestjs/bull` + `Bull` + `ioredis` com URL de Upstash Redis

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/jobs/jobs.module.ts`, `jobs/reminders.scheduler.ts`, `jobs/reminder.worker.ts`, `jobs/reminder-job.interface.ts`
- **BullMQ setup**: `BullModule.registerQueue({ name: 'reminders' })` no `JobsModule`; `@InjectQueue('reminders')` no scheduler
- **Job data**: `{ sessionId, psychologistId, patientId, type: '2h' | '24h' }`
- **DB**: verificar `communication_logs WHERE type='automated' AND body_snapshot LIKE '%sessionId%'` para idempotência

## Dependências

- Requer: [T-028] — `CommunicationService` para interpolar e enviar
- Requer: [T-013] — sessões para buscar no scheduler
- Requer: Upstash Redis configurado em `REDIS_URL`

## Progresso

- [ ] `reminders.scheduler.ts` — pendente
- [ ] `reminder.worker.ts` — pendente
- [ ] BullMQ config — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
