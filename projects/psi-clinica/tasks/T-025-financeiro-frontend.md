# T-025 — Frontend Financeiro (registro manual, lista, relatório)

**Épico**: [Épico 4 — Controle Financeiro](../epics/epic-4-financeiro.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar a página `(dashboard)/financial/` com três seções: **Pagamentos** (lista filtrada + botão registrar), **Inadimplência** (lista de sessões em aberto por paciente) e **Relatório** (resumo financeiro por período). O modal de registro de pagamento permite selecionar múltiplas sessões para quitar de uma vez. Saldo devedor exibido por paciente.

## Critérios de aceite

- [ ] Lista de pagamentos filtrável por paciente e período
- [ ] Modal "Registrar pagamento": select de paciente, campo valor, forma de pagamento, data, seleção múltipla de sessões a quitar
- [ ] Seção Inadimplência lista pacientes com número de sessões em aberto e valor total; botão "Cobrar" leva ao modal de pagamento ou comunicação
- [ ] Relatório exibe: receita total do período, gráfico/tabela por forma de pagamento, taxa de inadimplência
- [ ] Componente `PaymentModal` reutilizável (chamado também de `T-017` ao marcar sessão como realizada)

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/(dashboard)/financial/page.tsx`, `components/financial/payment-modal.tsx`, `components/financial/delinquency-list.tsx`, `components/financial/financial-report.tsx`, `hooks/use-financial.ts`
- **shadcn/ui**: `Tabs`, `Table`, `Dialog`, `Form`, `Select`, `Checkbox`, `DateRangePicker`
- **Valor monetário**: sempre exibir em centavos / 100, formatar como `R$ X.XXX,XX`

## Dependências

- Requer: [T-024] — API financeira
- Requer: [T-005] — frontend autenticado

## Progresso

- [ ] `financial/page.tsx` — pendente
- [ ] `payment-modal.tsx` — pendente
- [ ] `delinquency-list.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
