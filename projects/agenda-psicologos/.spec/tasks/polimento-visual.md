# Tasks — polimento-visual

**Feature:** Polimento Visual
**Slug:** `polimento-visual`
**Criado em:** 2026-05-08
**Total de tasks:** 5

---

## TASK-01 — ui: paleta warm-sage e Toaster global

**done:** false
**can_parallelize:** false
**depends_on:** []

### O que implementar

Atualizar dois arquivos de configuração global para aplicar a nova paleta de cores e configurar o toaster de notificações.

**1. `projects/agenda-psicologos/src/app/globals.css`**

Substituir o bloco `:root` existente (que usa apenas `--background` e `--foreground`) pelo bloco completo do shadcn/ui com os tokens warm-sage. O arquivo atual tem apenas background/foreground sem tokens de primary/accent — adicionar o `:root` completo do shadcn/ui com os valores abaixo sobrescrevendo primary e accent:

```css
:root {
  /* warm-sage — substitui azul-teal padrão */
  --primary: 152 38% 35%;
  --primary-foreground: 0 0% 98%;
  --accent: 240 20% 60%;
  --accent-foreground: 0 0% 98%;

  /* Destrutivo — inalterado */
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
}
```

Manter as demais linhas do arquivo inalteradas (`@tailwind base/components/utilities`, body, media query dark).

**Importante:** Remover o inline style `style={{ backgroundColor: "hsl(199, 89%, 38%)" }}` presente em `src/app/(auth)/dashboard/page.tsx` no Link "Agendar consulta" — substituir pela classe `bg-primary text-primary-foreground`.

**2. `projects/agenda-psicologos/src/app/(auth)/layout.tsx`**

Adicionar o `<Toaster>` do sonner logo antes do fechamento da `<div>` raiz e adicionar `transition-all duration-200 ease-in-out` na tag `<main>`:

```typescript
import { Toaster } from "sonner"

// No JSX, dentro da div raiz, após <main>:
<Toaster position="bottom-right" richColors />

// No <main> existente, adicionar classes:
<main className="md:ml-56 px-4 py-6 md:px-8 min-h-screen transition-all duration-200 ease-in-out">
```

Verificar se `sonner` já está instalado no `package.json`. Se não estiver, rodar `pnpm add sonner` antes de importar.

**3. `projects/agenda-psicologos/.spec/design-tokens.md`**

Atualizar o bloco CSS da seção "Paleta de Cores" substituindo:
```css
--primary: 199 89% 38%;  /* azul-teal */
```
por:
```css
--primary: 152 38% 35%;  /* verde-sálvia warm-sage */
--accent: 240 20% 60%;   /* índigo suave */
--accent-foreground: 0 0% 98%;
```

### Critérios de aceite técnicos

- `globals.css` contém `--primary: 152 38% 35%` e `--accent: 240 20% 60%` no `:root`
- `--destructive: 0 72% 51%` permanece inalterado
- Layout autenticado renderiza `<Toaster position="bottom-right" richColors />`
- `<main>` tem classes `transition-all duration-200 ease-in-out`
- Inline style com `hsl(199, 89%, 38%)` removido do dashboard/page.tsx
- `design-tokens.md` reflete os novos valores warm-sage

### DoD Checklist

- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu: `pnpm test:coverage`
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Commit segue o padrão: `style(ui): aplicar paleta warm-sage e configurar Toaster global`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado
- [ ] Componente novo funciona em viewport 375px sem scroll horizontal

---

## TASK-02 — ui: redesenho do dashboard com queries novas

**done:** false
**can_parallelize:** false
**depends_on:** [TASK-01]

### O que implementar

Redesenhar completamente `src/app/(auth)/dashboard/page.tsx` para exibir as três seções especificadas na feature spec, além de criar as queries de suporte.

**1. Criar `src/features/dashboard/queries/getDashboardData.ts`**

Criar pasta `src/features/dashboard/queries/` e o arquivo com as duas queries novas:

```typescript
// Contagem de consultas aguardando confirmação (próximos 7 dias, status scheduled, sem token confirmado)
export async function getPendingConfirmationCount(userId: string): Promise<number>

// Resumo semanal (segunda a domingo da semana corrente)
export async function getWeeklySummary(
  userId: string,
  weekStart: Date
): Promise<{ total: number; confirmed: number; cancelled: number }>
```

Lógica de `getPendingConfirmationCount`:
```sql
-- WHERE userId = userId
-- AND status = 'scheduled'
-- AND scheduledAt BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
-- AND id NOT IN (SELECT appointmentId FROM appointment_tokens WHERE confirmedAt IS NOT NULL)
```

Em Prisma:
```typescript
return prisma.appointment.count({
  where: {
    userId,
    status: "scheduled",
    scheduledAt: { gte: now, lte: sevenDaysFromNow },
    appointmentToken: { confirmedAt: null },
  },
})
```

Lógica de `getWeeklySummary`: usar `prisma.appointment.groupBy` ou três counts separados por status, filtrando `scheduledAt` entre `weekStart` e `weekEnd` (domingo às 23:59:59) e `userId`.

**2. Reescrever `src/app/(auth)/dashboard/page.tsx`**

O novo dashboard deve ser um Server Component que:

a) Obtém sessão via `auth()` e redireciona para `/login` se não autenticado.

b) Cálcula saudação dinâmica por horário do servidor:
   - 05:00–11:59 → "Bom dia"
   - 12:00–17:59 → "Boa tarde"
   - 18:00–04:59 → "Boa noite"

c) Carrega dados em paralelo via `Promise.all`:
   - `getDayAppointments(userId, today)` — consultas do dia atual (query já existente em `src/features/appointments/queries/getDayAppointments.ts`)
   - `getPendingConfirmationCount(userId)` — contagem de pendentes
   - `getWeeklySummary(userId, weekStart)` — métricas semanais

d) Renderiza três seções:

**Seção 1 — "Agenda de hoje":**
- Título com dia da semana e data por extenso
- Se há consultas: lista com `Link` para `/appointments/[id]`, exibindo horário de início, nome do paciente e `AppointmentStatusBadge` (componente existente em `src/features/appointments/components/AppointmentStatusBadge.tsx`)
- Se não há consultas: estado vazio com ícone de calendário muted, texto "Sem consultas hoje", link "Ver agenda da semana" → `/appointments`

**Seção 2 — "Aguardando confirmação":**
- Badge com contagem de `getPendingConfirmationCount`
- Se contagem > 0: badge `bg-amber-100 text-amber-800`, clicável para `/appointments`
- Se contagem = 0: badge `bg-gray-100 text-gray-600`, sem destaque especial

**Seção 3 — "Resumo da semana":**
- Três cards usando o padrão de `Card`/`CardHeader`/`CardTitle`/`CardDescription` do shadcn/ui:
  - "Esta semana" → `total`
  - "Confirmadas" → `confirmed`
  - "Canceladas" → `cancelled`
- Exibir "0" se não há consultas na semana — não ocultar a seção

### Arquivos alvo

- `src/features/dashboard/queries/getDashboardData.ts` (NOVO)
- `src/app/(auth)/dashboard/page.tsx` (MODIFICAR — reescrever)

### Critérios de aceite técnicos

- Dashboard exibe saudação dinâmica com nome do usuário autenticado
- Seção "Agenda de hoje" exibe lista ou estado vazio conforme AC-07 e AC-08
- Seção "Aguardando confirmação" exibe badge amber quando > 0, gray quando = 0 (AC-09, AC-10)
- Seção "Resumo da semana" exibe total, confirmadas e canceladas (AC-11)
- Queries filtram obrigatoriamente por `userId` (sem vazar dados entre psicólogos)
- Não há consulta N+1 — dados carregados em `Promise.all`

### DoD Checklist

- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio — apenas apresentação
- [ ] Testes unitários para `getPendingConfirmationCount` e `getWeeklySummary` (lógica de filtragem de datas)
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu: `pnpm test:coverage`
- [ ] Casos de erro testados (userId inválido, semana sem dados)
- [ ] Toda query filtra por `userId` do usuário autenticado
- [ ] Sem queries N+1
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Commit segue o padrão: `feat(dashboard): redesenhar dashboard com agenda do dia, pendentes e resumo semanal`
- [ ] Componente novo funciona em viewport 375px sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos

---

## TASK-03 — ui: skeleton loaders para dashboard

**done:** false
**can_parallelize:** false
**depends_on:** [TASK-02]

### O que implementar

Criar os componentes de skeleton para o dashboard e integrá-los usando `Suspense` do React nas seções do dashboard que carregam dados assíncronos.

**Componentes a criar:**

**1. `src/features/dashboard/components/DashboardTodaySkeleton.tsx`**
```tsx
// Skeleton para a seção "Agenda de hoje" — 3 linhas h-12 w-full animate-pulse
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardTodaySkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
```

**2. `src/features/dashboard/components/DashboardSummarySkeleton.tsx`**
```tsx
// Skeleton para os 3 cards de resumo semanal — h-24 em grid de 3 colunas
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  )
}
```

**3. `src/features/dashboard/components/DashboardPendingSkeleton.tsx`**
```tsx
// Skeleton para o badge de pendentes — h-16 w-48
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardPendingSkeleton() {
  return <Skeleton className="h-16 w-48" />
}
```

**Integração em `src/app/(auth)/dashboard/page.tsx`:**

O dashboard atual é um Server Component monolítico. Para suportar skeletons sem tornar o arquivo um Client Component, extrair cada seção em sub-componentes Server Component separados em `src/features/dashboard/components/`:
- `TodayAppointmentsSection.tsx` — Server Component async que chama `getDayAppointments`
- `PendingConfirmationSection.tsx` — Server Component async que chama `getPendingConfirmationCount`
- `WeeklySummarySection.tsx` — Server Component async que chama `getWeeklySummary`

A `dashboard/page.tsx` compõe essas seções com `<Suspense>`:
```tsx
<Suspense fallback={<DashboardTodaySkeleton />}>
  <TodayAppointmentsSection userId={userId} today={today} />
</Suspense>

<Suspense fallback={<DashboardPendingSkeleton />}>
  <PendingConfirmationSection userId={userId} />
</Suspense>

<Suspense fallback={<DashboardSummarySkeleton />}>
  <WeeklySummarySection userId={userId} weekStart={weekStart} />
</Suspense>
```

O `userId` e `weekStart` são calculados na `page.tsx` (fora do Suspense) usando a sessão autenticada.

### Arquivos alvo

- `src/features/dashboard/components/DashboardTodaySkeleton.tsx` (NOVO)
- `src/features/dashboard/components/DashboardSummarySkeleton.tsx` (NOVO)
- `src/features/dashboard/components/DashboardPendingSkeleton.tsx` (NOVO)
- `src/features/dashboard/components/TodayAppointmentsSection.tsx` (NOVO)
- `src/features/dashboard/components/PendingConfirmationSection.tsx` (NOVO)
- `src/features/dashboard/components/WeeklySummarySection.tsx` (NOVO)
- `src/app/(auth)/dashboard/page.tsx` (MODIFICAR — refatorar para usar Suspense)

### Critérios de aceite técnicos

- Cada skeleton usa `<Skeleton>` de `@/components/ui/skeleton` com `animate-pulse` implícito
- Dashboard usa `<Suspense>` com fallback de skeleton para cada seção (AC-12, AC-13)
- Sem flash abrupto de layout ao substituir skeleton por conteúdo real (AC-19)
- Skeletons não têm lógica de negócio — puramente visuais

### DoD Checklist

- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes passam sem falha: `pnpm test` (skeletons não requerem testes unitários — AC spec)
- [ ] Cobertura de testes não diminuiu: `pnpm test:coverage`
- [ ] Build passa sem erros: `pnpm build`
- [ ] Componente novo funciona em viewport 375px sem scroll horizontal
- [ ] Commit segue o padrão: `feat(dashboard): adicionar skeleton loaders nas seções do dashboard`

---

## TASK-04 — ui: skeleton loaders para listas de features existentes

**done:** false
**can_parallelize:** false
**depends_on:** [TASK-01]

### O que implementar

Criar os componentes de skeleton para as 5 páginas de features existentes e integrá-los como loading states via `loading.tsx` do Next.js App Router (convencão de colocação de arquivo de loading ao lado do `page.tsx`).

**Componentes a criar:**

**1. `src/features/patients/components/PatientListSkeleton.tsx`**
- 5 linhas skeleton `h-14 w-full` separadas por `divide-y`
- Cada linha imita layout real: bloco de nome `w-48` + bloco de telefone `w-32` à esquerda, bloco de ação `w-8` à direita

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function PatientListSkeleton() {
  return (
    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 h-14">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}
```

**2. `src/features/appointments/components/WeeklyCalendarSkeleton.tsx`**
- Skeleton cabeçalho `h-10 w-full` + skeleton grid `h-48 w-full`

**3. `src/features/appointments/components/DayViewSkeleton.tsx`**
- 3 blocos skeleton `h-16 w-full` representando consultas da lista diária

**4. `src/features/notes/components/NoteListSkeleton.tsx`**
- 3 blocos skeleton `h-20 w-full` representando prontuários

**5. `src/features/payments/components/FinancialDashboardSkeleton.tsx`**
- 3 cards skeleton `h-24` em grid de 3 colunas + 5 linhas skeleton `h-12 w-full`

**Integração via `loading.tsx`:**

Criar arquivos `loading.tsx` ao lado dos `page.tsx` das rotas afetadas. O Next.js App Router usa automaticamente `loading.tsx` como Suspense boundary durante navegação e carregamento inicial:

- `src/app/(auth)/patients/loading.tsx` → exporta `<PatientListSkeleton />`
- `src/app/(auth)/appointments/loading.tsx` → exporta `<WeeklyCalendarSkeleton />`
- `src/app/(auth)/appointments/day/[date]/loading.tsx` → exporta `<DayViewSkeleton />`
- `src/app/(auth)/patients/[id]/notes/loading.tsx` → exporta `<NoteListSkeleton />`
- `src/app/(auth)/financeiro/loading.tsx` → exporta `<FinancialDashboardSkeleton />`

Cada `loading.tsx` deve ser assim:
```tsx
import { PatientListSkeleton } from "@/features/patients/components/PatientListSkeleton"

export default function Loading() {
  return <PatientListSkeleton />
}
```

### Arquivos alvo (novos)

- `src/features/patients/components/PatientListSkeleton.tsx`
- `src/features/appointments/components/WeeklyCalendarSkeleton.tsx`
- `src/features/appointments/components/DayViewSkeleton.tsx`
- `src/features/notes/components/NoteListSkeleton.tsx`
- `src/features/payments/components/FinancialDashboardSkeleton.tsx`
- `src/app/(auth)/patients/loading.tsx`
- `src/app/(auth)/appointments/loading.tsx`
- `src/app/(auth)/appointments/day/[date]/loading.tsx`
- `src/app/(auth)/patients/[id]/notes/loading.tsx`
- `src/app/(auth)/financeiro/loading.tsx`

### Critérios de aceite técnicos

- Cada skeleton usa `<Skeleton>` de `@/components/ui/skeleton`
- Dimensões seguem exatamente os valores do AC-14 ao AC-18
- `loading.tsx` exporta componente default que renderiza o skeleton correspondente
- Nenhum `page.tsx` existente foi modificado nesta task

### DoD Checklist

- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu: `pnpm test:coverage`
- [ ] Build passa sem erros: `pnpm build`
- [ ] Componente novo funciona em viewport 375px sem scroll horizontal
- [ ] Commit segue o padrão: `feat(ui): adicionar skeleton loaders para listas de pacientes, agenda, prontuários e financeiro`

---

## TASK-05 — ui: toasts de feedback em actions existentes

**done:** false
**can_parallelize:** false
**depends_on:** [TASK-01]

### O que implementar

Adicionar chamadas `toast.success(...)` e `toast.error(...)` do sonner nos componentes Client existentes que disparam Server Actions. Os toasts **não podem ser adicionados diretamente nas Server Actions** (que rodam no servidor) — devem ser chamados nos componentes Client após receber o resultado da action.

**Padrão de implementação em Client Components:**

```typescript
"use client"
import { toast } from "sonner"

// Após chamar a Server Action:
const result = await createAppointment(data)
if (result.success) {
  toast.success("Consulta agendada com sucesso")
  router.push("/appointments")
} else {
  toast.error("Algo deu errado. Tente novamente.")
}
```

**Duração:**
- Sucesso: padrão do sonner (4s auto-dismiss) — não especificar `duration` explícito
- Erro: `{ duration: Infinity }` ou `toast.error(..., { duration: Infinity })`

**Componentes Client a modificar:**

| Componente | Arquivo | Ações | Mensagens |
|---|---|---|---|
| `AppointmentForm` | `src/features/appointments/components/AppointmentForm.tsx` | `createAppointment` (sucesso), `updateAppointment` (sucesso) | "Consulta agendada com sucesso" / "Consulta atualizada" |
| `CancelDialog` | `src/features/appointments/components/CancelDialog.tsx` | `cancelAppointment` | "Consulta cancelada" |
| `AppointmentDetailPanel` ou `AppointmentDetails` | `src/features/appointments/components/AppointmentDetailPanel.tsx` e `AppointmentDetails.tsx` | `completeAppointment`, `markNoShow`, confirmação manual | "Consulta marcada como realizada" / "Marcado como não compareceu" / "Consulta confirmada" |
| `CancelAppointmentDialog` | `src/features/confirmacao-paciente` — verificar path exato | `cancelAppointment` | "Consulta cancelada" |
| `SessionNoteForm` | `src/features/notes/components/SessionNoteForm.tsx` | `createSessionNote`, `updateSessionNote` | "Prontuário salvo" / "Prontuário atualizado" |
| `PaymentSheet` | `src/features/payments/components/PaymentSheet.tsx` | `createSessionPayment`, `updateSessionPayment` | "Pagamento registrado" / "Pagamento atualizado" |
| Componente de lembrete | `src/features/reminders/` — verificar componente que dispara link | copiar/abrir WhatsApp | "Link de lembrete copiado" / "Link de lembrete aberto no WhatsApp" |

**Para confirmar qual componente lida com lembretes**, verificar os componentes em `src/features/reminders/` — o componente que tem botão de "Copiar link" ou "Abrir WhatsApp" deve receber o toast.

**Erro genérico:** Em todos os `catch` e em todos os branches `else` (quando a action retorna erro), chamar:
```typescript
toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
```

**Nunca expor detalhes técnicos do erro** — a mensagem é sempre genérica.

### Arquivos alvo (modificar)

- `src/features/appointments/components/AppointmentForm.tsx`
- `src/features/appointments/components/CancelDialog.tsx`
- `src/features/appointments/components/AppointmentDetailPanel.tsx`
- `src/features/appointments/components/AppointmentDetails.tsx`
- `src/features/notes/components/SessionNoteForm.tsx`
- `src/features/payments/components/PaymentSheet.tsx`
- Componente de lembrete (identificar via `ls src/features/reminders/components/`)

### Critérios de aceite técnicos

- `toast.success(...)` chamado após cada ação bem-sucedida com a mensagem exata do AC-20 ao AC-25
- `toast.error("Algo deu errado. Tente novamente.")` chamado em todos os erros (AC-26)
- Toasts de erro persistem até fechar (`duration: Infinity`)
- Toasts de sucesso auto-dismissem em ~4s (padrão sonner)
- Nenhum detalhe técnico do erro exposto ao usuário
- `toast` importado de `"sonner"` — não criar abstração wrapper

### DoD Checklist

- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio além de apresentação e chamadas a Server Actions
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu: `pnpm test:coverage`
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Commit segue o padrão: `feat(ui): adicionar toasts de feedback em todas as ações críticas`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

## Diagrama de execução

```
TASK-01 (paleta + Toaster + design-tokens)
  ├── TASK-02 (dashboard redesenho + queries) [sequencial após TASK-01]
  │     └── TASK-03 (skeletons dashboard + Suspense) [sequencial após TASK-02]
  └── TASK-04 (skeletons features existentes) [paralelo com TASK-02 e TASK-03]
  └── TASK-05 (toasts em actions existentes) [paralelo com TASK-02, TASK-03 e TASK-04]
```

TASK-04 e TASK-05 dependem apenas de TASK-01 (o Toaster precisa estar configurado antes dos toasts). Elas podem rodar em paralelo entre si e com TASK-02/TASK-03 pois operam em arquivos completamente diferentes.
