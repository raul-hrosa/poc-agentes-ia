# Épico 0 — Infraestrutura

## Objetivo

Configurar o monorepo, banco de dados, autenticação e perfil do psicólogo — fundação sem a qual nenhuma outra feature pode ser desenvolvida.

## Tarefas

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-001](../tasks/T-001-setup-monorepo.md) | Setup do monorepo (Turborepo + workspaces) | P1 | M | ⬜ |
| [T-002](../tasks/T-002-setup-nestjs-base.md) | Setup NestJS base (guards, pipes, crypto, R2, mail) | P1 | M | ⬜ |
| [T-003](../tasks/T-003-migrations-banco.md) | Migrations MySQL completas (todas as tabelas) | P1 | M | ⬜ |
| [T-004](../tasks/T-004-auth-api.md) | Auth API (register, login, refresh, logout, reset, confirm) | P1 | L | ⬜ |
| [T-005](../tasks/T-005-auth-frontend.md) | Auth frontend (login, register, forgot-password + api.ts) | P1 | M | ⬜ |
| [T-006](../tasks/T-006-perfil-psicologo.md) | Perfil do psicólogo (API + frontend settings) | P1 | M | ⬜ |

## Dependências

Nenhuma — é o ponto de partida.

## Definição de pronto

- [ ] Todas as tarefas do épico concluídas
- [ ] Revisão feita (agents/05-review.md)
- [ ] Testes criados (agents/06-tester.md)
