# T-018 — API de Prontuário (CRUD criptografado, versionamento)

**Épico**: [Épico 3 — Prontuário Digital](../epics/epic-3-prontuario.md)
**Prioridade**: P1
**Complexidade**: L (3h+)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `RecordsModule` com CRUD de evoluções de sessão com criptografia AES-256-CBC. Criar evolução criptografa `content` e `private_notes`. Editar copia a versão anterior para `medical_record_versions` antes de atualizar (incrementa `version`). Nunca permitir DELETE. Exportação do prontuário completo gera PDF via Puppeteer, faz upload no R2, retorna URL presigned (TTL 24h) e registra em `audit_logs`.

## Critérios de aceite

- [ ] `POST /patients/:id/records` cria evolução com `content_encrypted` e `private_notes_encrypted` via `CryptoService`
- [ ] `PATCH /patients/:id/records/:rid` copia row atual para `medical_record_versions` antes de UPDATE; incrementa `version`
- [ ] `GET /patients/:id/records/:rid/versions` retorna histórico descriptografado ordenado por versão
- [ ] Endpoint de DELETE não existe (404); tentativa de DELETE retorna 405
- [ ] `POST /patients/:id/export` gera PDF com marca d'água (CRP + data), registra em `audit_logs` com `action: 'prontuario_exported'`, retorna `{ url, expiresAt }`
- [ ] `private_notes` descriptografadas nunca incluídas na exportação PDF

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/records/records.module.ts`, `records.controller.ts`, `records.service.ts`, `dto/create-record.dto.ts`, `dto/update-record.dto.ts`, `entities/medical-record.entity.ts`, `entities/medical-record-version.entity.ts`
- **CryptoService**: injetado apenas em `RecordsService`; descriptografar apenas registros do período solicitado (paginação)
- **PDF export**: `PdfService.renderProntuario(patient, records, psychologist)` → HTML template → Puppeteer → Buffer → R2 upload
- **Audit log**: inserir em `audit_logs` após toda exportação e acesso ao prontuário
- **DB**: tabelas `medical_records`, `medical_record_versions`

## Dependências

- Requer: [T-002] — `CryptoService`, `R2Service`, `PdfService`
- Requer: [T-003] — tabelas de prontuário

## Progresso

- [ ] `records.service.ts` (criptografia + versionamento) — pendente
- [ ] `records.controller.ts` — pendente
- [ ] Exportação PDF — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
