# T-023 — Frontend Geração de Documentos Clínicos

**Épico**: [Épico 3 — Prontuário Digital](../epics/epic-3-prontuario.md)
**Prioridade**: P2
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Adicionar aba **Documentos** na ficha do paciente com botões para gerar cada tipo de documento clínico e lista dos documentos já gerados. Ao clicar "Gerar", abre modal para confirmar dados (pré-preenchidos com dados do paciente/psicólogo) e campos extras específicos do tipo (ex: relatório tem campo "Finalidade"). Após geração, abre PDF em nova aba.

## Critérios de aceite

- [ ] Aba Documentos lista documentos gerados com tipo, data e botão de download
- [ ] Cards/botões para cada tipo: Declaração de Comparecimento, Relatório Psicológico, Encaminhamento, Atestado
- [ ] Modal de confirmação exibe dados que serão incluídos; permite editar campos adicionais
- [ ] Loading durante geração do PDF com mensagem "Gerando documento..."
- [ ] Download abre URL presigned em nova aba

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/components/records/documents-tab.tsx`, `components/records/generate-document-modal.tsx`, `hooks/use-documents.ts`
- **shadcn/ui**: `Card`, `Dialog`, `Button`, `Form`, `Textarea`, `Table`
- **Tempo de resposta**: geração de PDF via Puppeteer pode demorar 2-5s; usar `isPending` do `useMutation` para feedback

## Dependências

- Requer: [T-009] — ficha do paciente (aba Documentos)
- Requer: [T-022] — API de documentos clínicos

## Progresso

- [ ] `documents-tab.tsx` — pendente
- [ ] `generate-document-modal.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
