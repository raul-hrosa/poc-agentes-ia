---
name: next-feature
description: >
  Especifica a próxima feature do MVP em sequência. Alternativa ao /approve-phase
  quando você quer controle explícito sobre qual feature especificar a seguir.
  Aciona o spec-agent para a feature indicada.
---

# /next-feature

## O que este comando faz

1. Valida que a feature existe no `mvp-scope.md`
2. Verifica que as dependências da feature estão concluídas
3. Aciona o `spec-agent` para especificá-la

## Validações

### Feature existe no MVP

Verifica se o nome/slug fornecido corresponde a uma feature em `mvp-scope.md`.

Se não encontrar:
```
❌ Feature não encontrada no mvp-scope.md: "[nome]"

Features disponíveis para especificar:
  - [slug-1] — [descrição]
  - [slug-2] — [descrição]

Use o slug exato ou uma parte do nome.
```

### Dependências satisfeitas

Verifica a tabela de dependências de `mvp-scope.md`:
```
❌ [slug] depende de [outra-feature] que ainda não foi concluída.

Conclua [outra-feature] primeiro ou use /next-feature "[outra-feature]"
para especificá-la agora.
```

### Feature já especificada

Se `features/[slug].md` já existe:
```
⚠️  A feature [slug] já tem spec criada.

Status atual: [aprovada | pendente de aprovação | em implementação]

Use /approve-phase para avançar, ou revise features/[slug].md
se quiser fazer ajustes antes de aprovar.
```

## Execução

```
✅ Especificando feature: [slug] — [descrição]

Acionando spec-agent...
```

Aciona `spec-agent` com:
- Slug e descrição da feature
- Contexto de dependências já concluídas

## Uso

```
/next-feature "billing-subscription"
/next-feature "team-invites"
/next-feature "project-dashboard"
```
