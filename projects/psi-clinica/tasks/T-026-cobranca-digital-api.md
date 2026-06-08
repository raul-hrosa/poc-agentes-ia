# T-026 — API Cobrança Digital Stripe (charges + webhook)

**Épico**: [Épico 4 — Controle Financeiro](../epics/epic-4-financeiro.md)
**Prioridade**: P2
**Complexidade**: L (3h+)
**Status**: ⬜ Pendente

## O que fazer

Adicionar ao `FinancialModule` a geração de cobranças digitais via Stripe (plano Pro): criar Payment Intent ou Payment Link no Stripe, armazenar em `charges`, e processar o webhook `payment_intent.succeeded` para marcar automaticamente como pago e criar o `payment` correspondente.

## Critérios de aceite

- [ ] `POST /financial/charges` (PlanGuard 'pro'): cria `PaymentIntent` no Stripe, insere em `charges` com `status='pending'`, retorna `{ chargeId, stripePaymentLink }`
- [ ] `GET /financial/charges?status=pending` lista cobranças abertas
- [ ] `PATCH /financial/charges/:id/cancel` cancela `PaymentIntent` no Stripe e atualiza `status='cancelled'`
- [ ] Webhook `payment_intent.succeeded`: atualiza `charges.status='paid'` + cria `payment` automaticamente + associa à `session_id` se houver
- [ ] `stripe.webhooks.constructEvent()` valida assinatura antes de processar

## Notas técnicas

- **Arquivos a modificar**: `apps/api/src/financial/financial.service.ts`, `financial.controller.ts`
- **Arquivos a criar**: `dto/create-charge.dto.ts`
- **Arquivos a modificar**: `apps/api/src/webhooks/webhooks.controller.ts` — adicionar handler `payment_intent.succeeded`
- **Stripe**: `stripe.paymentIntents.create({ amount, currency: 'brl', metadata: { chargeId } })` + `stripe.paymentLinks.create()` para link de cobrança
- **DB**: tabela `charges`

## Dependências

- Requer: [T-024] — `FinancialModule` base criado
- Requer: [T-035] — Stripe configurado com `STRIPE_SECRET_KEY`
- Requer: [T-036] — `WebhooksModule` com handler Stripe

## Progresso

- [ ] `POST /financial/charges` — pendente
- [ ] Webhook `payment_intent.succeeded` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
