# T-036 — Webhook Stripe (eventos de subscription, trial end, falha)

**Épico**: [Épico 8 — Planos e Assinatura](../epics/epic-8-assinaturas.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `WebhooksModule` com handler para os 5 eventos Stripe do TechSpec. Validar assinatura com `stripe.webhooks.constructEvent()` antes de processar. Cada evento atualiza a tabela `subscriptions` conforme o estado correspondente.

## Critérios de aceite

- [ ] Endpoint `POST /webhooks/stripe` com `rawBody` (não parsed JSON) para validação de assinatura Stripe
- [ ] `checkout.session.completed` → `subscriptions`: seta `status='active'`, `stripe_subscription_id`, `current_period_ends_at`
- [ ] `invoice.payment_succeeded` → renova `current_period_ends_at`
- [ ] `invoice.payment_failed` → `status='past_due'`
- [ ] `customer.subscription.deleted` → `status='cancelled'`
- [ ] `payment_intent.succeeded` (cobrança avulsa de T-026) → `charges.status='paid'`; cria `payment` automaticamente
- [ ] Assinatura inválida retorna 400; erros internos retornam 500 (Stripe fará retry)

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/webhooks/webhooks.module.ts`, `webhooks.controller.ts`, `webhooks.service.ts`
- **Raw body**: usar `express.raw({ type: 'application/json' })` no `main.ts` para a rota `/webhooks/stripe` antes do `ValidationPipe` global
- **Idempotência**: Stripe pode reenviar o mesmo evento; verificar `stripe_subscription_id` antes de atualizar
- **DB**: tabela `subscriptions`, `charges`, `payments`

## Dependências

- Requer: [T-035] — `SubscriptionsModule` e `SubscriptionsService`
- Requer: [T-024] — `FinancialService` para criar `payment` automático

## Progresso

- [ ] `webhooks.controller.ts` com raw body — pendente
- [ ] Handlers dos 5 eventos — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
