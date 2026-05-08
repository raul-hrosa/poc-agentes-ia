# Design Tokens — PsiAgenda

> Gerado em: 2026-05-07 (retroativo — Fase 1.5)
> Tom visual: profissional e acolhedor para profissional de saúde solo

## Identidade Visual

**Tom:** Limpo, confiável, acolhedor. O psicólogo recém-formado não é tech-savvy
— a interface deve parecer simples e profissional, não uma ferramenta técnica.

**Referência:** Simplicidade do Linear + leveza do Notion. Nada intimidador,
nada genérico demais.

**Público principal:** Psicólogo solo, celular como ferramenta principal,
5-20 pacientes, renda R$ 2-6k. Interface deve funcionar perfeitamente no
celular e parecer profissional para mostrar a clientes.

## Fonte

```typescript
// src/app/layout.tsx
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"] })
```

| Elemento | Classe Tailwind |
|---|---|
| Título de página (h1) | `text-2xl font-semibold tracking-tight` |
| Título de seção (h2) | `text-lg font-semibold` |
| Label de campo | `text-sm font-medium` |
| Corpo de texto | `text-sm` |
| Texto secundário | `text-sm text-muted-foreground` |
| Caption / metadado | `text-xs text-muted-foreground` |

## Paleta de Cores

Usar as CSS variables do shadcn/ui em `src/app/globals.css`.
Defina apenas as variáveis que diferem do tema padrão:

```css
:root {
  /* warm-sage: verde-sálvia acolhedor para contexto de saúde mental */
  --primary: 152 38% 35%;           /* hsl — verde-sálvia warm-sage */
  --primary-foreground: 0 0% 98%;   /* branco sobre primary */
  --accent: 240 20% 60%;            /* índigo suave — destaque secundário */
  --accent-foreground: 0 0% 98%;

  /* Destructive: vermelho suave, não alarmante */
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
}
```

**Uso do primary:**
- Botões de ação principal (Agendar, Salvar, Confirmar)
- Links de navegação ativos
- Indicador de foco em inputs
- Badges de status positivo (confirmed, completed)

**Nunca usar primary em:**
- Texto de corpo
- Backgrounds de seção
- Bordas genéricas

## Padrões de Componente

### Lista de pacientes e consultas

**Mobile (padrão):**
- Cada item ocupa largura total
- Padding: `p-4`
- Nome em `font-medium`, informação secundária em `text-sm text-muted-foreground`
- Ação principal: toque no item inteiro (não apenas em um botão)
- Ação secundária: ícone `...` no canto direito (menu dropdown)
- Separador: `divide-y` entre itens, sem cards individuais

**Desktop (`md:`):**
- Tabela com colunas ou grid 2-col de cards
- `min-h-[44px]` mantido em todas as linhas

**Estado vazio:**
```tsx
<div className="flex flex-col items-center gap-3 py-12 text-center">
  <Icon className="h-10 w-10 text-muted-foreground/50" />
  <p className="font-medium">Nenhum [paciente/consulta] encontrado</p>
  <p className="text-sm text-muted-foreground">[Contexto + instrução]</p>
  <Button size="sm">[Ação principal]</Button>
</div>
```

### Formulários

- Largura máxima: `max-w-lg mx-auto` em mobile e desktop
- Container: `Card` com `CardHeader` + `CardContent` + `CardFooter`
- Espaçamento entre campos: `space-y-4`
- Labels: sempre visíveis (nunca só placeholder)
- Campos obrigatórios: asterisco `*` vermelho no label
- Botão submit: `w-full` em mobile, alinhado à direita em desktop
- Botão cancelar: `variant="ghost"` à esquerda do submit

### Cards de dashboard / resumo

```tsx
<Card>
  <CardHeader className="pb-2">
    <CardDescription>[Label do card]</CardDescription>
    <CardTitle className="text-3xl font-bold">[Valor em destaque]</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-xs text-muted-foreground">[Contexto ou comparação]</p>
  </CardContent>
</Card>
```

### Badges de status de consulta

| Status | Variant / Classes |
|---|---|
| `scheduled` | `bg-blue-100 text-blue-800` |
| `confirmed` | `bg-green-100 text-green-800` |
| `completed` | `bg-gray-100 text-gray-700` |
| `cancelled` | `bg-red-100 text-red-700` |
| `no_show` | `bg-orange-100 text-orange-700` |

### Navegação lateral (layout autenticado)

**Mobile:** Header fixo com logo + hambúrguer. Menu como Sheet lateral.
**Desktop (`md:`):** Sidebar fixo à esquerda, `w-56`, com links e logout no rodapé.

Links de navegação ativos: `bg-primary/10 text-primary font-medium`
Links inativos: `text-muted-foreground hover:text-foreground hover:bg-muted`

## Mobile-first Rules

- **Padding lateral de página:** `px-4 py-6` em mobile → `md:px-8`
- **Touch targets:** `min-h-[44px] min-w-[44px]` em TODOS os elementos interativos
- **Texto mínimo:** `text-sm` (14px) para qualquer texto de conteúdo
- **Sem hover-only:** botões de ação devem ser sempre visíveis, não aparecer só em hover
- **Inputs em mobile:** `text-base` nos inputs (evita zoom automático no iOS)
- **Scroll:** listas longas usam scroll nativo — não paginação pesada com botão "carregar mais"
- **Calendário/agenda semanal:** em mobile, mostrar apenas 3 dias por vez com scroll horizontal
