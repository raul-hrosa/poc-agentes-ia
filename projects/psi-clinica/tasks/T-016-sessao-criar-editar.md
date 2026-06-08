# T-016 — Frontend Criar/Editar Sessão (modal, recorrência, bloqueios)

**Épico**: [Épico 2 — Agenda](../epics/epic-2-agenda.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar o modal de criação/edição de sessão usado tanto na agenda (`T-015`) quanto na ficha do paciente (`T-009`). Campos: paciente (Select com busca), data, hora, duração, modalidade (presencial/online), valor, recorrência (única/semanal/quinzenal/mensal). Ao editar sessão recorrente, perguntar se aplica a "esta sessão" ou "esta e todas as futuras". Conflito de horário exibe erro inline.

## Critérios de aceite

- [ ] Modal abre com campos pré-preenchidos quando editando sessão existente
- [ ] Select de paciente filtra por nome com debounce; exibe avatar e nome
- [ ] Campo recorrência expande opções apenas quando selecionado (não "única")
- [ ] Ao submeter com conflito de horário, exibe mensagem com o nome do paciente conflitante e o horário
- [ ] Ao editar sessão recorrente, Dialog pergunta "Apenas esta" ou "Esta e todas as futuras"
- [ ] `useMutation` invalida cache de sessões ao salvar com sucesso

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/components/schedule/session-modal.tsx`, `components/schedule/recurrence-fields.tsx`
- **shadcn/ui**: `Dialog`, `Form`, `Select`, `DatePicker` (Popover + Calendar), `Input`, `RadioGroup`, `Switch`
- **DatePicker**: usar `react-day-picker` (já vem com shadcn/ui Calendar) + `date-fns` para formatação
- **Conflito**: tratar erro 409 da API e exibir mensagem amigável no campo de data/hora

## Dependências

- Requer: [T-013] — API de sessões
- Requer: [T-015] — agenda (onde o modal é chamado primariamente)

## Progresso

- [ ] `session-modal.tsx` — pendente
- [ ] `recurrence-fields.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
