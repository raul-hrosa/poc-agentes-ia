# T-007 — API de Pacientes (CRUD, arquivar, limite de plano)

**Épico**: [Épico 1 — Pacientes](../epics/epic-1-pacientes.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `PatientsModule` com todos os endpoints do TechSpec. `GET /patients` usa FULLTEXT search (`MATCH(full_name) AGAINST(?)`) e paginação por cursor. `POST /patients` verifica limite de 8 ativos para plano Gratuito antes de inserir. `PATCH /:id/archive` bloqueia se existem `medical_records` (apenas arquiva, nunca exclui). Todos os endpoints incluem `WHERE psychologist_id = req.user.id`.

## Critérios de aceite

- [ ] `GET /patients?q=maria&status=active&after=<cursor>&limit=20` retorna lista paginada com FULLTEXT search
- [ ] `POST /patients` com plano Gratuito e 8 ativos retorna 422 com mensagem de limite atingido
- [ ] `PATCH /:id/archive` seta `status = 'archived'`; se `medical_records` existem, permite apenas arquivar (nunca DELETE)
- [ ] Todos os campos obrigatórios validados: `full_name`, `birth_date`, `phone`, `email`
- [ ] `GET /patients/:id` retorna ficha completa incluindo contagem de sessões e saldo devedor

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/patients/patients.module.ts`, `patients.controller.ts`, `patients.service.ts`, `dto/create-patient.dto.ts`, `dto/update-patient.dto.ts`, `entities/patient.entity.ts`
- **FULLTEXT search**: `SELECT * FROM patients WHERE psychologist_id = ? AND MATCH(full_name) AGAINST(? IN BOOLEAN MODE)` via `DataSource.query()`
- **Paginação por cursor**: `WHERE id > :after ORDER BY id LIMIT :limit`
- **Limite de plano**: `SELECT COUNT(*) FROM patients WHERE psychologist_id=? AND status='active'`
- **DB**: tabela `patients`

## Dependências

- Requer: [T-003] — tabela `patients`
- Requer: [T-004] — auth para `req.user.id`

## Progresso

- [ ] `patients.service.ts` — pendente
- [ ] `patients.controller.ts` — pendente
- [ ] DTOs — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
