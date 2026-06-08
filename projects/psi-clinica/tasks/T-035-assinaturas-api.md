# T-035 — API Assinaturas (plano atual, checkout, portal Stripe)

**Épico**: [Épico 8 — Planos e Assinatura](../epics/epic-8-assinaturas.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `SubscriptionsModule` com endpoints para consultar plano atual, criar sessão de checkout Stripe (upgrade para Pro) e abrir o Stripe Customer Portal (downgrade, cancelamento, troca de cartão). O `PlanGuard` em `T-002` já referencia este módulo para verificar o plano.

## Critérios de aceite

- [ ] `GET /subscriptions/me` retorna `{ plan, status, trialEndsAt, currentPeriodEndsAt, isTrialing }`
- [ ] `POST /subscriptions/checkout` cria `stripe.checkout.sessions.create()` com preço mensal Pro; retorna `{ url }` para redirect
- [ ] `POST /subscriptions/portal` cria `stripe.billingPortal.sessions.create()`; retorna `{ url }` para redirect
- [ ] Downgrade Pro → Gratuito (via portal): após webhook processar, pacientes acima de 8 arquivados automaticamente com `status='archived'` e psicólogo notificado por e-mail
- [ ] `PlanGuard` pode ser injetado com `DataSource` para verificar `subscriptions` sem dependência circular

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/subscriptions/subscriptions.module.ts`, `subscriptions.controller.ts`, `subscriptions.service.ts`
- **Stripe Checkout**: `mode: 'subscription'`, `success_url` e `cancel_url` apontam para frontend
- **Customer Portal**: requer `stripeCustomerId` em `subscriptions`; criar customer se não existe no Stripe
- **DB**: tabela `subscriptions`

## Dependências

- Requer: [T-003] — tabela `subscriptions`
- Requer: [T-004] — auth para criar subscription no register
- Requer: `STRIPE_SECRET_KEY` em env

## Progresso

- [ ] `subscriptions.service.ts` — pendente
- [ ] `subscriptions.controller.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
