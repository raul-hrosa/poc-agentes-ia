# T-027 — Frontend Cobrança Digital (gerar link, status)

**Épico**: [Épico 4 — Controle Financeiro](../epics/epic-4-financeiro.md)
**Prioridade**: P2
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Adicionar seção "Cobrança Digital" na página financeira (visível apenas para plano Pro). Botão "Gerar cobrança" abre modal com select de paciente, valor e sessões vinculadas. Após gerar, exibe o link de pagamento Stripe para copiar/enviar. Lista de cobranças pendentes com status (pendente, pago, expirado, cancelado) e botão de cancelar.

## Critérios de aceite

- [ ] Seção "Cobrança Digital" exibida apenas para usuários com plano Pro (hidden + tooltip para Free)
- [ ] Modal "Nova cobrança" com select de paciente, valor pré-preenchido com saldo devedor, campo de vencimento
- [ ] Após gerar: exibe link de pagamento com botão "Copiar" e botão "Enviar via WhatsApp" (monta `wa.me` com o link)
- [ ] Lista de cobranças com badge de status colorido (pendente=amarelo, pago=verde, expirado=cinza, cancelado=vermelho)
- [ ] Botão "Cancelar cobrança" com confirmação para cobranças pendentes

## Notas técnicas

- **Arquivos a modificar**: `apps/web/src/app/(dashboard)/financial/page.tsx`
- **Arquivos a criar**: `components/financial/charge-modal.tsx`, `components/financial/charges-list.tsx`
- **shadcn/ui**: `Dialog`, `Form`, `Badge`, `Button`, `Tooltip`, `Table`
- **PlanGuard frontend**: verificar `subscription.plan === 'pro' || 'clinic'` antes de renderizar seção

## Dependências

- Requer: [T-025] — página financeira existente
- Requer: [T-026] — API de cobranças
- Requer: [T-037] — contexto de plano no frontend

## Progresso

- [ ] `charge-modal.tsx` — pendente
- [ ] `charges-list.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
