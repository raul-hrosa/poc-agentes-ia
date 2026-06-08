# T-015 — Frontend Agenda (views semana/dia/mês com Calendar)

**Épico**: [Épico 2 — Agenda](../epics/epic-2-agenda.md)
**Prioridade**: P1
**Complexidade**: L (3h+)
**Status**: ⬜ Pendente

## O que fazer

Criar a página `(dashboard)/schedule/` com visualizações de semana (padrão), dia e mês. Usar `@fullcalendar/react` ou construir sobre o `Calendar` do shadcn/ui. Sessões são exibidas como eventos coloridos por status. Clicar em evento abre sidebar com detalhes. Clicar em slot vazio abre modal de criação. Navegar entre semanas/meses com setas. Bloqueios de período exibidos em cinza.

## Critérios de aceite

- [ ] View semana é o padrão; botões para alternar para dia e mês
- [ ] Sessões exibidas com cor por status (agendada=azul, confirmada=verde, realizada=cinza, falta=vermelho, cancelada=strikethrough)
- [ ] Clicar em sessão abre sidebar lateral com: paciente, hora, status, link para prontuário
- [ ] Clicar em slot vazio pre-preenche modal de criação com data/hora do slot
- [ ] Bloqueios de período exibidos como fundo cinza no intervalo
- [ ] React Query com `staleTime: 30000` para dados da agenda; invalidar ao criar/editar sessão

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/(dashboard)/schedule/page.tsx`, `components/schedule/calendar-view.tsx`, `components/schedule/session-sidebar.tsx`, `hooks/use-sessions.ts`
- **Biblioteca**: `@fullcalendar/react` + `@fullcalendar/daygrid` + `@fullcalendar/timegrid` + `@fullcalendar/interaction` (alternativa: construir grid customizado com `date-fns`)
- **shadcn/ui**: `Sheet` para sidebar, `Badge` para status, `Button` para navegação
- **Performance**: buscar apenas sessões do período visível (`from=`, `to=`)

## Dependências

- Requer: [T-013] — API de sessões
- Requer: [T-014] — bloqueios
- Requer: [T-005] — frontend autenticado

## Progresso

- [ ] `calendar-view.tsx` — pendente
- [ ] `session-sidebar.tsx` — pendente
- [ ] `hooks/use-sessions.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
