# Épico 4 — Controle Financeiro

## Objetivo

Registro manual de pagamentos, controle de inadimplência, relatório financeiro e (plano Pro) geração de cobranças digitais via Stripe com marcação automática de pagamento.

## Tarefas

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-024](../tasks/T-024-financeiro-api.md) | API financeira (pagamentos manuais, inadimplência, relatório) | P1 | M | ⬜ |
| [T-025](../tasks/T-025-financeiro-frontend.md) | Frontend financeiro (registro manual, lista, relatório) | P1 | M | ⬜ |
| [T-026](../tasks/T-026-cobranca-digital-api.md) | API cobrança digital Stripe (charges + webhook) | P2 | L | ⬜ |
| [T-027](../tasks/T-027-cobranca-digital-frontend.md) | Frontend cobrança digital (gerar link, status de pagamento) | P2 | M | ⬜ |

## Dependências

- Requer épico 0 — auth e banco
- Requer épico 1 — pacientes
- Requer épico 2 — sessões (pagamento vinculado a sessão)
- T-026 requer épico 8 (T-035) — Stripe configurado

## Definição de pronto

- [ ] Todas as tarefas do épico concluídas
- [ ] Revisão feita (agents/05-review.md)
- [ ] Testes criados (agents/06-tester.md)
