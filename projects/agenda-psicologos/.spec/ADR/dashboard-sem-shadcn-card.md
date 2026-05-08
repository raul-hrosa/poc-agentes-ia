# ADR: dashboard sem componentes shadcn/ui Card e lucide-react

**Data:** 2026-05-08
**Status:** Accepted

## Contexto

A TASK-02 de polimento-visual especifica o uso de `Card`, `CardHeader`, `CardTitle` e `CardContent` do shadcn/ui e `CalendarIcon` do lucide-react no dashboard redesenhado. Durante a implementação, verificou-se que o projeto `agenda-psicologos` não possui essas dependências instaladas (`@/components/ui/card` não existe, `lucide-react` não está no `package.json`).

## Decisão

Implementar o dashboard sem as dependências ausentes:
- Substituir `Card`/`CardHeader`/`CardTitle`/`CardContent` por divs com classes Tailwind equivalentes (`rounded-xl border border-border bg-card p-4`, etc.)
- Substituir `CalendarIcon` do lucide-react por um SVG inline equivalente (o projeto já usa SVGs inline no dashboard original)

Não instalar novas dependências pois a task não prevê esse passo e alteraria o `package.json` fora do escopo definido.

## Alternativas descartadas

- Instalar `lucide-react` e criar componentes shadcn/ui: fora do escopo da task (nenhuma instrução para adicionar dependências)
- Pular o ícone de calendário: violaria o critério visual da seção "estado vazio"

## Consequências

- Positivas: zero novas dependências, implementação consistente com o restante do codebase que usa SVGs inline e divs com Tailwind
- Negativas: o código não usa os nomes semânticos `Card`/`CardContent` como descrito na spec — equivalência visual é mantida
- Neutras: se no futuro shadcn/ui for adicionado, o dashboard pode ser migrado para os componentes oficiais
