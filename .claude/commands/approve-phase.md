---
name: approve-phase
description: >
  Aprova a fase atual e libera a próxima. Use após revisar os documentos
  gerados pela fase corrente e estar satisfeito com o resultado.
  Atualiza STATUS.md e aciona o próximo agente automaticamente.
---

# /approve-phase

## O que este comando faz

1. Lê STATUS.md para identificar a fase atual
2. Marca o gate da fase como aprovado
3. Aciona o agente da próxima fase automaticamente

## Lógica por fase

### Aprovando Fase 0 → inicia Fase 1

Pré-condição: `product.md` e `mvp-scope.md` existem e estão completos.

```
✅ Fase 0 aprovada — Produto

Acionando tech-agent para definir arquitetura...
```

Aciona: `tech-agent`

---

### Aprovando Fase 1 → inicia Fase 2

Pré-condição: `tech-stack.md`, `architecture.md` e `data-model.md` existem.

Identifica a primeira feature não especificada em `mvp-scope.md` e aciona
o `spec-agent` para ela.

```
✅ Fase 1 aprovada — Arquitetura

Próxima feature para especificar: [slug] — [descrição]
Acionando spec-agent...
```

Aciona: `spec-agent` para a primeira feature da lista ordenada

---

### Aprovando spec de uma feature → inicia Fase 3

Pré-condição: `features/[slug].md` existe com critérios de aceite definidos.

Se houver mais de uma feature pendente de spec, pergunta ao usuário:
```
Feature [slug] aprovada.

Deseja especificar a próxima feature antes de planejar as tasks,
ou avançar direto para as tasks desta feature?

1. Especificar próxima feature: [próximo slug]
2. Avançar para tasks desta feature
```

Aguarda escolha antes de acionar o próximo agente.

---

### Aprovando tasks de uma feature → implementação disponível

Pré-condição: `tasks/[slug].md` existe com tasks e dependências definidas.

```
✅ Tasks aprovadas: [slug]

Use /implement "[slug]" para iniciar a implementação.
```

Não aciona implementação automaticamente — exige comando explícito.

---

### Aprovando review sem blockers → feature concluída

Pré-condição: `review/[slug].md` existe com status `approved`.

```
✅ Feature concluída: [slug]

Progresso do MVP:
  [slug-1] ✅ done
  [slug-2] ✅ done
  [slug-3] ⏳ pending

[n] de [total] features do MVP concluídas.
```

Se todas as features do MVP estiverem concluídas:
```
🎉 MVP concluído!

Todas as features foram implementadas e aprovadas.
Revise o STATUS.md para o resumo completo.
```

## Verificação antes de aprovar

Se a fase atual tiver documentos com campos `[a definir]` em seções críticas:

```
⚠️  Atenção: foram encontrados campos indefinidos

  product.md → modelo de monetização: [a definir]
  mvp-scope.md → prazo do MVP: [a definir]

Você pode aprovar mesmo assim, mas campos indefinidos podem
causar paradas nas fases seguintes.

Confirma aprovação? (responda "sim" para confirmar)
```

Aguarda confirmação explícita antes de prosseguir.
