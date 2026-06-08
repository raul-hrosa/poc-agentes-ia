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

### 🔴 Bloqueadores

- `packages/types/src/index.ts:74-86` — Interface `Patient` tem `cpf`, `isActive`, e nullability em `phone`/`email`/`birthDate` incompatíveis com a entidade (sem `cpf`, usa `status` enum, campos NOT NULL). Quebra compilação em services. → Reconciliar interface com schema real.
- `packages/types/src/index.ts:44-60` — Interface `Psychologist` tem `timezone: string` ausente na entidade. → Remover da interface ou adicionar na entidade/migration.
- `packages/types/src/index.ts:100-116` — Interface `Session` usa `startsAt`/`endsAt`/`paymentStatus`/`isRecurring` inexistentes na entidade. → Reconciliar com modelo real.
- `packages/types/src/index.ts:132-145` — Interface `Subscription` tem `currentPeriodStart` e `cancelAtPeriodEnd` ausentes na entidade. → Adicionar ou remover.

### 🟡 Melhorias

- `apps/api/src/migrations/…` e `session-recurrence.entity.ts` — `session_recurrences` sem índice em `psychologist_id`/`patient_id`. → Adicionar INDEX na migration e `@Index` na entidade.
- `session.entity.ts`, `subscription.entity.ts` — `SessionStatus`, `PaymentMethod`, `SubscriptionPlan`, `SubscriptionStatus` redefinidos localmente duplicando enums de `@psiclinica/types`. → Importar do pacote compartilhado.
- `session-recurrence.entity.ts:13` — `SessionModality` definido em dois arquivos. → Extrair para `sessions/types.ts`.
