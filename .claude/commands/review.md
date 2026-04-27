---
name: review
description: >
  Aciona o review-agent para revisar a implementação de uma feature.
  Verifica conformidade com a spec, DoD e qualidade de código.
  Normalmente é acionado automaticamente pelo /implement ao final,
  mas pode ser chamado manualmente a qualquer momento.
---

# /review

## O que este comando faz

1. Valida que todas as tasks da feature estão `done: true`
2. Aciona o `review-agent` para a feature indicada
3. Gera `review/[slug].md` com o resultado

## Validações

### Verifica que as tasks estão concluídas

Lê `STATUS.md` e confirma que todas as tasks da feature têm `done: true`.

Se houver tasks pendentes:
```
⚠️  Ainda há tasks pendentes para [slug]:

  task-01 ✅ done
  task-02 ❌ pendente
  task-03 ❌ pendente

Conclua a implementação antes de revisar.
Use /implement "[slug]" para retomar.
```

Se quiser revisar mesmo assim (implementação parcial):
```
Confirma revisão com tasks pendentes? (responda "sim" para confirmar)
```

### Verifica se já existe review

Se `review/[slug].md` já existe:
```
⚠️  Já existe um review para [slug].

Status atual: [approved | needs-fix]

Deseja gerar um novo review? (responda "sim" para sobrescrever)
```

## Execução

```
🔍 Revisando feature: [slug]

Acionando review-agent...
```

Aciona o `review-agent` com:
- Path de `features/[slug].md`
- Path de `tasks/[slug].md`
- Instrução para gerar `review/[slug].md`

## Resultado

**Se approved:**
```
✅ Feature aprovada: [slug]

Todos os critérios EARS verificados.
Use /next-feature ou /approve-phase para avançar.
```

**Se needs-fix:**
```
❌ Feature precisa de correções: [slug]

Blockers: [n]
Veja .spec/review/[slug].md para detalhes.
```

## Uso

```
/review "user-auth"
/review "billing-subscription"
/review "project-dashboard"
```

Sem argumento, revisa a feature atual em andamento conforme STATUS.md:
```
/review
```
