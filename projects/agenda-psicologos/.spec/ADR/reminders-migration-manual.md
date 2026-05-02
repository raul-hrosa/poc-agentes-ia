# ADR: Migration manual para lembretes-consulta (sem banco acessível em CI)

**Data:** 2026-05-02
**Status:** aceito
**Feature:** lembretes-consulta / TASK-01

---

## Contexto

Durante a implementação da TASK-01 de lembretes-consulta, o comando `pnpm db:migrate`
falhou porque o servidor MySQL não estava acessível no ambiente de execução (Docker
Desktop não estava rodando). O banco de dados local é necessário para `prisma migrate dev`
criar e aplicar a migration automaticamente.

---

## Decisão

A migration foi criada manualmente no diretório `prisma/migrations/20260502000001_add_email_to_patients/migration.sql`,
seguindo o padrão SQL do MySQL 8 e a convenção de nomes de migrations já existentes no projeto
(`20260429000001_add_password_reset_tokens`).

O `pnpm db:generate` foi executado com sucesso, regenerando o Prisma Client com os novos campos
(`Patient.email` e o model `AppointmentToken`).

A migration deve ser aplicada ao banco de dados com `pnpm db:migrate:deploy` quando o banco
estiver acessível no próximo ciclo de desenvolvimento.

---

## Alternativas consideradas

**Iniciar Docker Desktop manualmente:** Não foi possível pois o daemon do Docker não estava
disponível no contexto de execução do agente.

**Usar `prisma db push` (sem migration):** Descartado pois perderia o rastreamento versionado
de migrations — o projeto usa `migrate dev` para desenvolvimento e `migrate deploy` para produção.

---

## Consequências

- **Positivo:** O Prisma Client está atualizado e o typecheck passa sem erros.
- **Positivo:** A migration está versionada no repositório no formato correto.
- **Negativo:** A migration precisa ser manualmente aplicada com `pnpm db:migrate:deploy` no
  próximo deploy, ou com `pnpm db:migrate` quando o banco local estiver disponível.
- **Observação:** Em produção, `pnpm db:migrate:deploy` aplica migrations pendentes — a migration
  será aplicada automaticamente no próximo deploy.
