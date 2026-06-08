# T-022 — API Documentos Clínicos e Exportação Prontuário PDF

**Épico**: [Épico 3 — Prontuário Digital](../epics/epic-3-prontuario.md)
**Prioridade**: P2
**Complexidade**: L (3h+)
**Status**: ⬜ Pendente

## O que fazer

Criar o `DocumentsModule` para geração de documentos clínicos em PDF via Puppeteer: declaração de comparecimento, relatório psicológico, encaminhamento e atestado. Cada documento é gerado a partir de um template HTML, pre-preenchido com dados do paciente e psicólogo, exportado para PDF, armazenado no R2 e registrado em `clinical_documents`. Retornar URL presigned (TTL 24h). Registrar toda geração em `audit_logs`.

## Critérios de aceite

- [ ] `POST /documents/generate` aceita `{ document_type, patient_id, custom_fields }` e retorna `{ url, document_id }`
- [ ] Templates preenchidos automaticamente com: nome do paciente, CRP do psicólogo, data, nome do psicólogo
- [ ] PDF inclui marca d'água com CRP + data em rotação 45°
- [ ] `GET /patients/:id/clinical-documents` lista documentos gerados do paciente
- [ ] Toda geração registrada em `audit_logs` com `action: 'document_generated'`
- [ ] `GET /documents/:id/download` retorna URL presigned atualizada se o documento já existe

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/documents/documents.module.ts`, `documents.controller.ts`, `documents.service.ts`, `templates/attendance-declaration.html`, `templates/psychological-report.html`, `templates/referral.html`, `templates/attendance-certificate.html`
- **PdfService**: `renderHtmlToPdf(html: string): Promise<Buffer>` via Puppeteer em worker separado
- **R2 key pattern**: `documents/{psychologist_id}/{patient_id}/{type}/{uuid}.pdf`
- **DB**: tabela `clinical_documents`

## Dependências

- Requer: [T-002] — `PdfService`, `R2Service`
- Requer: [T-003] — tabela `clinical_documents`, `audit_logs`
- Requer: [T-007] — dados do paciente para preencher template

## Progresso

- [ ] Templates HTML — pendente
- [ ] `documents.service.ts` — pendente
- [ ] Registro em audit_logs — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
