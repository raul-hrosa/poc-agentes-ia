# T-024 — API Financeira (pagamentos manuais, inadimplência, relatório)

**Épico**: [Épico 4 — Controle Financeiro](../epics/epic-4-financeiro.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `FinancialModule` com registro manual de pagamentos (um pagamento pode quitar múltiplas sessões via `payment_sessions`), lista de inadimplências (sessões realizadas sem pagamento) e relatório financeiro por período. O sistema mantém saldo devedor por paciente calculando sessões realizadas menos pagamentos.

## Critérios de aceite

- [ ] `POST /financial/payments` insere em `payments` + `payment_sessions` (array de `session_ids`) em transaction
- [ ] `GET /financial/delinquencies?from=&to=&patient_id=` retorna sessões realizadas sem pagamento associado
- [ ] `GET /financial/report?from=&to=` retorna: receita total, receita por paciente, receita por forma de pagamento, sessões pagas vs. inadimplentes
- [ ] `GET /financial/payments?patient_id=&from=&to=` lista pagamentos com nome do paciente e sessões vinculadas
- [ ] Saldo devedor por paciente = sum(session.price_cents WHERE status=completed) - sum(payment.amount_cents)
- [ ] Dashboard alerta quando paciente tem 2+ sessões sem pagamento (dado disponível no endpoint de inadimplências)

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/financial/financial.module.ts`, `financial.controller.ts`, `financial.service.ts`, `dto/create-payment.dto.ts`
- **payment_sessions**: sem entidade TypeORM; usar `DataSource.query()` para INSERT na tabela de join
- **Relatório**: queries agregadas por período; exportação PDF/CSV via `PdfService` (opcional para MVP, priorizar JSON)
- **DB**: tabelas `payments`, `payment_sessions`

## Dependências

- Requer: [T-003] — tabelas financeiras
- Requer: [T-013] — sessões para vincular pagamentos

## Progresso

- [ ] `financial.service.ts` — pendente
- [ ] `financial.controller.ts` — pendente
- [ ] DTOs — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
