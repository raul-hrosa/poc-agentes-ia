# T-019 — API de Plano Terapêutico (criptografado, versões)

**Épico**: [Épico 3 — Prontuário Digital](../epics/epic-3-prontuario.md)
**Prioridade**: P2
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Adicionar ao `RecordsModule` os endpoints de plano terapêutico. `GET /patients/:id/therapeutic-plan` retorna o plano ativo (sem `superseded_at`). `POST /patients/:id/therapeutic-plan` seta `superseded_at = now()` no plano anterior e cria novo com `version` incrementado. Todos os campos criptografados via `CryptoService`.

## Critérios de aceite

- [ ] `GET /patients/:id/therapeutic-plan` retorna plano ativo descriptografado ou `null` se não existe
- [ ] `POST /patients/:id/therapeutic-plan` seta `superseded_at` no plano anterior (se existir) e insere novo plano
- [ ] Campos criptografados: `short_term_goals`, `mid_term_goals`, `long_term_goals`, `diagnosis_hypothesis`, `strategies`
- [ ] `cid10` não criptografado (para futuros filtros)
- [ ] `psychologist_id` verificado em toda query

## Notas técnicas

- **Arquivos a modificar**: `apps/api/src/records/records.service.ts`, `records.controller.ts`
- **Arquivos a criar**: `dto/create-therapeutic-plan.dto.ts`, `entities/therapeutic-plan.entity.ts`
- **Transaction**: `superseded_at` update + INSERT do novo plano em uma transaction
- **DB**: tabela `therapeutic_plans`

## Dependências

- Requer: [T-018] — `RecordsModule` criado com `CryptoService`

## Progresso

- [ ] Entidade + DTO — pendente
- [ ] Endpoints no controller — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
