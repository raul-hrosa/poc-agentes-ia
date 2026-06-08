# Épico 8 — Planos e Assinatura

## Objetivo

Gestão de planos Free/Pro com trial automático de 14 dias, upgrade/downgrade via Stripe, e enforcement de limites de plano nos módulos existentes.

## Tarefas

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-035](../tasks/T-035-assinaturas-api.md) | API assinaturas (plano atual, checkout, portal Stripe) | P1 | M | ⬜ |
| [T-036](../tasks/T-036-webhook-stripe-assinatura.md) | Webhook Stripe (eventos de subscription, trial end, falha) | P1 | M | ⬜ |
| [T-037](../tasks/T-037-assinaturas-frontend.md) | Frontend assinaturas (página upgrade, PlanGuard no frontend) | P1 | M | ⬜ |

## Dependências

- Requer épico 0 — auth e banco
- `PlanGuard` no backend já implementado em T-002

## Definição de pronto

- [ ] Todas as tarefas do épico concluídas
- [ ] Revisão feita (agents/05-review.md)
- [ ] Testes criados (agents/06-tester.md)
