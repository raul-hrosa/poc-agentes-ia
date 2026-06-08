# Épico 2 — Agenda

## Objetivo

Criação, edição e visualização de sessões com suporte a recorrência semanal/quinzenal/mensal, controle de estados e detecção de conflitos de horário.

## Tarefas

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-013](../tasks/T-013-sessoes-api.md) | API de sessões (CRUD, recorrência, conflito de horário) | P1 | L | ⬜ |
| [T-014](../tasks/T-014-bloqueios-slots-api.md) | API de bloqueios de período e slots disponíveis | P1 | M | ⬜ |
| [T-015](../tasks/T-015-agenda-frontend.md) | Frontend agenda (views semana/dia/mês com Calendar) | P1 | L | ⬜ |
| [T-016](../tasks/T-016-sessao-criar-editar.md) | Frontend criar/editar sessão (modal, recorrência, bloqueios) | P1 | M | ⬜ |
| [T-017](../tasks/T-017-sessao-status.md) | Frontend mudança de status da sessão (estados + prompt pagamento) | P1 | S | ⬜ |

## Dependências

- Requer épico 0 — auth e banco
- Requer épico 1 (T-007) — pacientes devem existir para agendar sessão

## Definição de pronto

- [ ] Todas as tarefas do épico concluídas
- [ ] Revisão feita (agents/05-review.md)
- [ ] Testes criados (agents/06-tester.md)
