# Context Bundle — polimento-visual

> Gerado em: 2026-05-08
> Feature: Polimento Visual
> Entidades: Appointment, Patient, AppointmentToken (leitura apenas — sem alterações de schema)

---

## Entidades do banco (leitura apenas — sem migrations nesta feature)

### Appointment

```prisma
model Appointment {
  id          String            @id @default(cuid())
  userId      String
  patientId   String
  scheduledAt DateTime
  durationMin Int               @default(50)
  status      AppointmentStatus @default(scheduled)
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user             User             @relation(fields: [userId], references: [id])
  patient          Patient          @relation(fields: [patientId], references: [id])
  appointmentToken AppointmentToken?
  sessionNote      SessionNote?
  sessionPayment   SessionPayment?
}

enum AppointmentStatus {
  scheduled
  confirmed
  completed
  cancelled
  no_show
}
```

### Patient

```prisma
model Patient {
  id           String    @id @default(cuid())
  userId       String
  name         String
  email        String?
  phone        String
  birthDate    DateTime?
  notes        String?
  archivedAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User          @relation(fields: [userId], references: [id])
  appointments Appointment[]
  sessionNotes SessionNote[]
}
```

### AppointmentToken

```prisma
model AppointmentToken {
  id            String    @id @default(cuid())
  appointmentId String    @unique
  token         String    @unique
  expiresAt     DateTime
  confirmedAt   DateTime?
  cancelledAt   DateTime?
  createdAt     DateTime  @default(now())

  appointment   Appointment @relation(fields: [appointmentId], references: [id])
}
```

### SessionNote (referência — para skeleton)

```prisma
model SessionNote {
  id            String   @id @default(cuid())
  userId        String
  appointmentId String   @unique
  patientId     String
  content       String   @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### SessionPayment (referência — para skeleton)

```prisma
model SessionPayment {
  id            String        @id @default(cuid())
  userId        String
  appointmentId String        @unique
  patientId     String
  amountCents   Int
  status        PaymentStatus @default(pending)
  paidAt        DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum PaymentStatus {
  pending
  paid
}
```

---

## Arquivos existentes relevantes

### `src/app/(auth)/dashboard/page.tsx` — estado atual

Server Component que carrega `getWeekAppointments`, `countActivePatients` e `getFinancialSummary`. Exibe cards genéricos sem as seções exigidas pela nova spec. Contém inline style `style={{ backgroundColor: "hsl(199, 89%, 38%)" }}` que deve ser removido.

### `src/app/(auth)/layout.tsx` — estado atual

```typescript
import { redirect } from "next/navigation"
import { auth } from "@/shared/lib/auth"
import { SidebarNav } from "@/app/(auth)/_components/SidebarNav"

export default async function AuthLayout({ children }) {
  const session = await auth()
  if (!session?.user) { redirect("/login") }

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />
      <main className="md:ml-56 px-4 py-6 md:px-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
```

Modificar: adicionar `<Toaster>` e `transition-all duration-200 ease-in-out` no `<main>`.

### `src/app/globals.css` — estado atual

Contém apenas `@tailwind` directives e variáveis `--background`/`--foreground`. Não tem tokens do shadcn/ui (`--primary`, `--accent`, etc.). Adicionar bloco `:root` com tokens warm-sage.

### Query já existente a reutilizar

```typescript
// src/features/appointments/queries/getDayAppointments.ts
// Assinatura aproximada:
getDayAppointments(userId: string, date: Date): Promise<Appointment[]>
// Reutilizar no TodayAppointmentsSection sem criar nova query
```

### Componente existente a reutilizar no dashboard

```typescript
// src/features/appointments/components/AppointmentStatusBadge.tsx
// Exibe badge de status da consulta — importar no novo TodayAppointmentsSection
import { AppointmentStatusBadge } from "@/features/appointments/components/AppointmentStatusBadge"
```

### Componente Skeleton do shadcn/ui

```typescript
// Já instalado em src/components/ui/skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"
// Uso: <Skeleton className="h-12 w-full" />
// animate-pulse já está embutido no componente Skeleton do shadcn/ui
```

---

## Estrutura de pastas da feature dashboard (a criar)

```
src/features/dashboard/
  queries/
    getDashboardData.ts     ← getPendingConfirmationCount + getWeeklySummary
  components/
    DashboardTodaySkeleton.tsx
    DashboardSummarySkeleton.tsx
    DashboardPendingSkeleton.tsx
    TodayAppointmentsSection.tsx
    PendingConfirmationSection.tsx
    WeeklySummarySection.tsx
```

---

## Prisma Client singleton

```typescript
// Sempre importar de:
import { prisma } from "@/shared/lib/prisma"
// Nunca instanciar new PrismaClient() diretamente
```

---

## Autenticação em Server Components e queries

```typescript
// Em Server Components (page.tsx):
import { auth } from "@/shared/lib/auth"
const session = await auth()
if (!session?.user?.id) { redirect("/login") }
const userId = session.user.id

// Toda query DEVE filtrar por userId:
where: { userId }
```

---

## Padrão de toasts (sonner)

```typescript
"use client"
import { toast } from "sonner"

// Sucesso (auto-dismiss ~4s):
toast.success("Mensagem de sucesso")

// Erro (persiste até fechar):
toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
```

**Toasts são chamados em Client Components** após receber o resultado da Server Action. Nunca dentro de Server Actions.

---

## Comandos do projeto

| Operação | Comando |
|---|---|
| Lint | `pnpm lint` |
| Type-check | `pnpm typecheck` |
| Testes | `pnpm test` |
| Cobertura | `pnpm test:coverage` |
| Build | `pnpm build` |
| Dev server | `pnpm dev` |

---

## Padrão de commit

Formato: `<type>(<scope>): <description>`

Tipos: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`

Escopos válidos para esta feature: `ui`, `dashboard`, `appointments`, `patients`, `notes`, `payments`, `reminders`

Exemplos:
```
style(ui): aplicar paleta warm-sage e configurar Toaster global
feat(dashboard): redesenhar dashboard com agenda do dia, pendentes e resumo semanal
feat(dashboard): adicionar skeleton loaders nas seções do dashboard
feat(ui): adicionar skeleton loaders para listas de pacientes, agenda, prontuários e financeiro
feat(ui): adicionar toasts de feedback em todas as ações críticas
```

---

## Runtime constraints para esta feature

Esta feature cria apenas:
- Server Components (`src/app/(auth)/**/page.tsx` e `src/app/(auth)/**/loading.tsx`)
- Client Components (`src/features/**/components/*.tsx` — aqueles que já são `"use client"`)
- Queries (`src/features/dashboard/queries/`)
- Modificações em `src/app/(auth)/layout.tsx` e `src/app/globals.css`

**Todos esses arquivos rodam em Node.js Runtime.**
Prisma e módulos Node podem ser usados livremente nestes paths.

Nenhum arquivo desta feature toca em `src/middleware.ts` — não há risco de violação Edge Runtime.

**Atenção:** O `<Toaster>` do sonner é adicionado no `layout.tsx` (Server Component) mas o próprio `<Toaster>` do sonner é um Client Component internamente — isso é correto e esperado. Não adicionar `"use client"` no `layout.tsx`.

---

## Definition of Done

### Qualidade de código

- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo (regra `noImplicitAny` ativa no tsconfig)
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção (usar Sentry)
- [ ] Nenhum `TODO` ou `FIXME` no código entregue — ou está documentado em bug/task separada
- [ ] Componentes React não têm lógica de negócio — apenas apresentação e chamadas a Server Actions

### Testes

- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados (input inválido, usuário não autenticado, recurso não encontrado)

### Segurança e autenticação

- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado (sem vazar dados de outros psicólogos)
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco

### LGPD e CFP

- [ ] Dados de prontuário (`session_notes`) acessíveis apenas via `user_id` autenticado
- [ ] Dados de paciente (`birth_date`, `phone`) não expostos em logs ou respostas de erro
- [ ] Sem exposição de dados de paciente em URLs (IDs são UUIDs opacos)
- [ ] Página de confirmação por token não exibe dados de saúde do paciente

### Mobile-first

- [ ] Componente novo funciona em viewport 375px de largura (iPhone SE) sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile
- [ ] Sem ações que dependem exclusivamente de hover

### Banco de dados

- [ ] Nenhuma migration órfã — esta feature NÃO cria migrations
- [ ] Sem queries N+1 — relações carregadas com `include` ou `select` quando necessário

### Build e deploy

- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código

### Commit

- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Um commit por task (ou por conjunto coeso de mudanças da task)
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado
