# T-034 — Frontend Dashboard (cards, alertas, lista do dia)

**Épico**: [Épico 7 — Dashboard e Insights](../epics/epic-7-dashboard.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar a página principal `(dashboard)/page.tsx` com visão geral do consultório. Layout com cards de métricas no topo, lista de sessões do dia ao centro e alertas laterais. Design limpo e legível — esta é a primeira página que o psicólogo vê ao fazer login.

## Critérios de aceite

- [ ] Cards: "Sessões hoje" (com horários), "Prontuários pendentes" (badge de contagem), "Inadimplências" (valor em aberto)
- [ ] Lista de sessões do dia com nome do paciente, horário, status e botão de ação rápida (marcar status, abrir prontuário)
- [ ] Alerta "Pacientes em risco de abandono" com lista de pacientes e dias sem sessão
- [ ] Card "Prontuários pendentes" destaca sessões realizadas sem evolução registrada — link direto para o editor
- [ ] React Query com `staleTime: 60000` (1 min); refresh automático ao voltar para a aba
- [ ] Loading skeleton durante carregamento inicial

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/(dashboard)/page.tsx`, `components/dashboard/today-sessions.tsx`, `components/dashboard/metric-card.tsx`, `components/dashboard/abandonment-alert.tsx`, `hooks/use-dashboard.ts`
- **shadcn/ui**: `Card`, `Badge`, `Button`, `Avatar`, `Separator`, `Skeleton`
- **Layout**: grid responsivo — mobile: 1 coluna; tablet: 2 colunas; desktop: 3 colunas para cards + lista full width

## Dependências

- Requer: [T-033] — API dashboard
- Requer: [T-005] — frontend autenticado com layout do dashboard

## Progresso

- [ ] `dashboard/page.tsx` — pendente
- [ ] Componentes de cards e alertas — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
