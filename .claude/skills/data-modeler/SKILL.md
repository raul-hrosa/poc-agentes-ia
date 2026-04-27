---
name: data-modeler
description: >
  Carregue esta skill ao projetar o modelo de dados do projeto. Use para
  preencher data-model.md com entidades, campos, relações e índices. Ativa
  quando o tech-agent precisa definir o schema do banco de dados a partir
  do produto e do escopo do MVP.
---

# Data Modeler

Você é especialista em modelagem de dados para SaaS. Sua função é criar um
modelo de dados consistente, normalizado e performático — documentado com
clareza suficiente para que o impl-agent implemente sem ambiguidade.

## Processo

### Passo 1 — Leia o contexto necessário
- `product.md` — entenda o domínio do negócio
- `mvp-scope.md` — entenda quais features entram
- `tech-stack.md` — entenda o banco escolhido

### Passo 2 — Identifique as entidades

Para cada feature do MVP, identifique:
- Quais substantivos do domínio precisam ser persistidos?
- Quais relações existem entre eles?
- Quais dados são temporários vs permanentes?

### Passo 3 — Modele com cautela

**Regras de modelagem:**
- Toda tabela tem `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- Toda tabela tem `created_at` e `updated_at timestamptz`
- Nomes de tabela: snake_case, plural (ex: `users`, `organizations`)
- Nomes de campo: snake_case (ex: `first_name`, `created_at`)
- Foreign keys: `[tabela_singular]_id` (ex: `user_id`, `organization_id`)
- Enums para campos com valores fixos e conhecidos
- Evite campos JSON/JSONB a não ser que a estrutura seja genuinamente variável

**Multi-tenancy (se aplicável):**
Se o produto é B2B com múltiplos clientes isolados:
- Toda tabela de dado do cliente tem `organization_id`
- Documente se usa RLS (Row Level Security) ou isolamento por aplicação
- Nunca misture dados de tenants diferentes na mesma query sem filtro explícito

**Soft delete:**
- Use `deleted_at timestamptz` apenas se o produto precisa de histórico
- Documente quais tabelas usam soft delete e quais usam hard delete
- Não use soft delete por padrão — adiciona complexidade a todas as queries

### Passo 4 — Defina índices com justificativa

Para cada índice além da PK:
- Qual query justifica este índice?
- Qual a frequência esperada dessa query?
- O índice é único? Parcial?

Não adicione índices "por precaução" — eles têm custo de write.

### Passo 5 — Documente relações

Use o diagrama textual do template para mostrar as relações.
Para cada relação N:N, crie uma tabela pivot com nome descritivo
(ex: `project_members`, não `projects_users`).

## Campos obrigatórios por tabela

```sql
id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

Para tabelas com multi-tenancy:
```sql
organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
```

## Padrões de migração

Documente em `data-model.md`:
- Qual ferramenta de migration (Prisma Migrate, Flyway, goose)
- Convenção de nome dos arquivos
- Se migrations são reversíveis (down migration obrigatório?)
- Se usa seeds e o que eles contêm

## O que não modelar no MVP

- Tabelas de auditoria completas — adicione depois se necessário
- Particionamento de tabelas — apenas se houver evidência de volume
- Campos para features fora do MVP — não antecipe, adicione quando precisar
- Estruturas genéricas tipo EAV — quase sempre um erro de modelagem
