# T-014 — API de Bloqueios de Período e Slots Disponíveis

**Épico**: [Épico 2 — Agenda](../epics/epic-2-agenda.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Adicionar ao `SessionsModule` os endpoints de bloqueios (`schedule_blocks`) e de slots disponíveis. `GET /schedule/available-slots?date=` calcula slots livres cruzando grade de disponibilidade semanal (`schedule_availability`) com sessões existentes e bloqueios do período. `POST /schedule/blocks` alerta se existem sessões no intervalo do bloqueio.

## Critérios de aceite

- [ ] `POST /schedule/blocks` cria bloqueio; se sessões existem no período, retorna `{ warning: true, conflictingSessions: [...] }` mas cria mesmo assim (psicólogo decide)
- [ ] `DELETE /schedule/blocks/:id` remove bloqueio
- [ ] `GET /schedule/available-slots?date=2025-06-10` retorna array de slots `{ startsAt, endsAt }` baseado em `schedule_availability` menos sessões e bloqueios do dia
- [ ] Slots respeitam `session_duration_min` e `gap_between_sessions_min` do perfil do psicólogo
- [ ] Slots respeitam `min_booking_advance_hours` (não retorna slots no passado ou dentro do mínimo de antecedência)

## Notas técnicas

- **Arquivos a modificar**: `apps/api/src/sessions/sessions.service.ts`, `sessions.controller.ts`
- **Arquivos a criar**: `dto/create-schedule-block.dto.ts`
- **Algoritmo de slots**: carregar `schedule_availability` para o dia da semana → gerar slots com `duration_min + gap_min` → filtrar os que colidem com sessões e bloqueios existentes
- **DB**: tabela `schedule_blocks`

## Dependências

- Requer: [T-013] — `SessionsModule` criado
- Requer: [T-006] — disponibilidade semanal do psicólogo

## Progresso

- [ ] Endpoints de bloqueios — pendente
- [ ] Algoritmo de slots disponíveis — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
