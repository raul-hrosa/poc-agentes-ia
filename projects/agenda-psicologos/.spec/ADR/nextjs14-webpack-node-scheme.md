# ADR — nextjs14-webpack-node-scheme

**Data:** 2026-05-01
**Status:** aceito

## Contexto

O Prisma 7.x gera código em `src/generated/prisma/client.ts` que usa imports com
o scheme `node:` explícito (`node:crypto`, `node:fs`, `node:path`, `node:process`,
`node:url`). O webpack do Next.js 14.2 não suporta o scheme `node:` por padrão,
causando `UnhandledSchemeError` no build e impedindo qualquer compilação.

O erro se manifestou ao criar a primeira rota que importava (transitivamente) o
Prisma Client via `shared/lib/auth.ts` → `shared/lib/prisma.ts` → `generated/prisma/client.ts`.

## Decisão

Adicionar duas configurações ao `next.config.mjs`:

1. `experimental.serverComponentsExternalPackages` — exclui `@prisma/client`,
   `@prisma/adapter-mariadb`, `mariadb` e `bcryptjs` do bundle webpack, tratando-os
   como dependências externas resolvidas em runtime pelo Node.js.

2. `webpack.externals` customizado — para `node:` scheme imports diretos no código
   gerado do Prisma (`client.ts` gerado importa `node:path` e `node:process` no
   topo do arquivo), mapeia `node:<module>` → `commonjs <module>`.

Adicionalmente, a página `/login` foi envolvida em `<Suspense>` para isolar o
`useSearchParams()` do `LoginForm`, conforme exigido pelo Next.js 14 para
prerendering estático.

## Alternativas descartadas

**Fazer downgrade do Prisma para 5.14.x:** Reverteria o ADR `prisma-version-7x.md`
já aceito e exigiria reescrita do schema e das queries já implementadas.

**Usar `output: "standalone"` no Next.js:** Não resolve o problema de webpack —
afeta apenas o output de deploy, não a compilação.

## Consequências

- **Positivo:** Build passa sem erros. Todas as rotas existentes continuam funcionando.
- **Positivo:** A solução é mínima — duas configurações em `next.config.mjs`.
- **Negativo:** `experimental.serverComponentsExternalPackages` é uma opção
  experimental no Next.js 14 (vira estável no Next.js 15 como `serverExternalPackages`).
  Se o projeto for migrado para Next.js 15, renomear a configuração.
- **Neutro:** Os avisos sobre Edge Runtime (`process.version`, `setImmediate`) durante
  o build são warnings esperados — Prisma/mariadb não são usados no middleware (Edge).
