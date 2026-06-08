# T-033 — API Dashboard (métricas do dia, inadimplência, abandono, pendências)

**Épico**: [Épico 7 — Dashboard e Insights](../epics/epic-7-dashboard.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar endpoint dedicado de dashboard que agrega dados de múltiplos módulos em uma única query eficiente. Retornar: sessões de hoje com dados do paciente, sessões sem prontuário (pendentes), pacientes inadimplentes (2+ sessões em aberto), pacientes sem sessão há 30+ dias (risco de abandono). Usar queries otimizadas — não fazer N+1.

## Critérios de aceite

- [ ] `GET /dashboard` retorna objeto com: `todaySessions`, `pendingRecords`, `delinquencyAlert`, `abandonmentRisk`
- [ ] `todaySessions`: sessões do dia atual com nome do paciente, horário, status, `hasMedicalRecord`
- [ ] `pendingRecords`: sessões com `status='completed'` sem `medical_records` vinculado nos últimos 30 dias
- [ ] `delinquencyAlert`: count de pacientes com 2+ sessões realizadas e sem pagamento
- [ ] `abandonmentRisk`: pacientes ativos sem sessão nos últimos 30 dias (ordenados por último atendimento)
- [ ] Resposta em <200ms: usar queries com JOIN ao invés de múltiplas queries separadas

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/dashboard/dashboard.module.ts`, `dashboard.controller.ts`, `dashboard.service.ts`
- **Query pendingRecords**: `SELECT s.* FROM sessions s LEFT JOIN medical_records mr ON mr.session_id = s.id WHERE s.psychologist_id=? AND s.status='completed' AND mr.id IS NULL AND s.scheduled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
- **Query abandonmentRisk**: `SELECT p.*, MAX(s.scheduled_at) as last_session FROM patients p LEFT JOIN sessions s ON s.patient_id=p.id WHERE p.psychologist_id=? AND p.status='active' GROUP BY p.id HAVING last_session < DATE_SUB(NOW(), INTERVAL 30 DAY) OR last_session IS NULL`

## Dependências

- Requer: todos os módulos anteriores (agrega dados de sessions, records, payments, patients)

## Progresso

- [ ] `dashboard.service.ts` com queries otimizadas — pendente
- [ ] `dashboard.controller.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
