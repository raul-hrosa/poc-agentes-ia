# Skill: Context Bundler

Você sabe criar context bundles por feature para reduzir o volume de contexto
que o impl-agent precisa carregar em cada task.

## Por que isso existe

O impl-agent instancia um novo contexto para cada task. Sem bundle, cada
instância relê `data-model.md`, `tech-stack.md` e `definition-of-done.md`
completos — arquivos que não mudam entre tasks. Para 9 tasks de uma feature,
isso são 9 cargas idênticas dos mesmos arquivos.

O context bundle é criado uma vez pelo tasks-agent e contém apenas os
fragmentos relevantes para aquela feature específica.

## O que entra no bundle

### Obrigatório: entidades relevantes

A partir de `features/[slug].md`, identifique quais entidades do banco a
feature cria, lê ou modifica. Extraia **apenas essas entidades** de
`data-model.md`.

Inclua as relações que conectam essas entidades entre si.
**Não inclua** entidades de outros domínios que a feature não toca.

Exemplo: feature `agenda-consultas` usa `appointments`, `patients`,
`appointment_tokens`. Extraia somente essas 3 entidades — não inclua
`session_notes`, `session_payments`, `users`.

### Obrigatório: comandos e padrão de commit

De `tech-stack.md`, inclua apenas:
- Seção de comandos do projeto (lint, test, build, etc.)
- Seção de padrão de commit

Não inclua: justificativas de stack, alternativas descartadas, custo de infra.

### Obrigatório: runtime constraints relevantes

De `runtime-constraints.md`, inclua apenas as constraints dos paths que esta
feature vai criar.

Exemplo: se a feature cria Server Actions mas não middleware, inclua apenas
as constraints de Server Actions. Se a feature criar middleware, inclua a
constraint completa de Edge Runtime.

### Obrigatório: DoD checklist completo

Copie o checklist completo de `definition-of-done.md` — este não é reduzido.

## O que NÃO entra no bundle

- Justificativas de decisões arquiteturais (o impl-agent não decide arquitetura)
- Variáveis de ambiente detalhadas (o impl-agent não configura infraestrutura)
- Entidades de outras features
- Histórico de ADRs
- Diagramas de arquitetura completos

## Estrutura do bundle

```markdown
# Context Bundle — [slug]

> Gerado em: [data]
> Feature: [nome completo]
> Entidades: [lista das entidades incluídas]

## Entidades do banco

[fragmento do data-model.md — apenas as entidades e relações da feature]

## Comandos do projeto

| Operação | Comando |
|---|---|
| Lint | [comando] |
| Type-check | [comando] |
| Testes | [comando] |
| Build | [comando] |
| Migration | [comando] |

## Padrão de commit

[seção de padrão de commit do tech-stack.md]

## Runtime constraints para esta feature

[apenas as constraints dos paths que esta feature cria]

Se esta feature criar arquivos em src/middleware.ts ou edge routes:
[constraint completa de Edge Runtime]

Se esta feature criar apenas Server Actions e Server Components:
"Todos os arquivos desta feature rodam em Node.js Runtime.
Prisma e módulos Node podem ser usados livremente."

## Definition of Done

[checklist completo do definition-of-done.md]
```

## Quando o bundle é insuficiente

Se durante a implementação o impl-agent precisar de informação não presente
no bundle, ele deve:

1. Verificar em `architecture.md` para convenções estruturais
2. Verificar em `tech-stack.md` para detalhes de dependências
3. Criar ADR se precisar de uma decisão não documentada
4. **Nunca assumir** — se não está documentado, para e pergunta

O bundle é um atalho de token, não uma substituição dos arquivos originais.
O impl-agent pode e deve ler os arquivos originais quando o bundle for
insuficiente — apenas documentar que precisou.

## Tamanho alvo

Um bundle bem feito deve ter 200-400 linhas para features médias. Se estiver
acima de 600 linhas, verifique se incluiu entidades desnecessárias.
