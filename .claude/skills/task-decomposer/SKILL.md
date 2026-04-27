---
name: task-decomposer
description: >
  Carregue esta skill ao quebrar uma feature em tarefas de implementação.
  Use para garantir que as tarefas são atômicas, têm escopo claro e seguem
  a ordem correta de camadas. Ativa quando o tasks-agent está preenchendo
  tasks/[slug].md a partir de features/[slug].md.
---

# Task Decomposer

Sua função é transformar uma feature spec em tarefas concretas que o impl-agent
executa sem precisar tomar decisões de design.

## Princípio central

Uma boa task tem três propriedades:
1. **Atômica** — faz uma coisa, resulta em um commit significativo
2. **Auto-contida** — o impl-agent entende o que fazer lendo só a task
3. **Verificável** — tem critérios binários de conclusão

## Ordem obrigatória de camadas

Sempre decomponha nesta sequência. Cada camada depende da anterior:

```
1. Schema / Migration
   ↓ (banco precisa existir antes do código que o usa)
2. Types / Interfaces
   ↓ (tipos antes da implementação que os usa)
3. Service / Business Logic
   ↓ (lógica de negócio antes de expor)
4. Repository / Data Access
   ↓ (acesso a dados antes de servir)
5. API / Routes / Actions
   ↓ (interface antes do consumidor)
6. UI / Components
   ↓ (UI depois que a API existe)
7. Testes de integração
```

Não pule camadas. Não inverta a ordem.

## Regras de paralelismo

`can_parallelize: true` apenas quando:
- As tasks operam em arquivos completamente diferentes
- Nenhuma das tasks cria algo que a outra consome
- Podem fazer merge sem conflito

Exemplo seguro de paralelismo:
```
task-01: schema (sequencial — base de tudo)
  ├── task-02: service layer (backend)    ← paralelo entre si
  └── task-03: UI components (frontend)  ← paralelo entre si
        └── task-04: integração (após ambas)
```

Exemplo de paralelismo errado:
```
task-01: criar tabela users
task-02: criar service que usa tabela users  ← NÃO é paralelo com task-01
```

## O que cada task deve conter

### Descrição
O impl-agent só tem acesso à task, ao `data-model.md` e ao `tech-stack.md`.
A descrição deve ser suficiente para implementar sem reler a feature spec.

Inclua:
- O que criar/modificar (arquivos específicos)
- Qual comportamento implementar
- Quais dados manipular
- Quais validações aplicar

Não inclua:
- Detalhes de outras tasks
- Decisões arquiteturais já documentadas
- Informações do produto (o impl-agent não precisa saber o "porquê")

### Critérios de aceite da task
Diferentes dos critérios EARS da feature — estes são técnicos e verificáveis
em código:
- "migration roda sem erro"
- "service retorna Result<User, Error> tipado"
- "componente renderiza estado de loading"

### DoD checklist
Copie o checklist do `definition-of-done.md` para cada task.
O impl-agent marca cada item antes de fazer o commit.

## Tamanho ideal de uma task

- **Muito pequena:** 1 função, 1 arquivo → junte com a próxima
- **Ideal:** 1 camada de uma feature, 2-6 arquivos, 1-4 horas de trabalho
- **Muito grande:** múltiplas camadas, mais de 8 arquivos → divida

## Nomear tasks

Use o formato: `task-NN — [camada]: [o que faz]`

Exemplos:
- `task-01 — schema: migration tabela subscriptions`
- `task-02 — service: lógica de criação e cancelamento`
- `task-03 — api: endpoints POST e DELETE /subscriptions`
- `task-04 — ui: componente SubscriptionCard e página /billing`
- `task-05 — test: testes de integração do fluxo de assinatura`
