# ADR: nextjs-init-manual

> Registrado em: 2026-04-22
> Task: task-01 (persistencia-de-links)

## Contexto

A task-01 assume que o projeto Next.js já existe com `package.json` e dependências
base instaladas. Ao iniciar a implementação, verificou-se que o repositório continha
apenas os arquivos do sistema SDD (`.spec/`, `CLAUDE.md`, `README.md`, `setup.sh`),
sem nenhum projeto Next.js inicializado.

O comando `create-next-app` recusou inicializar o projeto na pasta existente porque
detectou arquivos de conflito (`.spec/`, `CLAUDE.md`, etc.).

## Decisão

Inicializar o projeto Next.js manualmente:
1. `npm init -y` para criar o `package.json` base
2. Instalar manualmente as dependências: `next`, `react`, `react-dom`, `typescript`,
   `@types/react`, `@types/node`, `eslint@8`, `eslint-config-next@14`
3. Criar `tsconfig.json` com configuração padrão Next.js 14 App Router
4. Criar `.eslintrc.json` com `"extends": "next/core-web-vitals"`
5. Criar estrutura mínima `src/app/layout.tsx` e `src/app/page.tsx` para que o
   `next lint` funcione sem erros de "no pages or app directory found"
6. Instalar dependências do Drizzle conforme task-01

## Alternativas consideradas

- **Mover os arquivos do SDD para outro diretório temporariamente e rodar `create-next-app`:**
  Descartado — arriscado e introduz passos manuais não auditáveis.

- **Usar `create-next-app` em subdiretório e mover os arquivos:**
  Descartado — criaria confusão na estrutura e na história do git.

## Consequências

**Positivas:**
- O projeto fica funcional com a mesma estrutura que `create-next-app` produziria
- O `package.json` tem os scripts corretos definidos desde o início
- O lint e type-check funcionam corretamente

**Negativas:**
- Algumas ferramentas que `create-next-app` configura automaticamente (como Prettier,
  `next.config.ts`, `tailwind.config.ts`) precisarão ser configuradas em tasks futuras
- A versão do `eslint-config-next` precisou ser fixada em `@14` para compatibilidade
  com `next@14` e `eslint@8`

**Neutras:**
- As tasks seguintes (task-02 em diante) não são afetadas, pois dependem apenas
  de `drizzle-orm` e `better-sqlite3` estarem instalados
