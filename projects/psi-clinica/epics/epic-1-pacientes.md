# Épico 1 — Pacientes

## Objetivo

CRM clínico completo: cadastrar e gerenciar pacientes, acessar ficha com abas de resumo, prontuário, sessões e financeiro, incluindo anamnese e upload de documentos.

## Tarefas

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-007](../tasks/T-007-pacientes-api.md) | API de pacientes (CRUD, arquivar, limite plano) | P1 | M | ⬜ |
| [T-008](../tasks/T-008-pacientes-lista-frontend.md) | Frontend lista de pacientes (busca, filtros, status) | P1 | M | ⬜ |
| [T-009](../tasks/T-009-paciente-ficha-frontend.md) | Frontend ficha do paciente (abas: Resumo, Sessões, Financeiro) | P1 | M | ⬜ |
| [T-010](../tasks/T-010-anamnese-api.md) | API de anamnese (criar/atualizar, dados criptografados) | P2 | S | ⬜ |
| [T-011](../tasks/T-011-anamnese-frontend.md) | Frontend anamnese (formulário criptografado) | P2 | S | ⬜ |
| [T-012](../tasks/T-012-documentos-paciente.md) | Upload de documentos do paciente (R2, API + frontend) | P2 | M | ⬜ |

## Dependências

- Requer épico 0 — auth e banco devem estar funcionando

## Definição de pronto

- [ ] Todas as tarefas do épico concluídas
- [ ] Revisão feita (agents/05-review.md)
- [ ] Testes criados (agents/06-tester.md)
