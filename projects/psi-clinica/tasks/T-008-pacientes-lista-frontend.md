# T-008 — Frontend Lista de Pacientes (busca, filtros, status)

**Épico**: [Épico 1 — Pacientes](../epics/epic-1-pacientes.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar a página `(dashboard)/patients/` com lista paginada de pacientes, busca por nome/telefone em tempo real (debounce 300ms), filtros por status (ativo/em pausa/arquivado) e botão de criar novo paciente com modal. A lista exibe nome, avatar, telefone, status e próxima sessão. Usar React Query com paginação por cursor e `useInfiniteQuery` para scroll infinito.

## Critérios de aceite

- [ ] Lista exibe pacientes com avatar (fallback com iniciais), nome, telefone, status e próxima sessão
- [ ] Busca em tempo real (debounce 300ms) filtra por nome; campo limpo mostra todos
- [ ] Filtro de status por tab (Todos / Ativos / Em pausa / Arquivados)
- [ ] Scroll infinito carrega próxima página via cursor
- [ ] Modal "Novo paciente" com formulário validado (campos obrigatórios + feedback de erro)
- [ ] Ao atingir limite de 8 pacientes (plano Gratuito), botão desabilitado com tooltip explicativo

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/(dashboard)/patients/page.tsx`, `components/patients/patient-list.tsx`, `components/patients/patient-card.tsx`, `components/patients/create-patient-modal.tsx`, `hooks/use-patients.ts`
- **React Query**: `useInfiniteQuery(['patients', q, status], fetchPatients, { getNextPageParam: lastPage => lastPage.nextCursor })`
- **shadcn/ui**: `Table`, `Input`, `Tabs`, `Dialog`, `Form`, `Avatar`, `Badge`, `Button`, `Tooltip`
- **Debounce**: `useDebouncedValue(searchTerm, 300)` customizado

## Dependências

- Requer: [T-005] — frontend autenticado com `api.ts`
- Requer: [T-007] — API de pacientes

## Progresso

- [ ] `patients/page.tsx` — pendente
- [ ] `patient-list.tsx` + `patient-card.tsx` — pendente
- [ ] `create-patient-modal.tsx` — pendente
- [ ] `hooks/use-patients.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
