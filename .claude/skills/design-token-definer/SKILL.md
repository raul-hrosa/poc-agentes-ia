# Skill: Design Token Definer

Você sabe derivar tokens visuais de um briefing de produto e documentá-los
em `design-tokens.md`. Esses tokens transformam shadcn/ui genérico em produto
com identidade visual consistente.

## Por que isso existe

O impl-agent com shadcn/ui e Tailwind sem diretrizes visuais sempre produz
o resultado mais conservador: componentes padrão, sem hierarquia, sem identidade.
A diferença entre um produto amador e profissional em shadcn/ui está em 15-20
decisões de composição — não em quais componentes existem.

## O que são design tokens (neste contexto)

São as decisões visuais mínimas necessárias para o impl-agent fazer escolhas
consistentes. Não é um design system completo — é o subconjunto que um
desenvolvedor solo precisa para não improvisar visualmente.

## Como derivar tokens do produto

### 1. Identifique o tom visual a partir do produto

| Tipo de produto | Tom visual recomendado |
|---|---|
| SaaS de saúde / bem-estar | Azul suave ou verde, bastante espaço em branco, tipografia limpa |
| SaaS B2B produtividade | Neutro, cinza frio, acentos contrastantes |
| SaaS financeiro | Azul escuro, verde para positivo, vermelho para negativo |
| App de gestão solo / freelancer | Simples, acolhedor, não intimidador |
| E-commerce | Quente, CTAs fortes, menos espaço em branco |

### 2. Paleta de cores: defina apenas o essencial

Use as CSS variables do shadcn/ui. Defina somente:

- `--primary`: cor de ação principal (botões CTA, links ativos, foco de input)
- `--primary-foreground`: texto legível sobre `--primary`
- `--destructive`: erros, ações destrutivas, alertas críticos

O restante do sistema (background, card, border, muted, accent) herda dos
defaults do tema shadcn/ui — não redefina sem razão.

**Não invente paletas de 50 cores.** Um produto solo precisa de 3 cores
definidas, não de um design system corporativo.

### 3. Tipografia

shadcn/ui usa `font-sans` por padrão. Defina:

- Qual fonte carregar via `next/font/google` (Inter é a escolha segura para
  produtos profissionais; outras opções: DM Sans, Plus Jakarta Sans)
- Escala de tamanhos em classes Tailwind:

| Elemento | Classe Tailwind |
|---|---|
| Título de página (h1) | `text-2xl font-semibold` |
| Título de seção (h2) | `text-lg font-semibold` |
| Corpo de texto | `text-sm` ou `text-base` |
| Texto secundário / muted | `text-sm text-muted-foreground` |
| Label de campo | `text-sm font-medium` |

### 4. Padrões de componente

Para os tipos de tela do produto, defina o padrão de composição.
Exemplos para SaaS com listas e formulários:

**Lista de itens (pacientes, consultas, etc.):**
- Mobile: lista vertical, cada item ocupa largura total, informação essencial
  visível sem expandir
- Desktop: tabela com colunas ou grid de cards
- Informação obrigatória visível: nome, status, ação principal
- Ação secundária: em menu `...` ou expandindo o item

**Formulário:**
- Largura máxima: `max-w-lg` centrado (não formulário full-width)
- Espaçamento entre campos: `space-y-4`
- Botão de submit: à direita no rodapé, `w-full` em mobile
- Campos obrigatórios: asterisco `*` no label

**Card de resumo / dashboard:**
- Padding: `p-4 md:p-6`
- Header: título + valor em destaque
- Footer: contexto ou ação secundária

**Estado vazio (EmptyState):**
- Ícone neutro (não emoji)
- Título: o que está faltando
- Descrição: por que está vazio e o que fazer
- CTA: botão de ação principal

### 5. Mobile-first essentials

- **Padding lateral:** `px-4` em mobile, `px-6` em tablet+
- **Touch target mínimo:** `min-h-[44px]` em todo elemento interativo
- **Fontes:** nunca menor que `text-sm` (14px) para texto de conteúdo
- **Sem hover-only:** qualquer ação que aparece em hover deve estar acessível
  em toque (usar menus explícitos, não hover reveal)
- **Scroll suave:** listas longas usam scroll nativo, não paginação pesada

## O que NÃO definir em design-tokens.md

- Sombras, border-radius, animações (shadcn/ui tem defaults bons — não mude)
- Paleta completa de cores (defina apenas o necessário)
- Dark mode (adicione só se o produto realmente precisar)
- Responsividade detalhada por breakpoint para cada componente

**Regra:** Se o impl-agent precisar de mais de 2 segundos para escolher uma
cor ou composição, os tokens não são suficientes. Adicione mais exemplos
concretos — não mais teoria.

## Template de design-tokens.md

```markdown
# Design Tokens — [projeto]

> Gerado em: [data]
> Tom visual: [descrição em 1 linha]

## Identidade Visual

**Tom:** [ex: profissional e acolhedor, para profissional de saúde solo]
**Referência de estilo:** [ex: Linear para clareza + Notion para simplicidade]

## Fonte

```typescript
// src/app/layout.tsx
import { Inter } from "next/font/google"
const font = Inter({ subsets: ["latin"] })
```

Escala: h1 → text-2xl font-semibold | h2 → text-lg font-semibold |
body → text-sm | muted → text-sm text-muted-foreground

## Paleta (CSS variables em globals.css)

| Token | Valor (light) | Uso |
|---|---|---|
| --primary | [hex] | Botões CTA, links ativos, foco |
| --primary-foreground | [hex] | Texto sobre primary |
| --destructive | [hex] | Erros, deleção |

## Padrões de Componente

### Lista de [entidade principal]
[descreva mobile e desktop]

### Formulário
[descreva layout, largura, espaçamento]

### Dashboard / cards de resumo
[descreva composição]

### Estado vazio
[descreva EmptyState padrão]

## Mobile-first Rules

- Padding lateral: px-4 → md:px-6
- Touch targets: min-h-[44px] em todos os elementos interativos
- Texto mínimo: text-sm para conteúdo
```
