# T-017 — Frontend Mudança de Status da Sessão

**Épico**: [Épico 2 — Agenda](../epics/epic-2-agenda.md)
**Prioridade**: P1
**Complexidade**: S (< 1h)
**Status**: ⬜ Pendente

## O que fazer

Implementar o fluxo de mudança de status da sessão via dropdown na sidebar (`T-015`) e na ficha do paciente (`T-009`). Ao marcar como "Realizada", exibir Dialog perguntando se deseja registrar pagamento agora (sim → abre modal de pagamento, não → apenas atualiza status). Status possíveis: Agendada → Confirmada → Realizada / Falta / Cancelada / Reagendada.

## Critérios de aceite

- [ ] Dropdown de status exibe apenas as transições válidas a partir do status atual
- [ ] Ao selecionar "Realizada", Dialog "Deseja registrar o pagamento agora?" com botões "Sim" e "Agora não"
- [ ] "Sim" abre modal de pagamento pré-preenchido com valor da sessão e paciente
- [ ] Loading spinner no botão enquanto `PATCH /sessions/:id/status` processa
- [ ] Status atualizado otimisticamente no cache do React Query
- [ ] Badge de status atualiza com a cor correta após mudança

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/components/schedule/session-status-dropdown.tsx`, `components/schedule/complete-session-dialog.tsx`
- **shadcn/ui**: `DropdownMenu`, `Dialog`, `Button`, `Badge`
- **React Query**: `useMutation` com `onMutate` para update otimista; `onError` para rollback
- **Modal de pagamento**: reutiliza componente de T-025 (ou placeholder até lá)

## Dependências

- Requer: [T-015] — sidebar da agenda onde o dropdown é usado
- Requer: [T-013] — API de mudança de status

## Progresso

- [ ] `session-status-dropdown.tsx` — pendente
- [ ] `complete-session-dialog.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
