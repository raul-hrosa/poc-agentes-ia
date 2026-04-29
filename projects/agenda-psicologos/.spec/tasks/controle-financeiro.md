# Tasks — controle-financeiro

**Feature:** Controle Financeiro Básico de Sessões
**Slug:** `controle-financeiro`
**Criado em:** 2026-04-28
**Status:** aguardando aprovação

---

## Resumo

7 tasks cobrindo as camadas: tipos/schema Zod, queries de dados, Server Actions,
seção de pagamento na consulta, página de resumo financeiro e tela de upgrade
para plano free. A feature depende de `autenticacao`, `agenda-consultas` e
`cadastro-pacientes` estarem implementados.

A tabela `session_payments` já existe no `prisma/schema.prisma` — não é
necessária migration. Todo acesso filtra obrigatoriamente por `userId`.
O plano do usuário é verificado em toda Server Action e Server Component.

---

## Tasks

### TASK-01: criar tipos TypeScript e schemas Zod da feature payments

- **Status:** todo
- **Dependências:** autenticacao/TASK-01
- **target_path:** projects/agenda-psicologos/src/features/payments/
- **Estimativa:** P

**O que fazer:**

Criar dois arquivos na pasta `src/features/payments/`:

**1. `src/features/payments/types.ts`**

Definir os seguintes tipos TypeScript:

```typescript
export type PaymentStatus = "pending" | "paid"

export type PaymentMethod = "pix" | "cash" | "card" | "transfer"

export type SessionPayment = {
  id: string
  appointmentId: string
  amountCents: number
  status: PaymentStatus
  paidAt: Date | null
  paymentMethod: PaymentMethod | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type SessionPaymentWithContext = SessionPayment & {
  appointment: {
    scheduledAt: Date
    durationMinutes: number
    patient: {
      name: string
    }
  }
}

export type FinancialSummary = {
  totalPaidCents: number
  totalPendingCents: number
  sessionCount: number
  pendingCount: number
}

export type PaymentActionResult =
  | { success: true }
  | { error: "not_found" }
  | { error: "invalid_status" }
  | { error: "plan_required" }
  | { error: "server_error" }
  | { fieldErrors: Record<string, string[]> }
```

**2. `src/features/payments/schema.ts`**

Criar exatamente os schemas Zod conforme a spec:

```typescript
import { z } from "zod"

export const SessionPaymentFormSchema = z.object({
  appointmentId: z.string().uuid("ID da consulta inválido"),
  amountBRL: z
    .string()
    .min(1, "O valor da sessão é obrigatório")
    .transform((val) => parseFloat(val.replace(",", ".")))
    .refine((val) => !isNaN(val) && val > 0, "O valor deve ser maior que zero"),
  status: z.enum(["pending", "paid"], {
    required_error: "Selecione o status do pagamento",
  }),
  paymentMethod: z
    .enum(["pix", "cash", "card", "transfer"])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})

export const UpdateSessionPaymentSchema = z.object({
  paymentId: z.string().uuid("ID do pagamento inválido"),
  amountBRL: z
    .string()
    .min(1, "O valor da sessão é obrigatório")
    .transform((val) => parseFloat(val.replace(",", ".")))
    .refine((val) => !isNaN(val) && val > 0, "O valor deve ser maior que zero"),
  status: z.enum(["pending", "paid"], {
    required_error: "Selecione o status do pagamento",
  }),
  paymentMethod: z
    .enum(["pix", "cash", "card", "transfer"])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})
```

Também adicionar o utilitário de formatação de moeda em `src/shared/utils/format.ts`
(se o arquivo não existir, criá-lo; se existir, adicionar a função sem remover o conteúdo existente):

```typescript
// Converte centavos para string formatada em BRL: 15000 → "R$ 150,00"
export function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100)
}

// Converte string BRL para centavos: "150,00" → 15000
export function parseCurrencyToCents(amountBRL: number): number {
  return Math.round(amountBRL * 100)
}
```

**Critérios de aceite desta task:**
- [ ] `src/features/payments/types.ts` exporta todos os tipos listados acima
- [ ] `src/features/payments/schema.ts` exporta `SessionPaymentFormSchema` e `UpdateSessionPaymentSchema`
- [ ] `SessionPaymentFormSchema` rejeita `amountBRL` vazio com "O valor da sessão é obrigatório"
- [ ] `SessionPaymentFormSchema` rejeita valor `<= 0` com "O valor deve ser maior que zero"
- [ ] `formatCurrency(15000)` retorna string com "150,00" formatada em BRL
- [ ] `parseCurrencyToCents(150)` retorna `15000`
- [ ] `pnpm typecheck` passa sem erros
- [ ] `pnpm lint` passa sem erros
- [ ] Testes unitários cobrem: schema válido, amountBRL vazio, amountBRL zero, amountBRL negativo, amountBRL não numérico

**DoD checklist:**
- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados
- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco
- [ ] Componente novo funciona em viewport 375px de largura sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile
- [ ] Sem ações que dependem exclusivamente de hover
- [ ] Nenhuma migration órfã — geradas com `pnpm db:migrate`
- [ ] Prisma Client regenerado após mudança de schema: `pnpm db:generate`
- [ ] Novas colunas obrigatórias têm DEFAULT definido na migration
- [ ] Sem queries N+1
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código
- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

### TASK-02: criar queries de dados da feature payments

- **Status:** todo
- **Dependências:** TASK-01
- **target_path:** projects/agenda-psicologos/src/features/payments/queries/
- **Estimativa:** M

**O que fazer:**

Criar três arquivos de query em `src/features/payments/queries/`:

**1. `src/features/payments/queries/getFinancialSummary.ts`**

```typescript
// Assinatura: getFinancialSummary(userId: string, year: number, month: number): Promise<FinancialSummary>
//
// Lógica:
// 1. Calcular o intervalo do mês:
//    - startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)  (primeiro dia do mês, meia-noite)
//    - endDate   = new Date(year, month, 0, 23, 59, 59, 999)  (último dia do mês, fim do dia)
//
// 2. Buscar todos os session_payments do período via Prisma com join em appointments:
//    prisma.sessionPayment.findMany({
//      where: {
//        userId,
//        appointment: {
//          scheduledAt: { gte: startDate, lte: endDate },
//          deletedAt: null,
//        },
//      },
//      select: { amountCents: true, status: true },
//    })
//
// 3. Calcular em JavaScript (evitar queries separadas):
//    - totalPaidCents: soma de amountCents onde status === "paid"
//    - totalPendingCents: soma de amountCents onde status === "pending"
//    - sessionCount: total de registros retornados
//    - pendingCount: contagem onde status === "pending"
//
// 4. Retornar objeto FinancialSummary
//
// IMPORTANTE: filtrar por appointments.scheduled_at (não paid_at) — RN-07
// O campo user_id em session_payments deve obrigatoriamente estar no where
```

**2. `src/features/payments/queries/getSessionPaymentsByPeriod.ts`**

```typescript
// Assinatura:
// getSessionPaymentsByPeriod(
//   userId: string,
//   year: number,
//   month: number,
//   statusFilter?: "all" | "paid" | "pending"
// ): Promise<SessionPaymentWithContext[]>
//
// Lógica:
// 1. Calcular intervalo do mês (igual a getFinancialSummary)
// 2. Construir cláusula where:
//    {
//      userId,
//      appointment: {
//        scheduledAt: { gte: startDate, lte: endDate },
//        deletedAt: null,
//      },
//      ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
//    }
// 3. Buscar com include:
//    include: {
//      appointment: {
//        select: {
//          scheduledAt: true,
//          durationMinutes: true,
//          patient: { select: { name: true } },
//        },
//      },
//    }
// 4. Ordenar: orderBy: { appointment: { scheduledAt: "desc" } }
// 5. Retornar array tipado como SessionPaymentWithContext[]
//
// IMPORTANTE: sem N+1 — usar include para carregar appointment e patient em uma query
```

**3. `src/features/payments/queries/getSessionPaymentByAppointment.ts`**

```typescript
// Assinatura:
// getSessionPaymentByAppointment(
//   userId: string,
//   appointmentId: string
// ): Promise<SessionPayment | null>
//
// Lógica:
// prisma.sessionPayment.findFirst({
//   where: { appointmentId, userId },
// })
// Retorna o registro ou null se não existir.
// A dupla verificação (appointmentId + userId) garante que um psicólogo
// não acessa pagamento de consulta de outro psicólogo (RN-09, AC-27).
```

**Critérios de aceite desta task:**
- [ ] `getFinancialSummary` filtra por `appointments.scheduledAt` (não por `paidAt`) — RN-07
- [ ] `getFinancialSummary` retorna `{ totalPaidCents: 0, totalPendingCents: 0, sessionCount: 0, pendingCount: 0 }` quando não há registros
- [ ] `getSessionPaymentsByPeriod` aplica filtro de status apenas quando `statusFilter` não é `"all"` nem `undefined`
- [ ] `getSessionPaymentsByPeriod` retorna itens ordenados por `scheduledAt DESC`
- [ ] `getSessionPaymentsByPeriod` inclui `appointment.patient.name` sem N+1
- [ ] `getSessionPaymentByAppointment` retorna `null` quando `appointmentId` não pertence ao `userId`
- [ ] Todas as queries têm `userId` obrigatório no `where` — sem exceção
- [ ] Testes unitários com mock do Prisma cobrem: período com dados, período vazio, filtros de status, consulta não encontrada, consulta de outro usuário
- [ ] `pnpm typecheck` passa sem erros

**DoD checklist:**
- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados
- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco
- [ ] Componente novo funciona em viewport 375px de largura sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile
- [ ] Sem ações que dependem exclusivamente de hover
- [ ] Nenhuma migration órfã — geradas com `pnpm db:migrate`
- [ ] Prisma Client regenerado após mudança de schema: `pnpm db:generate`
- [ ] Novas colunas obrigatórias têm DEFAULT definido na migration
- [ ] Sem queries N+1
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código
- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

### TASK-03: criar Server Actions createSessionPayment e updateSessionPayment

- **Status:** todo
- **Dependências:** TASK-02
- **target_path:** projects/agenda-psicologos/src/features/payments/actions/
- **Estimativa:** M

**O que fazer:**

Criar dois arquivos de Server Action em `src/features/payments/actions/`:

**1. `src/features/payments/actions/createSessionPayment.ts`**

```typescript
"use server"

// Recebe: z.infer<typeof SessionPaymentFormSchema> (após validação, amountBRL é number)
// Retorna: PaymentActionResult
//
// Passos obrigatórios (nesta ordem):
//
// 1. Autenticação:
//    const user = await getCurrentUser()
//    if (!user) throw new Error("Não autenticado")
//
// 2. Verificação de plano pro:
//    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } })
//    if (!dbUser || dbUser.plan !== "pro") return { error: "plan_required" }
//    (RN-01, AC-01 — usuário free não registra pagamento)
//
// 3. Validação do input com Zod:
//    const result = SessionPaymentFormSchema.safeParse(input)
//    if (!result.success) return { fieldErrors: result.error.flatten().fieldErrors }
//    const { appointmentId, amountBRL, status, paymentMethod, notes } = result.data
//
// 4. Buscar a consulta validando ownership:
//    const appointment = await prisma.appointment.findFirst({
//      where: { id: appointmentId, userId: user.id, deletedAt: null },
//      select: { id: true, status: true },
//    })
//    if (!appointment) return { error: "not_found" }  — CE-02
//
// 5. Validar status da consulta:
//    if (appointment.status !== "completed") return { error: "invalid_status" }  — CE-03, RN-02
//
// 6. Verificar unicidade (RN-03):
//    const existing = await prisma.sessionPayment.findUnique({ where: { appointmentId } })
//    if (existing) return { error: "not_found" }  — não deve criar duplicata; client redireciona para edição
//
// 7. Converter valor e definir paidAt:
//    const amountCents = Math.round(amountBRL * 100)   — RN-04
//    const paidAt = status === "paid" ? new Date() : null  — RN-05
//
// 8. Criar registro:
//    await prisma.sessionPayment.create({
//      data: {
//        userId: user.id,
//        appointmentId,
//        amountCents,
//        status,
//        paidAt,
//        paymentMethod: paymentMethod ?? null,
//        notes: notes ?? null,
//      },
//    })
//
// 9. Retornar { success: true }
//    Chamar revalidatePath("/financeiro") e revalidatePath(`/appointments/${appointmentId}`)
//    para invalidar o cache do Next.js nas páginas que exibem pagamentos
```

**2. `src/features/payments/actions/updateSessionPayment.ts`**

```typescript
"use server"

// Recebe: z.infer<typeof UpdateSessionPaymentSchema>
// Retorna: PaymentActionResult
//
// Passos obrigatórios (nesta ordem):
//
// 1. Autenticação: getCurrentUser() — lança erro se não autenticado
//
// 2. Verificação de plano pro (igual ao createSessionPayment) — RN-01
//
// 3. Validação do input com UpdateSessionPaymentSchema.safeParse(input)
//    Se inválido: retornar { fieldErrors }
//
// 4. Buscar o registro existente validando ownership:
//    prisma.sessionPayment.findFirst({
//      where: { id: paymentId, userId: user.id },
//      select: { id: true, appointmentId: true },
//    })
//    if (!payment) return { error: "not_found" }
//
// 5. Converter amountBRL para amountCents — Math.round(amountBRL * 100)
//
// 6. Calcular paidAt condicional (RN-05):
//    - Se status === "paid": paidAt = new Date()
//    - Se status === "pending": paidAt = null  (zera o campo — AC-23)
//
// 7. Atualizar:
//    await prisma.sessionPayment.update({
//      where: { id: paymentId },
//      data: { amountCents, status, paidAt, paymentMethod: paymentMethod ?? null, notes: notes ?? null },
//    })
//
// 8. Chamar revalidatePath para as rotas afetadas e retornar { success: true }
```

**Critérios de aceite desta task:**
- [ ] Ambas as actions têm `"use server"` no topo do arquivo
- [ ] Ambas começam com `getCurrentUser()` e lançam erro se não autenticado
- [ ] Ambas verificam `dbUser.plan !== "pro"` e retornam `{ error: "plan_required" }` para plano free — RN-01
- [ ] `createSessionPayment` valida `appointment.status === "completed"` e retorna `{ error: "invalid_status" }` caso contrário — RN-02
- [ ] `createSessionPayment` verifica ownership: `where: { id: appointmentId, userId: user.id }` — AC-27
- [ ] `updateSessionPayment` verifica ownership: `where: { id: paymentId, userId: user.id }` — AC-27
- [ ] `amountCents` é sempre `Math.round(amountBRL * 100)` — RN-04
- [ ] `paidAt = new Date()` quando `status = "paid"`, `paidAt = null` quando `status = "pending"` — RN-05
- [ ] `revalidatePath("/financeiro")` e `revalidatePath("/appointments/[id]")` são chamados após mutação
- [ ] Testes cobrem: plano free (retorna plan_required), consulta não encontrada, consulta com status inválido, criação válida com status paid, criação válida com status pending, atualização de paid para pending (zera paidAt), input inválido
- [ ] `pnpm typecheck` passa sem erros

**DoD checklist:**
- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados
- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco
- [ ] Componente novo funciona em viewport 375px de largura sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile
- [ ] Sem ações que dependem exclusivamente de hover
- [ ] Nenhuma migration órfã — geradas com `pnpm db:migrate`
- [ ] Prisma Client regenerado após mudança de schema: `pnpm db:generate`
- [ ] Novas colunas obrigatórias têm DEFAULT definido na migration
- [ ] Sem queries N+1
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código
- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

### TASK-04: criar formulário de registro/edição de pagamento (PaymentSheet)

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/features/payments/components/
- **Estimativa:** M

**O que fazer:**

Criar o componente de formulário de pagamento usado tanto para registrar quanto para editar.
O formulário é exibido como um sheet lateral (usar `Sheet` do shadcn/ui) ou inline.

**1. `src/features/payments/components/PaymentSheet.tsx`** — Client Component (`"use client"`)

Props:
```typescript
type PaymentSheetProps = {
  open: boolean
  onClose: () => void
  appointmentId: string
  patientName: string
  scheduledAt: Date
  durationMinutes: number
  // Se fornecido, é edição; se ausente, é criação
  existingPayment?: {
    id: string
    amountCents: number
    status: "pending" | "paid"
    paymentMethod: "pix" | "cash" | "card" | "transfer" | null
    notes: string | null
  }
}
```

Comportamento:
- Título: "Registrar pagamento" se criação, "Editar pagamento" se edição
- Contexto (somente leitura): nome do paciente, data/horário formatados (usar `formatCurrency` de `shared/utils/format.ts`)
- Campo **Valor (R$)** — obrigatório:
  - Input `type="text"` com `inputMode="decimal"` para mobile
  - Placeholder "0,00"
  - Se edição: pré-preencher com `(existingPayment.amountCents / 100).toFixed(2).replace(".", ",")`
  - Validação: vazio → "O valor da sessão é obrigatório"; zero/negativo → "O valor deve ser maior que zero"; não numérico → "Informe um valor válido em reais" — AC-17, AC-18, AC-19
- Campo **Forma de pagamento** — opcional:
  - `<Select>` com opções: "PIX", "Dinheiro", "Cartão", "Transferência", "Não informar"
  - "Não informar" corresponde a `null` no banco — RN-06
  - Se edição: pré-selecionar o valor existente
- Campo **Status** — obrigatório:
  - Radio group ou segmented control: "Pendente" / "Pago"
  - Default ao criar: "Pendente"
  - Se edição: pré-selecionar o valor existente
- Campo **Observações** — opcional:
  - Textarea multilinha
  - Se edição: pré-preencher com o valor existente
- Botão **Cancelar**: fecha sheet sem salvar (chama `onClose()`)
- Botão **Salvar**:
  - Ao criar: chama `createSessionPayment(...)` com os valores do formulário
  - Ao editar: chama `updateSessionPayment(...)` com os valores do formulário
  - Desabilitado e com spinner enquanto aguarda resposta — AC-20
  - Após `{ success: true }`: exibe toast de sucesso e chama `onClose()`
    - Criação: toast "Pagamento registrado"
    - Edição: toast "Pagamento atualizado"
  - Após `{ error: "not_found" }`: toast "Consulta não encontrada." + fecha — CE-02
  - Após `{ error: "invalid_status" }`: toast "Pagamento só pode ser registrado para sessões realizadas." + fecha — CE-03
  - Após erro de servidor (catch): toast "Não foi possível salvar o pagamento. Tente novamente." SEM fechar — CE-05
  - `fieldErrors` do schema: exibir inline abaixo de cada campo

Usar `react-hook-form` com `zodResolver(SessionPaymentFormSchema)` para validação client-side.

**Critérios de aceite desta task:**
- [ ] Título muda conforme modo (criação vs edição)
- [ ] Contexto do paciente (nome e data) exibido como somente leitura
- [ ] Campo valor com `inputMode="decimal"` para teclado numérico mobile
- [ ] Formulário de edição pré-preenchido com os valores existentes
- [ ] Default de status é "Pendente" ao criar
- [ ] Botão "Salvar" desabilitado com loading durante submissão — AC-20
- [ ] Toast "Pagamento registrado" exibido após criação bem-sucedida
- [ ] Toast "Pagamento atualizado" exibido após edição bem-sucedida
- [ ] Erros inline com mensagens exatas da spec
- [ ] Erro de servidor não fecha o formulário — CE-05
- [ ] Componente funciona em viewport 375px sem scroll horizontal
- [ ] Targets de toque mínimo 44x44px nos botões e campos interativos

**DoD checklist:**
- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados
- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco
- [ ] Componente novo funciona em viewport 375px de largura sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile
- [ ] Sem ações que dependem exclusivamente de hover
- [ ] Nenhuma migration órfã — geradas com `pnpm db:migrate`
- [ ] Prisma Client regenerado após mudança de schema: `pnpm db:generate`
- [ ] Novas colunas obrigatórias têm DEFAULT definido na migration
- [ ] Sem queries N+1
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código
- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

### TASK-05: integrar seção de pagamento na página de detalhes da consulta

- **Status:** todo
- **Dependências:** TASK-04
- **target_path:** projects/agenda-psicologos/src/app/(auth)/appointments/[id]/
- **Estimativa:** M

**O que fazer:**

Modificar a página de detalhes da consulta em `src/app/(auth)/appointments/[id]/page.tsx`
para incluir a seção de pagamento quando `appointment.status === "completed"`.

A página de detalhes da consulta já existe — foi criada pela feature `agenda-consultas`.
Esta task adiciona a seção de pagamento sem alterar o restante da página.

**Componente de integração `src/features/payments/components/AppointmentPaymentSection.tsx`** — Server Component:

Props:
```typescript
type AppointmentPaymentSectionProps = {
  appointmentId: string
  userId: string
  appointmentStatus: string
  patientName: string
  scheduledAt: Date
  durationMinutes: number
}
```

Comportamento:
- Se `appointmentStatus !== "completed"`: retorna `null` (sem renderizar nada) — AC-13, RN-02
- Se `appointmentStatus === "completed"`:
  - Chamar `getSessionPaymentByAppointment(userId, appointmentId)`
  - Se não existe pagamento (`null`): renderizar estado "sem pagamento" — AC-11
    - Texto "Nenhum pagamento registrado."
    - Botão "Registrar pagamento" que abre `<PaymentSheet>` (via state em wrapper client)
  - Se existe pagamento: renderizar estado "pagamento registrado" — AC-12
    - Badge de status: "Pago" (verde) ou "Pendente" (amarelo)
    - Valor formatado em R$ usando `formatCurrency(amountCents)`
    - Forma de pagamento se preenchida, "-" se null — RN-06
    - Se `paidAt` preenchido: "Recebido em [data formatada dd/MM/yyyy]"
    - Observações se preenchidas
    - Botão "Editar pagamento" que abre `<PaymentSheet>` em modo de edição

Como o `AppointmentPaymentSection` é Server Component mas precisa abrir o `PaymentSheet`
(Client Component), criar também um wrapper:
`src/features/payments/components/AppointmentPaymentSectionClient.tsx` — Client Component
que recebe os dados do pagamento como props e gerencia o estado `open` do Sheet.

**Integração na página:**

Em `src/app/(auth)/appointments/[id]/page.tsx` (arquivo existente da feature `agenda-consultas`):
- Importar e renderizar `<AppointmentPaymentSection>` passando `appointmentId`, `userId`, `appointmentStatus`, `patientName`, `scheduledAt`, `durationMinutes`
- Posicionar a seção após os detalhes principais da consulta, separada por `<hr>` ou card distinto

**Critérios de aceite desta task:**
- [ ] Seção de pagamento não aparece para consultas com `status !== "completed"` — AC-13
- [ ] Estado "sem pagamento" exibe texto "Nenhum pagamento registrado." e botão "Registrar pagamento" — AC-11
- [ ] Estado "pagamento existente" exibe badge de status, valor formatado, forma de pagamento e botão "Editar pagamento" — AC-12
- [ ] Forma de pagamento exibe "-" quando `null`
- [ ] Data de recebimento `paidAt` é exibida quando preenchida
- [ ] `PaymentSheet` abre corretamente no modo criação e no modo edição
- [ ] Após salvar, a seção recarrega com os dados atualizados (via `revalidatePath` da Server Action)
- [ ] Componente funciona em viewport 375px sem scroll horizontal

**DoD checklist:**
- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados
- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco
- [ ] Componente novo funciona em viewport 375px de largura sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile
- [ ] Sem ações que dependem exclusivamente de hover
- [ ] Nenhuma migration órfã — geradas com `pnpm db:migrate`
- [ ] Prisma Client regenerado após mudança de schema: `pnpm db:generate`
- [ ] Novas colunas obrigatórias têm DEFAULT definido na migration
- [ ] Sem queries N+1
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código
- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

### TASK-06: criar página de resumo financeiro (/financeiro)

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/app/(auth)/financeiro/
- **Estimativa:** G

**O que fazer:**

Criar a rota `/financeiro` com duas telas: uma para plano free (upgrade) e outra para plano pro (resumo).

**Nota:** Esta task pode ser desenvolvida em paralelo com TASK-04 e TASK-05, pois opera em arquivos completamente diferentes.

**1. `src/app/(auth)/financeiro/page.tsx`** — Server Component:

```typescript
// 1. Obter usuário: const user = await getCurrentUser()
//    Se não autenticado: o middleware já redireciona para /login — não precisa tratar aqui
//
// 2. Verificar plano:
//    const dbUser = await prisma.user.findUnique({
//      where: { id: user.id },
//      select: { plan: true },
//    })
//
// 3. Se dbUser.plan !== "pro": renderizar <UpgradeGate /> — AC-01, RN-01
//
// 4. Se dbUser.plan === "pro": AC-02
//    - Calcular mês e ano correntes:
//      const now = new Date()
//      const year = now.getFullYear()
//      const month = now.getMonth() + 1
//    - Chamar getFinancialSummary(user.id, year, month)
//    - Renderizar <FinancialDashboard summary={summary} userId={user.id} initialYear={year} initialMonth={month} />
```

**2. `src/features/payments/components/UpgradeGate.tsx`** — Server Component (sem estado):

Wireframe: Tela 1 da spec (tela de upgrade).
- Ícone de cadeado (usar ícone do `lucide-react`)
- Título "Controle financeiro disponível no plano Pro"
- Subtítulo "Saiba exatamente quanto você faturou, quais sessões estão pagas e quais ainda estão pendentes."
- Botão CTA primário "Assinar plano pro — R$ 39/mês" que navega para `/settings` (ou `/billing` se já existir)
- Link secundário "Já assinou? Verifique sua assinatura" que navega para `/settings`
- Centralizado verticalmente na tela — AC-01

**3. `src/features/payments/components/FinancialDashboard.tsx`** — Client Component (`"use client"`):

Props:
```typescript
type FinancialDashboardProps = {
  summary: FinancialSummary
  userId: string
  initialYear: number
  initialMonth: number
}
```

Estado local (RN-08 — sem alterar URL):
```typescript
const [year, setYear] = useState(initialYear)
const [month, setMonth] = useState(initialMonth)
const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all")
const [payments, setPayments] = useState<SessionPaymentWithContext[]>([])
const [summary, setSummary] = useState<FinancialSummary>(initialSummary)
const [loading, setLoading] = useState(false)
```

Ao mudar `year` ou `month`: buscar novos dados chamando uma Server Action auxiliar
`getFinancialDataForPeriod(userId, year, month, statusFilter)` — AC-04, RN-08.

Criar `src/features/payments/actions/getFinancialDataForPeriod.ts` como Server Action
(não é mutação, mas usar Server Action para evitar API route separada):
```typescript
"use server"
// Retorna { summary: FinancialSummary, payments: SessionPaymentWithContext[] }
// Verifica autenticação e plano pro antes de retornar dados
```

**Elementos da UI (conforme wireframe Tela 2):**

a) Seletor de período:
   - Botão `<` (mês anterior) e `>` (mês próximo) com texto "Mês Ano" no centro
   - Não navegar para meses futuros além do mês atual
   - Formato: "Abril 2026"
   - Targets de toque mínimo 44x44px

b) Três cards de resumo em linha (ou grade 3 colunas em mobile):
   - "Recebido" — `formatCurrency(summary.totalPaidCents)`
   - "Pendente" — `formatCurrency(summary.totalPendingCents)`
   - "Sessões" — `summary.sessionCount` (número inteiro)

c) Filtro de status — segmented control / tab buttons:
   - "Todas" (default), "Pagas", "Pendentes"
   - Ao mudar: filtrar a lista sem recarregar o resumo de totais
   - AC-07, AC-08, AC-09

d) Lista de sessões com pagamento:
   - Cada item exibe: nome do paciente, data da sessão formatada (ex: "24 abr · 09:00"), valor em R$, forma de pagamento (ou "-"), badge de status
   - Item clicável: navega para `/appointments/[appointment_id]` — AC-10
   - Estado vazio: "Nenhuma sessão com pagamento registrado neste período." — AC-05

**Critérios de aceite desta task:**
- [ ] `/financeiro` com plano free renderiza `<UpgradeGate>` sem expor dados financeiros — AC-01
- [ ] `/financeiro` com plano pro renderiza resumo do mês atual por padrão — AC-02, RN-08
- [ ] Cards de resumo exibem totais corretos formatados em R$ — AC-03
- [ ] Navegação por setas muda o período e recarrega os dados sem page reload — AC-04
- [ ] Estado vazio exibe totais zerados e mensagem "Nenhuma sessão com pagamento registrado neste período." — AC-05
- [ ] Cada item da listagem exibe nome do paciente, data/hora, valor, forma de pagamento e badge de status — AC-06
- [ ] Filtro "Pendentes" exibe só registros com `status = pending` — AC-07
- [ ] Filtro "Pagas" exibe só registros com `status = paid` — AC-08
- [ ] Filtro "Todas" exibe todos — AC-09
- [ ] Clicar em item navega para `/appointments/[id]` — AC-10
- [ ] UpgradeGate exibe botão "Assinar plano pro" — AC-01
- [ ] Navegação de período não avança para meses futuros além do atual
- [ ] Página funciona em viewport 375px sem scroll horizontal

**DoD checklist:**
- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados
- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco
- [ ] Componente novo funciona em viewport 375px de largura sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile
- [ ] Sem ações que dependem exclusivamente de hover
- [ ] Nenhuma migration órfã — geradas com `pnpm db:migrate`
- [ ] Prisma Client regenerado após mudança de schema: `pnpm db:generate`
- [ ] Novas colunas obrigatórias têm DEFAULT definido na migration
- [ ] Sem queries N+1
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código
- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

### TASK-07: testes de integração do fluxo financeiro

- **Status:** todo
- **Dependências:** TASK-05, TASK-06
- **target_path:** projects/agenda-psicologos/src/features/payments/
- **Estimativa:** M

**O que fazer:**

Criar testes de integração cobrindo os fluxos críticos da feature. Usar Vitest
com mocks do Prisma (via `vitest-mock-extended` ou mock manual) e mock de `getCurrentUser`.

**Arquivo `src/features/payments/__tests__/createSessionPayment.test.ts`:**

Cobrir os seguintes cenários:
- Criação bem-sucedida com `status = paid`: verifica que `paidAt = now()` e `amountCents = Math.round(amountBRL * 100)`
- Criação bem-sucedida com `status = pending`: verifica que `paidAt = null`
- Usuário com plano `free`: retorna `{ error: "plan_required" }`
- Consulta não encontrada ou de outro usuário: retorna `{ error: "not_found" }`
- Consulta com `status !== "completed"`: retorna `{ error: "invalid_status" }`
- Input com `amountBRL` vazio: retorna `{ fieldErrors: { amountBRL: ["O valor da sessão é obrigatório"] } }`
- Input com `amountBRL` zero: retorna `{ fieldErrors: { amountBRL: ["O valor deve ser maior que zero"] } }`
- Usuário não autenticado: lança exceção "Não autenticado"

**Arquivo `src/features/payments/__tests__/updateSessionPayment.test.ts`:**

Cobrir os seguintes cenários:
- Atualização válida: `amountCents` calculado corretamente
- Mudança de `pending` para `paid`: `paidAt` é preenchido com data atual
- Mudança de `paid` para `pending`: `paidAt` é zerado para `null`
- Registro não encontrado ou de outro usuário: retorna `{ error: "not_found" }`
- Usuário com plano `free`: retorna `{ error: "plan_required" }`

**Arquivo `src/features/payments/__tests__/getFinancialSummary.test.ts`:**

Cobrir os seguintes cenários:
- Período sem registros: retorna todos os campos zerados
- Período com mix de `paid` e `pending`: totais calculados corretamente
- Registros de outro usuário não são incluídos (mock retorna array vazio para `userId` diferente)
- Cálculo do intervalo de mês: primeiro e último dia incluídos

**Critérios de aceite desta task:**
- [ ] Todos os cenários de erro listados acima têm teste correspondente
- [ ] `pnpm test` passa sem falha
- [ ] `pnpm test:coverage` não regride em relação à task anterior
- [ ] Testes não fazem chamadas reais ao banco (Prisma mockado)
- [ ] Testes não dependem de ordem de execução (sem estado compartilhado entre testes)

**DoD checklist:**
- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção
- [ ] Nenhum `TODO` ou `FIXME` no código entregue
- [ ] Componentes React não têm lógica de negócio
- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados
- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco
- [ ] Componente novo funciona em viewport 375px de largura sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile
- [ ] Sem ações que dependem exclusivamente de hover
- [ ] Nenhuma migration órfã — geradas com `pnpm db:migrate`
- [ ] Prisma Client regenerado após mudança de schema: `pnpm db:generate`
- [ ] Novas colunas obrigatórias têm DEFAULT definido na migration
- [ ] Sem queries N+1
- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código
- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

## Diagrama de execução

```
TASK-01 — tipos/schema (base de tudo)
  └── TASK-02 — queries (depende dos tipos)
        └── TASK-03 — Server Actions (depende das queries)
              ├── TASK-04 — PaymentSheet/formulário    ← paralelo entre si
              │     └── TASK-05 — seção na consulta    │ (TASK-04 e TASK-06 operam
              │                                         │  em arquivos diferentes)
              └── TASK-06 — página /financeiro         ←
                    └── (ambas convergem em)
                          └── TASK-07 — testes de integração (após TASK-05 e TASK-06)
```

**Paralelismo disponível:**
- TASK-04 e TASK-06 podem rodar em paralelo após TASK-03 concluída:
  - TASK-04 opera em `src/features/payments/components/PaymentSheet.tsx`
  - TASK-06 opera em `src/app/(auth)/financeiro/page.tsx` + `FinancialDashboard.tsx` + `UpgradeGate.tsx`
  - Arquivos completamente diferentes, sem dependência entre si

**Ordem crítica:**
- TASK-01 → TASK-02 → TASK-03 (dependência em cadeia obrigatória)
- TASK-04 depende de TASK-03 (chama as Server Actions do formulário)
- TASK-05 depende de TASK-04 (usa `PaymentSheet` como sub-componente)
- TASK-06 depende de TASK-03 (usa as queries e Server Actions de dados)
- TASK-07 depende de TASK-05 e TASK-06 (testa o fluxo completo)
```
