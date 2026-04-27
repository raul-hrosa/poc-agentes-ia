# Sistema SDD — Spec-Driven Development para SaaS

## O que é este repositório

Este é um sistema de agentes para construir Micro-SaaS e SaaS completos usando
Spec-Driven Development. A ideia central é simples: toda decisão é documentada
antes de qualquer código ser escrito. Agentes executam, humanos aprovam.

## Como funciona

O desenvolvimento segue 6 fases sequenciais com gates de aprovação entre elas:

```
Fase 0  Produto       product-agent     → product.md, mvp-scope.md
Fase 1  Arquitetura   tech-agent        → tech-stack.md, architecture.md, data-model.md, definition-of-done.md
Fase 2  Specs         spec-agent        → features/[slug].md
Fase 3  Tarefas       tasks-agent       → tasks/[slug].md
Fase 4  Implementação impl-agent        → código + testes + commits
Fase 5  Revisão       review-agent      → review/[slug].md
Fase 6  Bug fix       debug-agent       → bugs/[slug].md
```

Nenhuma fase começa sem aprovação explícita da fase anterior.

## Regras que todos os agentes seguem

**Regra 1 — STATUS.md é sempre o primeiro arquivo lido.**
Antes de qualquer ação, leia `projects/[nome]/.spec/STATUS.md`. Ele define
onde o projeto está, o que foi aprovado e o que está pendente. Nunca assuma
o estado do projeto.

**Regra 2 — Sem informação, pare.**
Se um arquivo necessário não existe ou está incompleto, não assuma nem invente.
Pare, reporte o que está faltando e aguarde.

**Regra 3 — Escopo mínimo de leitura.**
Cada agente lê apenas os arquivos do seu escopo definido. Não leia arquivos
desnecessários — isso desperdiça tokens e introduz contexto irrelevante.

**Regra 4 — Toda decisão não-óbvia vira ADR.**
Se você tomou uma decisão de implementação, biblioteca, padrão ou estrutura que
não está explicitamente documentada nas specs, crie `[projeto]/.spec/ADR/[slug].md`
antes de continuar. Decisões invisíveis criam dívida técnica invisível.

**Regra 5 — Definition of Done é lei.**
Nenhuma task é marcada como `done: true` no STATUS.md sem passar pelo checklist
completo de `[projeto]/.spec/definition-of-done.md`. Commit só acontece após
DoD satisfeito.

**Regra 6 — Agentes não se comunicam entre si.**
A comunicação é sempre via arquivo. Um agente escreve, o próximo lê. Nunca
dependa de contexto de sessão de outro agente.

**Regra 7 — Você executa, não decide produto ou arquitetura.**
Decisões de produto estão em `product.md` e `mvp-scope.md`. Decisões de
arquitetura estão em `architecture.md` e `tech-stack.md`. Se precisar de uma
decisão que não está documentada, pare e pergunte ao usuário.

**Regra 8 — Todo projeto vive em `projects/[nome]/`.**
Nunca crie arquivos de projeto na raiz do repositório. Specs ficam em
`projects/[nome]/.spec/` e código em `projects/[nome]/` no path definido
pelo tech-stack.md do projeto.

## Estrutura de arquivos

```
poc-agentes-ia/               ← raiz deste repositório
  .claude/
    agents/                   ← definição dos subagentes
    commands/                 ← slash commands
    skills/                   ← skills carregadas pelos agentes
  .spec/
    templates/                ← templates base (não edite diretamente)
  CLAUDE.md
  README.md
  setup.sh

  projects/                   ← todos os projetos ficam aqui
    [nome-do-projeto]/        ← uma pasta por projeto
      .spec/                  ← specs exclusivas deste projeto
        STATUS.md
        product.md
        mvp-scope.md
        tech-stack.md
        architecture.md
        data-model.md
        definition-of-done.md
        features/
          [slug].md
        tasks/
          [slug].md
        review/
          [slug].md
        bugs/
          [slug].md
        ADR/
          [slug].md
      src/                    ← código do projeto
      [package.json, etc.]    ← arquivos raiz do projeto
```

## Comandos disponíveis

| Comando | Descrição |
|---|---|
| `/new-project "briefing"` | Inicia fase 0 com um novo projeto |
| `/approve-phase` | Aprova a fase atual e libera a próxima |
| `/next-feature "nome"` | Especifica a próxima feature (fase 2) |
| `/implement "slug"` | Implementa uma feature específica |
| `/add-feature "briefing"` | Adiciona feature a projeto existente |
| `/bug "descrição"` | Inicia ciclo de bug fix |
| `/review "slug"` | Aciona review-agent para uma feature |
| `/refine-product` | Segunda rodada de refinamento do produto |
| `/status` | Resume o estado atual do projeto |

## Para uso em monorepo dentro de um projeto

Se um projeto usa múltiplos repositórios (frontend, backend, mobile), declare
os paths em `[projeto]/tech-stack.md` na seção `workspace`. Cada task em
`[projeto]/.spec/tasks/[slug].md` deve ter `target_path` apontando para o
diretório correto dentro de `projects/[nome]/`.
