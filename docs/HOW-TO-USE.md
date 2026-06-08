# Como usar os agentes

Este sistema é composto por agentes especializados que você aciona no Claude Code por etapas. Cada agente tem um papel claro, recebe entradas específicas e produz saídas documentadas.

---

## Fluxo para um novo projeto

```
01-prd → 02-techspec → 03-planner → 04-dev → 05-review → 06-tester
                                       ↑_____________________|
                                    (repete por tarefa)
```

### Etapa 1 — Criar o PRD
```
"Use agents/01-prd.md para criar o PRD do projeto meu-saas. A ideia é: [descreva]"
```
Revise o `projects/meu-saas/prd.md` gerado. Peça ajustes se necessário. Quando estiver bom, siga.

### Etapa 2 — Criar o TechSpec
```
"Use agents/02-techspec.md para criar o TechSpec do projeto meu-saas"
```
Revise `projects/meu-saas/techspec.md`. Atenção especial à stack e aos modelos de dados.

### Etapa 3 — Criar épicos e tarefas
```
"Use agents/03-planner.md para criar os épicos e tarefas do projeto meu-saas"
```
Revise `projects/meu-saas/tasks/BACKLOG.md` e a ordem de desenvolvimento sugerida.

### Etapa 4 — Desenvolver tarefa a tarefa
```
"Use agents/04-dev.md para implementar a tarefa T-001 do projeto meu-saas"
```
Repita para cada tarefa, seguindo a ordem do backlog.

### Etapa 5 — Revisar cada tarefa
```
"Use agents/05-review.md para revisar a tarefa T-001 do projeto meu-saas"
```
Execute após cada tarefa implementada. Corrija bloqueadores antes de avançar.

### Etapa 6 — Criar testes E2E
```
"Use agents/06-tester.md para criar testes da tarefa T-001 do projeto meu-saas"
```
Execute após a revisão estar aprovada.

---

## Fluxo de manutenção

### Adicionar uma nova feature
```
"Use agents/07-feature.md no projeto meu-saas. Feature: [descrição]"
```

### Corrigir um bug
```
"Use agents/08-bugfix.md no projeto meu-saas. Bug: [o que acontece vs. o que deveria]"
```

### Alterar layout ou estilo
```
"Use agents/09-ui.md no projeto meu-saas. Mudança: [descrição da alteração visual]"
```

Após qualquer mudança (feature, bugfix, UI), sempre encerre com:
```
"Use agents/05-review.md para revisar [o que foi feito] do projeto meu-saas"
```

---

## Estrutura de arquivos por projeto

```
projects/{nome}/
├── _context.md          ← contexto do projeto (gerado na etapa 3, atualizado continuamente)
├── prd.md               ← PRD (gerado na etapa 1)
├── techspec.md          ← TechSpec (gerado na etapa 2)
├── README.md            ← status e links
├── epics/
│   ├── epic-0-infra.md
│   └── epic-1-{feature}.md
└── tasks/
    ├── BACKLOG.md       ← visão consolidada de todas as tarefas
    ├── T-001-{nome}.md
    ├── T-002-{nome}.md
    └── BUG-001-{nome}.md  ← criado automaticamente ao corrigir bugs
```

---

## O arquivo `_context.md` — núcleo do sistema

Este arquivo é o mais importante. Ele é carregado em **toda** sessão de desenvolvimento e deve conter:
- O que é o produto (2 frases)
- Stack completa
- Estrutura de pastas chave
- Padrões e convenções obrigatórios
- Regras de segurança

**Mantenha-o atualizado.** Após cada feature ou mudança de convenção, revise e atualize o `_context.md`. Um contexto desatualizado leva a decisões ruins e retrabalho.

---

## Economia de tokens

O sistema foi desenhado para usar o mínimo de tokens necessário:

| Agente | Lê | Produz |
|--------|-----|--------|
| 01-prd | Só a ideia | prd.md |
| 02-techspec | prd.md | techspec.md |
| 03-planner | prd.md + techspec.md | _context.md + épicos + tarefas |
| 04-dev | **_context.md** + tarefa + arquivos relevantes | Código |
| 05-review | **_context.md** + tarefa + arquivos modificados | Relatório |
| 06-tester | **_context.md** + tarefa + UI implementada | Testes |
| 07-feature | **_context.md** + docs existentes | Docs atualizados + código |
| 08-bugfix | **_context.md** + descrição do bug | Fix + documentação |
| 09-ui | **_context.md** + componentes afetados | UI atualizada |

O `_context.md` é propositalmente enxuto — é ele que evita ter que reler o PRD e TechSpec inteiros a cada sessão.

---

## Boas práticas

1. **Revise antes de avançar**: não vá para a próxima etapa sem aprovar a atual
2. **Uma tarefa por sessão**: o agente de dev trabalha melhor focado em uma tarefa
3. **Atualize o _context.md**: após mudanças significativas no projeto
4. **Não pule a revisão**: o agente 05 existe para pegar problemas antes de acumular dívida técnica
5. **Documente bugs**: mesmo que corrija na hora, crie o BUG-NNN.md para rastreabilidade
