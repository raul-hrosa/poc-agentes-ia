# SDD — Spec-Driven Development para SaaS

Sistema de agentes para construir Micro-SaaS e SaaS completos com IA.
Você descreve a ideia. Os agentes especificam, planejam e implementam.
Você revisa e aprova em cada fase.

---

## Como usar

```bash
# 1. Clone o repositório
git clone https://github.com/seu-user/poc-agentes-ia
cd poc-agentes-ia

# 2. Verifique a integridade do sistema
./setup.sh

# 3. Abra no Claude Code
claude .

# 4. Inicie um novo projeto
/new-project "sua ideia em texto livre"
```

Cada projeto é criado em `projects/[nome]/` — separado, organizado, versionado.

---

## Estrutura

```
poc-agentes-ia/
  .claude/          ← agentes, skills e comandos (compartilhado)
  .spec/templates/  ← templates base
  CLAUDE.md
  README.md
  setup.sh

  projects/         ← todos os seus projetos ficam aqui
    fila-barbearia/
      .spec/        ← specs do projeto
      src/          ← código gerado
    outro-saas/
      .spec/
      src/
```

---

## Fluxo

```
/new-project "sua ideia"
  └── product-agent faz perguntas e formaliza o produto

/approve-phase
  └── tech-agent define stack, arquitetura e modelo de dados

/approve-phase
  └── spec-agent escreve a spec da primeira feature

/approve-phase
  └── tasks-agent planeja as tarefas

/implement "nome-da-feature"
  └── impl-agents implementam (paralelo quando possível)
  └── review-agent valida automaticamente ao final

/approve-phase
  └── avança para a próxima feature
```

---

## Comandos

| Comando | Quando usar |
|---|---|
| `/new-project "briefing"` | Iniciar um projeto do zero |
| `/status` | Listar projetos ou ver estado de um projeto |
| `/approve-phase` | Aprovar a fase atual e avançar |
| `/next-feature "slug"` | Especificar uma feature específica |
| `/implement "slug"` | Implementar uma feature aprovada |
| `/review "slug"` | Revisar uma feature implementada |
| `/add-feature "briefing"` | Adicionar feature a projeto existente |
| `/bug "descrição"` | Reportar e corrigir um bug |
| `/refine-product` | Ajustar produto antes da arquitetura |

---

## Agentes

| Agente | Fase | Função |
|---|---|---|
| `orchestrator` | todas | Coordena o fluxo, nunca executa trabalho |
| `product-agent` | 0 | Transforma briefing em product.md + mvp-scope.md |
| `tech-agent` | 1 | Define stack, arquitetura, data model e DoD |
| `spec-agent` | 2 | Escreve user stories e critérios EARS por feature |
| `tasks-agent` | 3 | Quebra features em tasks atômicas com dependências |
| `impl-agent` | 4 | Implementa uma task por execução com commit atômico |
| `review-agent` | 5 | Verifica conformidade com spec e DoD |
| `debug-agent` | 6 | Ciclo Report → Analyze → Fix → Verify |

---

## Princípios

**Documentação antes de código** — toda decisão está escrita antes de qualquer implementação.

**Agentes executam, humanos aprovam** — gates de aprovação em cada fase.

**Definition of Done é lei** — nenhuma task conclui sem passar pelo checklist.

**Sem informação, para** — agentes nunca inventam contexto.

**Toda decisão não-óbvia vira ADR** — o codebase tem memória.
