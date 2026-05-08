---
name: build
description: >
  Executa o gate de build (Fase 4.5) para uma feature específica.
  Roda pnpm typecheck + build + test. Se passar, libera o review-agent.
  Use manualmente quando o build gate não rodou automaticamente ou
  quando precisa re-executar após corrigir um erro.
---

# /build

## O que este comando faz

1. Valida que todas as tasks da feature estão `done: true`
2. Aciona o `build-agent`
3. Apresenta o resultado (passed ou failed com erro completo)

## Uso

```
/build "autenticacao"
/build "controle-financeiro"
```

## Validações antes de iniciar

```
[ ] tasks/[slug].md existe
[ ] Todas as tasks da feature estão done: true no STATUS.md
```

Se tasks pendentes:
```
❌ Não é possível executar o build gate para [slug]

Tasks ainda pendentes:
  task-NN — [título]

Conclua a implementação antes de executar o build gate.
```

## Execução

Aciona o `build-agent`:

```
Agent(
  subagent_type: "build-agent",
  description: "Build gate para [slug]",
  prompt: "
    Execute o build gate para a feature [slug] do projeto em [path].
    Leia .spec/STATUS.md e .spec/tech-stack.md.
    Execute: pnpm typecheck, pnpm build, pnpm test.
    Registre o resultado em .spec/STATUS.md como
    build_gate_[slug]: passed | failed.
    Se falhar, crie bugs/build-[slug].md com o erro completo.
  "
)
```

## Após o build passar

O review-agent pode ser acionado:
```
✅ Build gate passou — [slug]

Use /review "[slug]" para iniciar a revisão.
```

## Após o build falhar

```
❌ Build gate falhou — [slug]

[erro resumido]

Veja bugs/build-[slug].md para o erro completo.
Corrija e execute /build "[slug]" novamente.
```
