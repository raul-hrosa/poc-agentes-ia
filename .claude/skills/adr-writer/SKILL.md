---
name: adr-writer
description: >
  Carregue esta skill ao registrar uma decisão arquitetural ou técnica relevante.
  Use para criar ADR/[slug].md sempre que uma decisão não-óbvia for tomada
  durante qualquer fase. Ativa quando qualquer agente precisa documentar uma
  decisão que não estava prevista nas specs originais.
---

# ADR Writer

ADR (Architecture Decision Record) é o mecanismo que garante que decisões
tomadas durante o projeto não se percam. Um codebase sem ADRs é um codebase
onde ninguém sabe por que as coisas são do jeito que são.

## Quando criar um ADR

Crie sempre que:
- Escolheu uma biblioteca específica entre alternativas (ex: Zod vs Yup)
- Definiu um padrão que será repetido em todo o projeto
- Fez uma trade-off consciente (ex: performance vs simplicidade)
- Encontrou um limitação da spec e tomou uma decisão para contornar
- Mudou algo do que estava documentado em `architecture.md` ou `tech-stack.md`

**Não crie para:**
- Decisões óbvias e sem alternativa real
- Detalhes de implementação que só afetam um arquivo
- Preferências estéticas de código

## Processo

### Passo 1 — Escolha um slug descritivo
Formato: `[contexto]-[decisão]`
Exemplos:
- `auth-jwt-vs-session`
- `pagination-cursor-based`
- `error-handling-result-type`
- `upload-direct-to-s3`

### Passo 2 — Copie o template
```
cp .spec/templates/adr.md .spec/ADR/[slug].md
```

### Passo 3 — Preencha com honestidade

**Contexto:** O que estava acontecendo que exigiu uma decisão?
Seja específico — o leitor futuro não tem seu contexto atual.

**Decisão:** O que foi decidido? Uma frase direta.
Não "consideramos usar X" — "decidimos usar X".

**Alternativas:** Quais outras opções foram consideradas?
Por que foram descartadas? Seja justo com as alternativas.

**Consequências:** O que esta decisão implica?
- Positivas: o que fica mais fácil?
- Negativas: o que fica mais difícil? O que foi sacrificado?
- Neutras: o que precisa ser observado no futuro?

### Passo 4 — Atualize STATUS.md

Adicione o ADR na tabela de decisões registradas:
```markdown
| ADR/[slug].md | [resumo em 1 frase] |
```

## Qualidade de um bom ADR

Um bom ADR pode ser lido em 2 minutos e responde:
1. Por que essa decisão foi necessária?
2. O que foi decidido?
3. Por que não a alternativa óbvia?
4. O que esta decisão custou?

Se não consegue responder essas quatro perguntas, o ADR está incompleto.
