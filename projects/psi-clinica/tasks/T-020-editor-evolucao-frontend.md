# T-020 — Frontend Editor de Evolução Tiptap (vinculado à sessão)

**Épico**: [Épico 3 — Prontuário Digital](../epics/epic-3-prontuario.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Adicionar aba **Prontuário** na ficha do paciente com lista de evoluções e editor Tiptap para criar/editar. Cada evolução é vinculada a uma sessão (Select). Editor suporta negrito, itálico e listas. Campo de notas privadas separado (exibido apenas para o psicólogo, não exportável — ícone de cadeado). Histórico de versões acessível via botão "Ver histórico" com lista de versões e data/hora.

## Critérios de aceite

- [ ] Lista de evoluções exibe data da sessão vinculada, prévia do conteúdo e indicador de notas privadas
- [ ] Clicar em evolução abre editor Tiptap com conteúdo existente
- [ ] Toolbar com negrito, itálico, lista numerada, lista com marcadores
- [ ] Campo "Notas privadas" separado, com ícone de cadeado e tooltip "Não exportável"
- [ ] "Nova evolução" permite selecionar sessão (mostra sessões sem prontuário primeiro)
- [ ] Botão "Exportar prontuário" chama `POST /patients/:id/export` e abre URL presigned em nova aba
- [ ] Botão "Ver histórico" lista versões com data/hora de edição

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/components/records/records-tab.tsx`, `components/records/record-editor.tsx`, `components/records/record-list.tsx`, `components/records/record-history-modal.tsx`, `hooks/use-records.ts`
- **Tiptap**: `@tiptap/react`, `@tiptap/starter-kit`; salva como JSON (`editor.getJSON()`) e renderiza como HTML (`editor.getHTML()`)
- **shadcn/ui**: `Tabs`, `Sheet` (editor lateral), `Button`, `Select`, `Tooltip`, `ScrollArea`
- **Auto-save**: debounce 2s após parar de digitar; indicador "Salvando..." / "Salvo"

## Dependências

- Requer: [T-009] — ficha do paciente
- Requer: [T-018] — API de prontuário

## Progresso

- [ ] `record-editor.tsx` (Tiptap) — pendente
- [ ] `records-tab.tsx` — pendente
- [ ] `hooks/use-records.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
