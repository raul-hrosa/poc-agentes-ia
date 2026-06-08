# T-021 — Frontend Plano Terapêutico

**Épico**: [Épico 3 — Prontuário Digital](../epics/epic-3-prontuario.md)
**Prioridade**: P2
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Adicionar seção de Plano Terapêutico na aba Prontuário da ficha do paciente. Formulário com campos: objetivos de curto/médio/longo prazo, hipótese diagnóstica, CID-10, estratégias terapêuticas. Ao salvar com plano existente, exibir Dialog de confirmação "Isso criará uma nova versão do plano". Exibir data de criação e número de versão do plano ativo.

## Critérios de aceite

- [ ] Seção "Plano Terapêutico" visível na aba Prontuário
- [ ] Formulário carrega dados do plano ativo ou exibe campos vazios se inexistente
- [ ] Ao editar plano existente e salvar: Dialog "Criar nova versão do plano?" com confirmação
- [ ] Campos `cid10` com autocomplete básico (input livre, não obrigatório)
- [ ] Exibe versão atual e data de criação do plano ativo
- [ ] Ícone de cadeado indicando que dados são protegidos

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/components/records/therapeutic-plan-section.tsx`, `hooks/use-therapeutic-plan.ts`
- **shadcn/ui**: `Textarea`, `Form`, `Input`, `Button`, `Dialog`, `Badge`
- **React Query**: `useQuery(['therapeutic-plan', patientId])` + `useMutation` para POST

## Dependências

- Requer: [T-020] — aba Prontuário existente
- Requer: [T-019] — API de plano terapêutico

## Progresso

- [ ] `therapeutic-plan-section.tsx` — pendente
- [ ] `hooks/use-therapeutic-plan.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
