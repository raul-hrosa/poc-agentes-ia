---
name: bootstrap
description: >
  Executa a Fase 1.5 — Bootstrap para um projeto. Cria app shell
  (homepage, layout, dashboard), seed.ts, .env.example, verifica
  violações de runtime e valida o build. Use após aprovar a Fase 1
  ou para executar retroativamente em projetos já implementados.
---

# /bootstrap

## O que este comando faz

1. Lê STATUS.md para identificar o projeto e seu estado
2. Verifica pré-condições
3. Aciona o `bootstrap-agent`
4. Apresenta o resultado ao usuário

## Uso

```
/bootstrap "agenda-psicologos"
/bootstrap             ← usa o projeto no diretório atual
```

## Validações antes de iniciar

```
[ ] projects/[nome]/.spec/STATUS.md existe
[ ] .spec/tech-stack.md existe
[ ] .spec/architecture.md existe
[ ] .spec/runtime-constraints.md existe
[ ] .spec/design-tokens.md existe
[ ] Fase 1 está aprovada no STATUS.md
```

Se `runtime-constraints.md` ou `design-tokens.md` não existirem:
```
⚠️  Pré-condições ausentes

Os seguintes arquivos estão faltando:
  [lista]

Execute /approve-phase para que o tech-agent os crie,
ou crie-os manualmente seguindo os templates das skills
runtime-constraint-mapper e design-token-definer.
```

Se o bootstrap já foi executado com sucesso:
```
ℹ️  Bootstrap já concluído para [nome]

build_gate_bootstrap: passed

Use /status "[nome]" para ver o estado atual.
```

## Execução

Aciona o `bootstrap-agent` com contexto do projeto:

```
Agent(
  subagent_type: "bootstrap-agent",
  description: "Bootstrap do projeto [nome]",
  prompt: "
    Execute o bootstrap para o projeto em projects/[nome]/.
    Leia .spec/bootstrap.md se existir — ele contém especificações
    concretas para este projeto.
    Leia .spec/runtime-constraints.md, .spec/design-tokens.md,
    .spec/tech-stack.md e .spec/architecture.md.
    Siga o processo completo do bootstrap-agent.
    Após concluir, atualize .spec/STATUS.md.
  "
)
```

## Resultado esperado

```
✅ Bootstrap concluído — [nome]

App shell:
  / — homepage criada
  /(auth)/layout.tsx — navegação com [n] links
  /(auth)/dashboard/page.tsx — dashboard com dados reais

Infraestrutura:
  prisma/seed.ts — usuário dev: [email]
  .env.example — [n] variáveis

Build gate:
  typecheck ✅ | build ✅ | test ✅

Runtime violations: [n encontradas | nenhuma]

Use /approve-phase para continuar o fluxo.
```

## Uso retroativo

Este comando pode ser usado em projetos já implementados que não
passaram pela Fase 1.5 originalmente. O bootstrap-agent lê
`.spec/bootstrap.md` para entender o que criar para aquele projeto
específico, sem tocar nas features já implementadas.
