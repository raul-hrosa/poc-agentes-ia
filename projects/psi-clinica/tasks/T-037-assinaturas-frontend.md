# T-037 — Frontend Assinaturas (página upgrade, PlanGuard no frontend)

**Épico**: [Épico 8 — Planos e Assinatura](../epics/epic-8-assinaturas.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar a página `(dashboard)/settings/subscription/` com status do plano atual, countdown do trial (se aplicável) e botão de upgrade para Pro. Implementar contexto de plano (`PlanContext`) disponível no layout do dashboard — usado por `T-027` e outros para mostrar/ocultar features Pro. Banner de trial no topo do dashboard quando o plano está em trial.

## Critérios de aceite

- [ ] Página de assinatura exibe: plano atual, status (trial/ativo/past_due), dias restantes do trial ou data de renovação
- [ ] Botão "Fazer upgrade para Pro" chama `POST /subscriptions/checkout` e redireciona para Stripe Checkout
- [ ] Botão "Gerenciar assinatura" (para Pro) chama `POST /subscriptions/portal` e redireciona para Stripe Portal
- [ ] `PlanContext` disponível no `(dashboard)/layout.tsx` com `{ plan, isTrialing, trialDaysLeft }`
- [ ] Banner de trial no topo: "Você está no trial Pro — X dias restantes. Fazer upgrade"
- [ ] Ao retornar do Stripe Checkout com `?success=true`, exibe toast de confirmação e invalida cache de plano

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/(dashboard)/settings/subscription/page.tsx`, `app/(dashboard)/layout.tsx` (ou modificar), `components/subscription/plan-banner.tsx`, `contexts/plan-context.tsx`, `hooks/use-subscription.ts`
- **shadcn/ui**: `Card`, `Badge`, `Button`, `Progress` (para trial countdown), `Alert`
- **PlanContext**: `React.createContext` com `useQuery(['subscription'])` no layout; valor disponível via `usePlan()` hook
- **URL params**: verificar `searchParams.success` na página de assinatura para mostrar feedback pós-checkout

## Dependências

- Requer: [T-035] — API de assinaturas
- Requer: [T-005] — layout do dashboard

## Progresso

- [ ] `plan-context.tsx` — pendente
- [ ] `subscription/page.tsx` — pendente
- [ ] `plan-banner.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
