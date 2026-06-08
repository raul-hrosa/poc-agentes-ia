# Épico 6 — Agendamento Público

## Objetivo

Página pública onde novos pacientes podem agendar diretamente na agenda do psicólogo via URL única `psiclinica.com.br/agendar/[slug]`, sem necessidade de criar conta.

## Tarefas

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-031](../tasks/T-031-agendamento-publico-api.md) | API pública (perfil, slots disponíveis, book) | P2 | M | ⬜ |
| [T-032](../tasks/T-032-agendamento-publico-frontend.md) | Frontend página pública de agendamento ([slug]) | P2 | M | ⬜ |

## Dependências

- Requer épico 0 — banco, configurações do psicólogo
- Requer épico 2 — agenda (verifica disponibilidade de slots)
- Requer épico 1 — cria paciente simplificado no book

## Definição de pronto

- [ ] Todas as tarefas do épico concluídas
- [ ] Revisão feita (agents/05-review.md)
- [ ] Testes criados (agents/06-tester.md)
