# T-012 — Upload de Documentos do Paciente (R2, API + frontend)

**Épico**: [Épico 1 — Pacientes](../epics/epic-1-pacientes.md)
**Prioridade**: P2
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar upload e listagem de documentos do paciente (PDF, JPG, PNG, máx. 10MB/arquivo, 50MB/paciente no Pro). O NestJS valida MIME type e tamanho, faz stream direto ao R2 (sem buffer em memória), e registra em `patient_documents`. O frontend exibe lista de documentos com nome, tamanho e data, permite download via URL presigned (TTL 1h) e exclusão com confirmação.

## Critérios de aceite

- [ ] `POST /patients/:id/documents` aceita `multipart/form-data`; rejeita MIME inválido (só PDF, JPG, PNG) e arquivo > 10MB
- [ ] `GET /patients/:id/documents` lista documentos com URL presigned para download (TTL 1h)
- [ ] `DELETE /patients/:id/documents/:docId` remove do R2 e do banco
- [ ] Frontend exibe lista com ícone por tipo, nome, tamanho formatado e data de upload
- [ ] Drag-and-drop ou clique para upload; progress bar durante envio
- [ ] Plano Pro: erro amigável se total de uploads do paciente ultrapassar 50MB

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/patients/dto/upload-document.dto.ts`; `apps/web/src/components/patients/documents-tab.tsx`
- **Arquivos a modificar**: `apps/api/src/patients/patients.service.ts` e `patients.controller.ts`
- **R2Service**: `stream` do arquivo diretamente para R2; `r2_object_key = patients/{psychologist_id}/{patient_id}/{uuid}.{ext}`
- **shadcn/ui**: `Table`, `Button`, `Badge`, `Progress`
- **DB**: tabela `patient_documents`

## Dependências

- Requer: [T-002] — `R2Service`
- Requer: [T-009] — aba Documentos na ficha

## Progresso

- [ ] Upload API — pendente
- [ ] `documents-tab.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
