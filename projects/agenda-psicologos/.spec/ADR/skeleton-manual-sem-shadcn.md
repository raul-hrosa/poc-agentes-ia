# ADR — Skeleton criado manualmente sem shadcn/ui CLI

**Slug:** `skeleton-manual-sem-shadcn`
**Data:** 2026-05-08
**Status:** accepted

## Contexto

A spec da feature `polimento-visual` e as tasks (TASK-03, TASK-04) especificam que os componentes de skeleton devem usar `<Skeleton>` importado de `@/components/ui/skeleton`. O review BLK-03 identificou que os componentes estavam usando `<div className="animate-pulse bg-muted rounded ...">` em vez do componente shadcn/ui.

O projeto não possui `components.json` (arquivo de configuração do shadcn/ui CLI), o que impede o uso do comando `pnpm dlx shadcn@latest add skeleton`. O ADR `dashboard-sem-shadcn-card.md` já havia documentado que as dependências do shadcn/ui não estavam presentes no projeto — a solução adotada na época foi usar divs Tailwind diretamente.

## Decisão

Criar o componente `src/components/ui/skeleton.tsx` manualmente, com o mesmo código que o shadcn/ui CLI geraria. O componente usa apenas `React.HTMLAttributes<HTMLDivElement>` e concatenação de string para className (sem `cn` do `lib/utils`, que não existe no projeto).

## Alternativas consideradas

1. **Instalar shadcn/ui** — requereria criar `components.json`, instalar `clsx` e `tailwind-merge`, configurar o CLI. Escopo fora da task de correção de blocker.
2. **Manter divs Tailwind** — violaria a spec e manteria o BLK-03 ativo, bloqueando o review.
3. **Criação manual do componente** — escolhido por ser a solução de menor escopo que satisfaz o contrato da spec sem introduzir dependências novas.

## Consequências

- Positivas: BLK-03 resolvido, todos os skeleton components seguem o padrão especificado.
- Negativas: O componente Skeleton não usa `cn()` — se no futuro `lib/utils` for adicionado ao projeto, o componente deve ser atualizado para usar a forma padrão do shadcn.
- Neutras: O path `@/components/ui/skeleton` está disponível para qualquer novo componente que precise de skeleton no futuro.
