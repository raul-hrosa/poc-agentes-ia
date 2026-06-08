# T-013 — API de Sessões (CRUD, recorrência, conflito de horário)

**Épico**: [Épico 2 — Agenda](../epics/epic-2-agenda.md)
**Prioridade**: P1
**Complexidade**: L (3h+)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `SessionsModule` com criação de sessões únicas e recorrentes, detecção de conflito de horário, mudança de status com regras de negócio e edição individual ou "esta e todas as futuras". Sessão recorrente gera `session_recurrences` + até 52 `sessions` em uma transaction. Conflito de horário bloqueia criação se outro paciente tem sessão no mesmo slot.

## Critérios de aceite

- [ ] `POST /sessions` (única): cria sessão, rejeita se há conflito de horário no mesmo slot
- [ ] `POST /sessions` (recorrente): transaction que insere `session_recurrences` + até 52 `sessions` em bulk; rejeita inteiramente se qualquer sessão tiver conflito
- [ ] `PATCH /sessions/:id/status` aceita `completed` apenas se `scheduled_at <= NOW()`; resposta inclui `promptPayment: true`
- [ ] `PATCH /sessions/:id` com `editMode: 'this_and_future'` atualiza sessão atual + todas as futuras da recorrência
- [ ] `DELETE /sessions/:id` faz soft delete (seta `status = 'cancelled_psychologist'`), nunca hard delete
- [ ] `GET /sessions?from=&to=` retorna sessões do período com dados do paciente

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/sessions/sessions.module.ts`, `sessions.controller.ts`, `sessions.service.ts`, `dto/create-session.dto.ts`, `dto/update-session-status.dto.ts`, `entities/session.entity.ts`, `entities/session-recurrence.entity.ts`, `entities/schedule-block.entity.ts`
- **Conflito de horário**: `SELECT COUNT(*) FROM sessions WHERE psychologist_id=? AND status NOT IN ('cancelled_patient','cancelled_psychologist','rescheduled') AND scheduled_at < :endsAt AND DATE_ADD(scheduled_at, INTERVAL duration_min MINUTE) > :startsAt`
- **Bulk insert recorrência**: `DataSource.createQueryBuilder().insert().into(Session).values([...]).execute()`
- **DB**: tabelas `sessions`, `session_recurrences`

## Dependências

- Requer: [T-003] — tabelas de sessões
- Requer: [T-007] — pacientes para associar à sessão

## Progresso

- [ ] `sessions.service.ts` (conflito + recorrência) — pendente
- [ ] `sessions.controller.ts` — pendente
- [ ] DTOs — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
