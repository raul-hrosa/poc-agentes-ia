# T-010 — API de Anamnese (criar/atualizar, dados criptografados)

**Épico**: [Épico 1 — Pacientes](../epics/epic-1-pacientes.md)
**Prioridade**: P2
**Complexidade**: S (< 1h)
**Status**: ⬜ Pendente

## O que fazer

Adicionar os endpoints de anamnese ao `PatientsModule` (ou criar sub-módulo). `GET /patients/:id/anamnese` descriptografa todos os campos antes de retornar. `PUT /patients/:id/anamnese` cria ou atualiza (upsert) criptografando todos os campos sensíveis via `CryptoService`. O campo `custom_fields` (JSON) não é criptografado.

## Critérios de aceite

- [ ] `GET /patients/:id/anamnese` retorna texto plano descriptografado dos campos clínicos
- [ ] `PUT /patients/:id/anamnese` criptografa `chief_complaint`, `history`, `medications`, `general_health`, `family_history`, `therapeutic_goals` antes de gravar
- [ ] Upsert: cria registro se não existe, atualiza se existe (respeitando `UNIQUE(patient_id)`)
- [ ] `psychologist_id` verificado em toda query (ownership)
- [ ] `custom_fields` aceita array de `{label, type, value}` sem criptografia

## Notas técnicas

- **Arquivos a modificar**: `apps/api/src/patients/patients.service.ts`, `patients.controller.ts`
- **Arquivos a criar**: `dto/upsert-anamnese.dto.ts`, `entities/anamnese.entity.ts`
- **CryptoService**: injetado no `PatientsModule`; criptografar cada campo individualmente
- **DB**: tabela `anamneses`, `UNIQUE(patient_id)`

## Dependências

- Requer: [T-002] — `CryptoService`
- Requer: [T-003] — tabela `anamneses`
- Requer: [T-007] — `PatientsModule` criado

## Progresso

- [ ] `anamnese.entity.ts` — pendente
- [ ] Endpoints de anamnese — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
