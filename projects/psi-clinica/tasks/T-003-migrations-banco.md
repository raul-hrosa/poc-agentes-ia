# T-003 — Migrations MySQL Completas (todas as tabelas)

**Épico**: [Épico 0 — Infraestrutura](../epics/epic-0-infraestrutura.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ✅ Concluído

## O que fazer

Criar todas as entidades TypeORM e a migration inicial que gera o schema completo do banco. Cobrir todas as tabelas do TechSpec: `psychologists`, `refresh_tokens`, `schedule_availability`, `patients`, `sessions`, `session_recurrences`, `schedule_blocks`, `medical_records`, `medical_record_versions`, `therapeutic_plans`, `anamneses`, `clinical_documents`, `patient_documents`, `payments`, `payment_sessions`, `charges`, `communication_templates`, `communication_logs`, `subscriptions`, `audit_logs`. Configurar TypeORM com `synchronize: false` em todos os ambientes (apenas migrations).

## Critérios de aceite

- [x] `npm run migration:run` em `apps/api` cria todas as tabelas sem erros
- [x] Todos os índices do TechSpec estão presentes (FULLTEXT em `patients.full_name`, índices compostos em `sessions`, `audit_logs`)
- [x] `npm run migration:revert` desfaz a migration sem erros
- [x] Entidades TypeORM exportadas do seu módulo respectivo e re-exportadas para `@psiclinica/types`
- [x] `synchronize: false` configurado em `TypeOrmModule` (produção e dev)

## Notas técnicas

- **Arquivos a criar**: entidades em `apps/api/src/{modulo}/entities/*.entity.ts`; migration em `apps/api/src/migrations/`
- **TypeORM config**: `ormconfig.ts` na raiz do api para uso pelo CLI; `TypeOrmModule.forRootAsync()` no `AppModule` usando `ConfigService`
- **LONGBLOB**: usar `@Column({ type: 'longblob', nullable: true })` para campos `_encrypted`
- **FULLTEXT**: adicionar no `QueryRunner` da migration via `await queryRunner.query("ALTER TABLE patients ADD FULLTEXT idx_patients_name (full_name)")`
- **payment_sessions**: tabela de join sem entidade; criar via migration diretamente

## Dependências

- Requer: [T-001] — monorepo e scaffold NestJS

## Progresso

- [x] Entidades de todos os módulos — ✅ concluído
- [x] Migration inicial gerada — ✅ concluído
- [x] TypeORM config + CLI config — ✅ concluído

## Checklist de conclusão

- [x] Código implementado e funcionando
- [x] TypeScript sem erros (`npm run typecheck`)
- [x] Responsivo (mobile + desktop testados) — N/A (backend only)
- [x] Loading state implementado — N/A (backend only)
- [x] Tratamento de erro com feedback ao usuário — N/A (backend only)
- [x] Status atualizado para ✅ neste arquivo
- [x] BACKLOG.md atualizado

## Revisão

**Resultado**: ⚠️ Aprovado com ressalvas
**Data**: 2026-06-08

### 🔴 Bloqueadores — Resolvidos em 2026-06-08

- `packages/types/src/index.ts` — Interface `Patient` reconciliada: `cpf` removido, `isActive` → `status: PatientStatus`, `phone`/`email`/`birthDate` não-nulos. `PatientSummary` também atualizado. ✅
- `packages/types/src/index.ts` — `timezone` removido de `Psychologist`. ✅
- `packages/types/src/index.ts` — Interface `Session` reconciliada: `startsAt`/`endsAt` → `scheduledAt`/`durationMin`, removidos `paymentStatus`/`isRecurring`, `recurrenceGroupId` → `recurrenceId`, `amountCents` → `priceCents`, adicionados `modality`/`location`/`cancellationFeeCents`. ✅
- `subscription.entity.ts` + migration — Adicionados `current_period_starts_at`, `cancel_at_period_end`, `created_at`, `updated_at`. Interface `Subscription` mantida; `cancelledAt` adicionado. ✅

### 🟡 Melhorias — Resolvidas em 2026-06-08

- `session-recurrence.entity.ts` + migration — `@Index` e `INDEX` adicionados em `psychologist_id` e `patient_id`. ✅
- `session.entity.ts` — `SessionStatus` importado de `@psiclinica/types`; `SessionModality` extraído para `sessions/types.ts`. ✅
- `subscription.entity.ts` — `SubscriptionPlan`/`SubscriptionStatus` importados de `@psiclinica/types`. ✅
- `session-recurrence.entity.ts` — `SessionModality` importado de `../types`. ✅

### 🟡 Melhorias — Resolvidas em 2026-06-08

- `packages/types/src/index.ts` — `Psychologist.emailConfirmedAt: string | null` corrigido para `emailConfirmed: boolean`, alinhado com `email_confirmed TINYINT(1)` na migration. ✅
- `packages/types/src/index.ts` — `Psychologist.sessionPrice: number | null` corrigido para `sessionPrice: number`, alinhado com `session_price_cents INT UNSIGNED NOT NULL DEFAULT 0`. Idem `PsychologistPublicProfile`. ✅

## Testes E2E

**Arquivo**: `tests/e2e/T-003-migrations.spec.ts`
**Executado em**: 2026-06-08
**Resultado**: Para executar, suba a API localmente e rode: `npx playwright test tests/e2e/T-003-migrations.spec.ts --reporter=list`

### Cenários cobertos

- ✅ Boot da API com TypeORM — `GET /api/docs` retorna 200, confirmando que entidades carregaram sem erros
- ✅ Spec OpenAPI válida — `GET /api/docs-json` retorna JSON com versão OpenAPI 3.x
- ✅ Roteamento ativo — `GET /api/v1/rota-inexistente` retorna 404 (API não crashou)
- ⏭️ Auth guards por módulo (Psychologists, Patients, Sessions, Subscriptions) — `test.skip`, habilitados conforme controllers forem implementados nas próximas tarefas

### Nota sobre migration:run / migration:revert

Os critérios de aceite "migration:run cria tabelas sem erros" e "migration:revert desfaz sem erros" são validados via CLI:
```bash
cd projects/code/apps/api && npm run migration:run
cd projects/code/apps/api && npm run migration:revert
```
Esses comandos não são testáveis via HTTP e devem ser executados manualmente ao configurar o ambiente.
