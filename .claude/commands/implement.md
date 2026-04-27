---
name: implement
description: >
  Inicia a implementação de uma feature específica. Lê o plano de tasks,
  respeita dependências e lança impl-agents na ordem correta com paralelismo
  quando possível. Use após aprovar as tasks de uma feature.
---

# /implement

## O que este comando faz

1. Valida que `tasks/[slug].md` existe e está aprovado
2. Lê o diagrama de dependências
3. Lança impl-agents respeitando `depends_on` e `can_parallelize`
4. Monitora progresso via STATUS.md
5. Aciona `review-agent` quando todas as tasks estiverem `done: true`

## Validações antes de iniciar

### Verifica pré-condições

```
[ ] tasks/[slug].md existe
[ ] Fase 3 aprovada para esta feature no STATUS.md
[ ] Features das quais esta depende (mvp-scope.md) estão concluídas
```

Se alguma falhar:
```
❌ Não é possível implementar [slug]

Motivo: [descrição específica]
Solução: [o que fazer]
```

### Verifica STATUS.md para retomada

Se houver tasks com `done: false` de uma execução anterior:
```
⚠️  Tasks em andamento encontradas para [slug]:

  task-01 ✅ done
  task-02 ❌ pendente
  task-03 ❌ pendente

Retomar de onde parou? (task-02)
```

Aguarda confirmação antes de retomar.

## Execução

### Lê o diagrama de dependências

A partir de `tasks/[slug].md`, constrói a ordem de execução:

```
Para cada task:
  SE depends_on vazio OU todos depends_on = done: true
    SE can_parallelize: true → elegível para paralelo
    SE can_parallelize: false → executa em sequência
  SENÃO
    Aguarda os depends_on concluírem
```

### Lança os impl-agents

Para cada task elegível, aciona via ferramenta `Agent`:

```
Agent(
  subagent_type: "impl-agent",
  description: "Implementar [task-NN]: [título]",
  prompt: "
    Implemente a task descrita em .spec/tasks/[slug].md — task-NN.
    Leia também .spec/data-model.md e .spec/tech-stack.md.
    Siga obrigatoriamente .spec/definition-of-done.md antes do commit.
    Após o commit, atualize .spec/STATUS.md com done: true para task-NN.
  "
)
```

### Monitora e avança

Após cada task concluída (verificado via STATUS.md):
```
✅ task-NN concluída — [título]
   Próxima: task-NN+1
```

Quando todas as tasks estiverem `done: true`:
```
✅ Todas as tasks concluídas para [slug]

Acionando review-agent automaticamente...
```

Aciona automaticamente o `review-agent` via comando `/review "[slug]"`.

**Importante:** o review é sempre acionado ao final do implement — não
aguarda confirmação do usuário. Se o review encontrar blockers, o resultado
é apresentado e o usuário decide como proceder.

Se por qualquer motivo o review automático não rodar (sessão encerrada,
timeout), use `/review "[slug]"` para acioná-lo manualmente.

## Progresso em tempo real

Durante a execução, mantém o usuário informado:

```
🔄 Implementando [slug]

  task-01 ✅ schema: migration tabela subscriptions
  task-02 🔄 service: lógica de criação e cancelamento
  task-03 🔄 ui: componente SubscriptionCard (paralelo)
  task-04 ⏳ api: endpoints (aguardando task-02 e task-03)
```

## Uso

```
/implement "billing-subscription"
/implement "user-auth"
```
