# Tasks — agenda-consultas

**Feature:** Agenda de Consultas
**Slug:** `agenda-consultas`
**Criado em:** 2026-04-28
**Status:** aguardando aprovação

---

## Resumo

9 tasks cobrindo as camadas: tipos/schemas, queries, Server Actions, componentes UI
e página de testes de integração. A feature depende de `autenticacao` (para
`getCurrentUser`) e de `cadastro-pacientes` (para vincular consulta a paciente ativo).

---

## Pré-requisitos externos

- `autenticacao` tasks devem estar `done: true` — especificamente TASK-01 e TASK-03
  (NextAuth configurado e `getCurrentUser` disponível)
- `cadastro-pacientes` deve estar implementado — consulta exige ao menos um paciente
  ativo cadastrado (`is_active = true`, `deleted_at IS NULL`)

---

## Tasks

### TASK-01: criar tipos TypeScript e schemas Zod da feature appointments

- **Status:** todo
- **Dependências:** nenhuma (não depende de código gerado por outras tasks desta feature)
- **target_path:** projects/agenda-psicologos/src/features/appointments/
- **Estimativa:** P

**O que fazer:**

Criar dois arquivos na pasta `src/features/appointments/`:

**1. `src/features/appointments/types.ts`**

Definir os tipos TypeScript específicos da feature:

```typescript
// Tipo base de consulta retornado pelas queries — inclui relação com paciente
export type AppointmentWithPatient = {
  id: string
  userId: string
  patientId: string
  scheduledAt: Date
  durationMinutes: number
  modality: "in_person" | "online"
  location: string | null
  status: AppointmentStatus
  cancellationReason: string | null
  createdAt: Date
  updatedAt: Date
  patient: {
    id: string
    name: string
    phone: string
  }
  // hasNote é calculado nas queries que precisam exibir link de prontuário
  hasNote?: boolean
}

// Status válidos — valores do campo `status` na tabela `appointments`
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

// Modalidades válidas — valores do campo `modality`
export type AppointmentModality = "in_person" | "online"

// Tipo de retorno de Server Action com possível erro de conflito de horário
export type ConflictError = {
  type: "conflict"
  message: string // ex: "Horário conflita com a consulta de Ana Beatriz às 09:00"
}

export type AppointmentActionResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string | ConflictError }

// Tipo para o formulário de criação/edição — campos de data separados para facilitar
// o controle do formulário React (data e hora são inputs separados no wireframe)
export type AppointmentFormData = {
  patientId: string
  scheduledAt: Date
  durationMinutes: number
  modality: AppointmentModality
  location?: string | null
}
```

**2. `src/features/appointments/schema.ts`**

Criar os schemas Zod conforme especificados na spec:

```typescript
import { z } from "zod"

export const AppointmentFormSchema = z.object({
  patientId: z.string().uuid("Selecione um paciente"),
  scheduledAt: z.coerce.date({
    required_error: "Data e horário são obrigatórios",
  }),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duração deve ser de pelo menos 1 minuto")
    .default(50),
  modality: z.enum(["in_person", "online"], {
    required_error: "Selecione a modalidade",
  }),
  location: z.string().max(500).optional().nullable(),
})

export const CancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  cancellationReason: z.string().max(1000).optional().nullable(),
})

export const UpdateStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["completed", "no_show"]),
  // Nota: "cancelled" é tratado por CancelAppointmentSchema separado
  // pois permite informar motivo. "confirmed" só pode ser feito pelo paciente.
})
```

**Critérios de aceite desta task:**
- [ ] `src/features/appointments/types.ts` exporta todos os tipos listados acima
- [ ] `src/features/appointments/schema.ts` exporta `AppointmentFormSchema`, `CancelAppointmentSchema` e `UpdateStatusSchema`
- [ ] `AppointmentFormSchema` retorna mensagem "Selecione um paciente" para `patientId` inválido
- [ ] `AppointmentFormSchema` retorna mensagem "Duração deve ser de pelo menos 1 minuto" para `durationMinutes` = 0
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

### TASK-02: criar queries de leitura de consultas

- **Status:** todo
- **Dependências:** TASK-01
- **target_path:** projects/agenda-psicologos/src/features/appointments/queries/
- **Estimativa:** M

**O que fazer:**

Criar os seguintes arquivos em `src/features/appointments/queries/`. Todas as
queries usam o singleton `shared/lib/prisma.ts` e filtram obrigatoriamente por
`userId`. Nenhuma query autentica — a autenticação é feita nas Server Actions e
Server Components que as chamam (as queries recebem `userId` como parâmetro explícito).

**1. `src/features/appointments/queries/getWeekAppointments.ts`**

```typescript
// Retorna todas as consultas de uma semana para um psicólogo
// Parâmetros: userId: string, weekStart: Date (início da semana — segunda-feira 00:00:00)
// WHERE: userId, scheduledAt >= weekStart, scheduledAt < weekStart + 7 dias,
//        deletedAt IS NULL (NULL — não filtra canceladas, apenas removidas administrativamente)
// ORDER BY: scheduledAt ASC
// INCLUDE: patient (id, name, phone)
// Retorna: AppointmentWithPatient[]
```

**2. `src/features/appointments/queries/getDayAppointments.ts`**

```typescript
// Retorna todas as consultas de um dia específico
// Parâmetros: userId: string, date: Date (dia, hora ignorada — range é 00:00:00–23:59:59)
// WHERE: userId, scheduledAt >= início do dia, scheduledAt <= fim do dia,
//        deletedAt IS NULL
// ORDER BY: scheduledAt ASC
// INCLUDE: patient (id, name, phone)
// Retorna: AppointmentWithPatient[]
```

**3. `src/features/appointments/queries/getAppointmentById.ts`**

```typescript
// Busca uma consulta pelo id validando pertencimento ao psicólogo
// Parâmetros: userId: string, appointmentId: string
// WHERE: id = appointmentId AND userId (segurança: 404 se pertencer a outro psicólogo)
// INCLUDE: patient (id, name, phone), sessionNote (apenas id — para verificar se tem prontuário)
// Retorna: AppointmentWithPatient & { hasNote: boolean } | null
// Se retornar null: o componente exibe 404 (não expõe que pertence a outro psicólogo — AC-35)
```

**4. `src/features/appointments/queries/getPatientAppointments.ts`**

```typescript
// Retorna todas as consultas de um paciente específico
// Parâmetros: userId: string, patientId: string
// WHERE: userId, patientId, deletedAt IS NULL
// ORDER BY: scheduledAt DESC (histórico em ordem decrescente — AC-31)
// INCLUDE: patient (id, name, phone)
// Retorna: AppointmentWithPatient[]
```

**5. `src/features/appointments/queries/getConflictingAppointments.ts`**

```typescript
// Verifica se existe conflito de horário para um intervalo dado
// Parâmetros:
//   userId: string
//   scheduledAt: Date         — início do novo intervalo
//   durationMinutes: number   — duração em minutos
//   excludeId?: string        — ID da consulta a excluir da verificação (ao editar)
// Lógica de sobreposição (RN-02):
//   novoFim = scheduledAt + durationMinutes minutos
//   WHERE userId,
//         status NOT IN ('cancelled'),
//         deletedAt IS NULL,
//         scheduledAt < novoFim,                   ← início da existente é antes do fim do novo
//         addMinutes(scheduledAt, durationMinutes) > scheduledAt_do_novo  ← fim da existente é depois do início do novo
//         id != excludeId (se fornecido)
// INCLUDE: patient (id, name)
// Retorna: AppointmentWithPatient[]  (vazio = sem conflito)
//
// NOTA: O cálculo de `fim da existente` não pode usar SQL direto com Prisma para
// operações aritméticas em datas. Usar rawQuery ou calcular no JS após buscar candidatos:
// Buscar todas as consultas do dia com status != cancelled e filtrar em JS:
//   existente.scheduledAt < novoFim && addMinutes(existente.scheduledAt, existente.durationMinutes) > scheduledAt
```

**Critérios de aceite desta task:**
- [ ] `getWeekAppointments` retorna apenas consultas com `deletedAt IS NULL` dentro do intervalo da semana
- [ ] `getDayAppointments` retorna consultas do dia inteiro (00:00 a 23:59:59) ordenadas por horário
- [ ] `getAppointmentById` retorna `null` quando a consulta pertence a outro `userId`
- [ ] `getAppointmentById` inclui campo `hasNote: boolean` calculado a partir de `sessionNote`
- [ ] `getPatientAppointments` retorna em ordem decrescente por `scheduledAt`
- [ ] `getConflictingAppointments` retorna consulta existente quando há sobreposição de horário
- [ ] `getConflictingAppointments` exclui consultas com `status = 'cancelled'` da verificação
- [ ] `getConflictingAppointments` exclui a própria consulta quando `excludeId` é fornecido
- [ ] Todas as queries filtram por `userId` obrigatoriamente
- [ ] Testes unitários para `getConflictingAppointments` (com conflito, sem conflito, com excludeId, com cancelled ignorada)
- [ ] Testes unitários para `getAppointmentById` (encontrada, não encontrada, userId diferente)
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

### TASK-03: criar Server Actions de criação e edição de consulta

- **Status:** todo
- **Dependências:** TASK-02, autenticacao/TASK-03
- **target_path:** projects/agenda-psicologos/src/features/appointments/actions/
- **Estimativa:** M

**O que fazer:**

Criar dois arquivos de Server Action para criar e editar consultas.

**1. `src/features/appointments/actions/createAppointment.ts`**

```typescript
"use server"
// Recebe: input compatível com AppointmentFormSchema
// 1. Chama getCurrentUser() — lança erro se não autenticado
// 2. Valida input com AppointmentFormSchema (Zod)
// 3. Verifica que o paciente existe, está ativo (is_active = true, deletedAt IS NULL)
//    e pertence ao userId do psicólogo autenticado (RN-07):
//    prisma.patient.findFirst({ where: { id: patientId, userId, isActive: true, deletedAt: null } })
//    — se não encontrado: lança erro "Paciente não encontrado ou inativo"
// 4. Verifica conflitos de horário com getConflictingAppointments(userId, scheduledAt, durationMinutes)
//    — se houver conflito: retorna {
//        success: false,
//        error: { type: "conflict", message: "Horário conflita com a consulta de [nome] às [HH:MM]" }
//      }
//    — formatar hora do conflito como HH:MM em pt-BR
// 5. Cria consulta: prisma.appointment.create({
//      data: { userId, patientId, scheduledAt, durationMinutes, modality, location, status: "scheduled" }
//    })
// 6. Retorna { success: true, appointmentId: appointment.id }
```

**2. `src/features/appointments/actions/updateAppointment.ts`**

```typescript
"use server"
// Recebe: { appointmentId: string } + campos de AppointmentFormSchema (todos opcionais exceto appointmentId)
// 1. Chama getCurrentUser() — lança erro se não autenticado
// 2. Valida appointmentId como UUID
// 3. Busca a consulta: getAppointmentById(userId, appointmentId)
//    — se null: lança Error("Consulta não encontrada")
// 4. Verifica se status permite edição (RN-04):
//    status NOT IN ('completed', 'cancelled', 'no_show')
//    — se terminal: retorna { success: false, error: "Consultas finalizadas não podem ser editadas." }
// 5. Valida os campos do update com AppointmentFormSchema
// 6. Se scheduledAt ou durationMinutes foram alterados: verifica conflitos com
//    getConflictingAppointments(userId, novoScheduledAt, novoDurationMinutes, excludeId: appointmentId)
//    — se conflito: retorna { success: false, error: { type: "conflict", message: "..." } }
// 7. Atualiza: prisma.appointment.update({
//      where: { id: appointmentId, userId },
//      data: { patientId, scheduledAt, durationMinutes, modality, location }
//    })  — updatedAt é atualizado automaticamente pelo Prisma (@updatedAt)
// 8. Retorna { success: true, appointmentId }
```

**Critérios de aceite desta task:**
- [ ] `createAppointment` começa com `getCurrentUser()` — lança erro se não autenticado
- [ ] `createAppointment` valida que o paciente pertence ao psicólogo autenticado antes de criar
- [ ] `createAppointment` detecta e retorna conflito de horário com mensagem "Horário conflita com a consulta de [nome] às [HH:MM]"
- [ ] `createAppointment` cria consulta com `status = "scheduled"`
- [ ] `updateAppointment` bloqueia edição de consultas com status terminal (completed, cancelled, no_show)
- [ ] `updateAppointment` valida conflito excluindo a própria consulta do check (`excludeId`)
- [ ] Testes unitários: criar com paciente inativo (erro), criar com conflito (retorna conflict), criar válido, editar terminal (erro), editar com novo conflito
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

### TASK-04: criar Server Actions de cancelamento e mudança de status

- **Status:** todo
- **Dependências:** TASK-02, autenticacao/TASK-03
- **target_path:** projects/agenda-psicologos/src/features/appointments/actions/
- **Estimativa:** M

**O que fazer:**

Criar três arquivos de Server Action para cancelar e atualizar status de consulta.
Estas actions podem ser desenvolvidas em paralelo com TASK-03 pois operam nos mesmos
dados mas em arquivos completamente diferentes (sem conflito de merge).

**1. `src/features/appointments/actions/cancelAppointment.ts`**

```typescript
"use server"
// Recebe: CancelAppointmentSchema { appointmentId, cancellationReason? }
// 1. Chama getCurrentUser()
// 2. Valida input com CancelAppointmentSchema
// 3. Busca consulta: getAppointmentById(userId, appointmentId)
//    — se null: lança Error("Consulta não encontrada")
// 4. Verifica se o status permite cancelamento (AC-26, RN-04):
//    status NOT IN ('completed', 'cancelled', 'no_show')
//    — se terminal: lança Error("Esta consulta não pode ser cancelada.")
// 5. Atualiza:
//    prisma.appointment.update({
//      where: { id: appointmentId, userId },
//      data: { status: "cancelled", cancellationReason: cancellationReason ?? null }
//    })
// 6. Retorna { success: true }
// Nota (RN-08): deletedAt NÃO é preenchido — consulta cancelada permanece visível com badge "cancelada"
```

**2. `src/features/appointments/actions/completeAppointment.ts`**

```typescript
"use server"
// Recebe: { appointmentId: string }
// 1. Chama getCurrentUser()
// 2. Valida appointmentId como UUID: z.string().uuid()
// 3. Busca consulta: getAppointmentById(userId, appointmentId)
//    — se null: lança Error("Consulta não encontrada")
// 4. Verifica transição válida (RN-03): status deve ser 'scheduled' ou 'confirmed'
//    — se inválido: lança Error("Não é possível marcar esta consulta como realizada.")
// 5. Atualiza: prisma.appointment.update({ where: { id, userId }, data: { status: "completed" } })
// 6. Retorna { success: true }
```

**3. `src/features/appointments/actions/markNoShow.ts`**

```typescript
"use server"
// Recebe: { appointmentId: string }
// 1. Chama getCurrentUser()
// 2. Valida appointmentId como UUID
// 3. Busca consulta: getAppointmentById(userId, appointmentId)
//    — se null: lança Error("Consulta não encontrada")
// 4. Verifica transição válida (RN-03): status deve ser 'scheduled' ou 'confirmed'
//    — se inválido: lança Error("Não é possível registrar falta nesta consulta.")
// 5. Atualiza: prisma.appointment.update({ where: { id, userId }, data: { status: "no_show" } })
// 6. Retorna { success: true }
```

**Critérios de aceite desta task:**
- [ ] `cancelAppointment` começa com `getCurrentUser()`
- [ ] `cancelAppointment` bloqueia cancelamento de status terminal (completed, cancelled, no_show)
- [ ] `cancelAppointment` salva `cancellationReason` como `null` quando não informado (RN-05)
- [ ] `cancelAppointment` NÃO preenche `deletedAt` (RN-08 — consulta permanece visível com badge)
- [ ] `completeAppointment` permite transição apenas de `scheduled` ou `confirmed` para `completed`
- [ ] `markNoShow` permite transição apenas de `scheduled` ou `confirmed` para `no_show`
- [ ] Testes unitários: cancelar válido, cancelar terminal (erro), cancelar com motivo, cancelar sem motivo, completar válido, completar terminal (erro), no-show válido, no-show de cancelled (erro)
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

### TASK-05: criar visualização semanal da agenda (/appointments)

- **Status:** todo
- **Dependências:** TASK-02, TASK-03, TASK-04
- **target_path:** projects/agenda-psicologos/src/app/(auth)/appointments/
- **Estimativa:** G

**O que fazer:**

Criar a página de visualização semanal e seus componentes de UI conforme wireframe
(Tela 1 da spec). Esta é a rota principal da agenda: `/appointments`.

**Arquivos a criar:**

**1. `src/app/(auth)/appointments/page.tsx`** — Server Component

- Lê parâmetros de busca da URL: `searchParams.week` (YYYY-MM-DD) e `searchParams.patient`
- Chama `getCurrentUser()` para obter o `userId`
- Se `searchParams.patient` presente: chama `getPatientAppointments(userId, patientId)` e
  renderiza lista cronológica decrescente em vez da grade semanal
- Caso contrário: calcula `weekStart` (segunda-feira da semana atual, ou semana passada
  pelo parâmetro `?week=`) e chama `getWeekAppointments(userId, weekStart)`
- Renderiza `<WeeklyCalendar appointments={appointments} weekStart={weekStart} />`

**2. `src/features/appointments/components/WeeklyCalendar.tsx`** — Client Component

- Recebe `appointments: AppointmentWithPatient[]` e `weekStart: Date`
- Renderiza a grade semanal com 7 colunas (segunda a domingo)
- Header da semana: botão "Semana anterior" (navega para `?week=[semana-anterior]`),
  intervalo de datas (ex: "21–27 abr 2026"), botão "Próxima semana" (`?week=[prox]`),
  botão "Hoje" (`router.push('/appointments')` sem parâmetro)
- Destaca a coluna do dia atual com fundo diferenciado (AC-05)
- Cada coluna exibe as consultas do dia ordenadas por horário de início
- Clicar num dia navega para `/appointments/day/[YYYY-MM-DD]` (AC-06)
- Clicar numa consulta abre o `<AppointmentDetailPanel>` (modal/sheet lateral)
- Botão "Nova Consulta" fixo no topo direito navega para `/appointments/new`

**3. `src/features/appointments/components/AppointmentCard.tsx`** — Server/Client Component

- Renderiza um item de consulta na grade semanal
- Exibe: horário de início (HH:MM), nome abreviado do paciente, `<StatusBadge status={...} />`
- Target de toque mínimo 44x44px
- Ao clicar: `onClick` dispara abertura do painel de detalhes

**4. `src/features/appointments/components/StatusBadge.tsx`** — componente puro

- Recebe `status: AppointmentStatus`
- Renderiza badge colorido conforme mapeamento da spec:
  - `scheduled` → cinza
  - `confirmed` → azul
  - `completed` → verde
  - `cancelled` → vermelho com texto riscado (line-through)
  - `no_show` → laranja
- Textos em português: "agendada", "confirmada", "realizada", "cancelada", "falta"

**5. Estado vazio (dentro de `WeeklyCalendar`):**

- Quando `appointments` é vazio para a semana visualizada: exibir mensagem
  "Nenhuma consulta nesta semana." e botão "Agendar consulta" que navega para
  `/appointments/new` (AC-03)

**Critérios de aceite desta task:**
- [ ] Rota `/appointments` carrega sem erro e exibe grade semanal da semana atual
- [ ] Semana atual tem coluna do dia atual com fundo diferenciado (AC-05)
- [ ] Navegação entre semanas atualiza o parâmetro `?week=` na URL e recarrega as consultas
- [ ] Botão "Hoje" retorna para `/appointments` sem parâmetro e mostra semana atual
- [ ] Clicar em um dia navega para `/appointments/day/[data]` (AC-06)
- [ ] Estado vazio exibe mensagem e CTA "Agendar consulta" (AC-03)
- [ ] `StatusBadge` exibe cor e texto correto para cada status
- [ ] Rota `/appointments?patient=[id]` exibe lista de consultas do paciente em ordem decrescente (AC-31)
- [ ] Grid funciona em viewport 375px sem scroll horizontal (pode usar scroll horizontal apenas no calendário se necessário com indicação visual)
- [ ] Botão "Nova Consulta" tem target mínimo 44x44px

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

### TASK-06: criar visualização diária (/appointments/day/[date])

- **Status:** todo
- **Dependências:** TASK-02, TASK-03, TASK-04
- **target_path:** projects/agenda-psicologos/src/app/(auth)/appointments/day/[date]/
- **Estimativa:** M

**O que fazer:**

Criar a página de visualização diária conforme wireframe (Tela 2 da spec).
Esta task pode correr em paralelo com TASK-05 — opera em arquivos completamente
diferentes (nova rota, novos componentes).

**Arquivos a criar:**

**1. `src/app/(auth)/appointments/day/[date]/page.tsx`** — Server Component

- Recebe `params.date` como string no formato `YYYY-MM-DD`
- Valida o formato da data; se inválido: redireciona para `/appointments`
- Chama `getCurrentUser()` para obter `userId`
- Chama `getDayAppointments(userId, parsedDate)`
- Renderiza `<DayView appointments={appointments} date={parsedDate} />`

**2. `src/features/appointments/components/DayView.tsx`** — Client Component

- Recebe `appointments: AppointmentWithPatient[]` e `date: Date`
- Header: botão "Dia anterior" (navega para `day/[data-anterior]`), data por extenso
  em pt-BR (ex: "Quinta-feira, 24 abr 2026"), botão "Próximo dia" (navega para `day/[data-seguinte]`)
- Lista as consultas em ordem cronológica
- Cada item exibe (AC-07): horário de início e término calculado (`scheduledAt + durationMinutes`),
  nome completo do paciente, modalidade ("Presencial" ou "Online"), location/link (se preenchido),
  badge de status (`<StatusBadge />`), botão "Ver detalhes" que abre `<AppointmentDetailPanel>`
- Nota: horário de término é calculado no componente como `scheduledAt + durationMinutes` (RN-10)
- Rodapé: botão "Agendar neste dia" navega para `/appointments/new?date=[YYYY-MM-DD]`
- Estado vazio: "Nenhuma consulta nesta data." e botão "Agendar consulta para este dia" (AC-08)

**3. `src/features/appointments/components/AppointmentDetailPanel.tsx`** — Client Component

- Modal ou sheet lateral (usar `Sheet` do shadcn/ui) exibido sobre a tela atual
- Recebe `appointment: AppointmentWithPatient & { hasNote: boolean }` como prop
- Exibe (AC-07, Tela 3 da spec):
  - Nome do paciente como link para `/patients/[id]`
  - Data e horário de início e término
  - Modalidade e local/link
  - Badge de status atual (`<StatusBadge />`)
- Seção de ações renderizadas conforme status atual (RN-03, RN-04):
  - Se `scheduled` ou `confirmed`: exibe botões "Marcar como realizada", "Marcar como no-show",
    "Editar consulta" (navega para `/appointments/[id]/edit`), "Cancelar consulta"
  - Se `completed`: exibe link "Ver prontuário" (navega para `/appointments/[id]/notes`) ou
    "Registrar prontuário" se `!hasNote` (AC-29). Sem botões de edição/cancelamento.
  - Se `cancelled` ou `no_show`: exibe apenas o status — sem ações disponíveis (AC-26, AC-30)
- "Marcar como realizada" chama `completeAppointment({ appointmentId })` e exibe toast "Consulta marcada como realizada" (AC-27)
- "Marcar como no-show" chama `markNoShow({ appointmentId })` e exibe toast "Falta registrada" (AC-28)
- "Cancelar consulta" abre `<CancelDialog>` (componente desta task)
- Botão fechar (x) fecha o painel (AC-10)

**4. `src/features/appointments/components/CancelDialog.tsx`** — Client Component

- Dialog modal (usar `Dialog` do shadcn/ui) sobre o painel de detalhes
- Exibe nome do paciente e data/hora da consulta para contexto (Tela 5 da spec)
- Campo textarea livre para motivo (opcional — AC-25)
- Botão "Voltar" fecha o dialog sem alterar
- Botão "Confirmar cancelamento" chama `cancelAppointment({ appointmentId, cancellationReason })` e exibe toast "Consulta cancelada" (AC-24)

**Critérios de aceite desta task:**
- [ ] Rota `/appointments/day/[data]` carrega e exibe consultas do dia ordenadas por horário (AC-07)
- [ ] Horário de término exibido corretamente como `scheduledAt + durationMinutes` (RN-10)
- [ ] Navegação entre dias funciona (AC-09)
- [ ] Estado vazio exibe mensagem e CTA correto (AC-08)
- [ ] `AppointmentDetailPanel` exibe ações corretas conforme status da consulta (RN-03)
- [ ] Consulta `completed` exibe "Registrar prontuário" ou "Ver prontuário" conforme `hasNote` (AC-29)
- [ ] `CancelDialog` chama `cancelAppointment` e exibe toast "Consulta cancelada"
- [ ] `completeAppointment` e `markNoShow` exibem toasts corretos após sucesso
- [ ] Painel e dialog funcionam em viewport 375px
- [ ] Botões de ação têm target mínimo 44x44px

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

### TASK-07: criar formulário de criação e edição de consulta

- **Status:** todo
- **Dependências:** TASK-03, TASK-04
- **target_path:** projects/agenda-psicologos/src/app/(auth)/appointments/
- **Estimativa:** G

**O que fazer:**

Criar as páginas e o formulário de criação/edição de consulta conforme wireframe
(Tela 4 da spec). Esta task pode correr em paralelo com TASK-05 e TASK-06 pois
opera em rotas diferentes.

**Arquivos a criar:**

**1. `src/app/(auth)/appointments/new/page.tsx`** — Server Component

- Lê `searchParams.date` (YYYY-MM-DD) — opcional, pré-preenche a data no formulário
- Chama `getCurrentUser()`
- Busca pacientes ativos do psicólogo: `prisma.patient.findMany({ where: { userId, isActive: true, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } })`
- Renderiza `<AppointmentForm patients={patients} defaultDate={date} />`

**2. `src/app/(auth)/appointments/[id]/edit/page.tsx`** — Server Component

- Recebe `params.id`
- Chama `getCurrentUser()`
- Chama `getAppointmentById(userId, id)` — se null: exibe 404
- Se status é terminal (completed, cancelled, no_show): exibe mensagem
  "Consultas finalizadas não podem ser editadas." sem renderizar o formulário (AC-22)
- Busca pacientes ativos do psicólogo (igual à página de criação)
- Renderiza `<AppointmentForm patients={patients} appointment={appointment} />` (modo edição)

**3. `src/features/appointments/components/AppointmentForm.tsx`** — Client Component

- Props: `patients: { id: string; name: string }[]`, `appointment?: AppointmentWithPatient`,
  `defaultDate?: string`
- Modo criação (sem `appointment`): título "Nova Consulta", campos em branco exceto
  `durationMinutes` que padrão 50 e `defaultDate` se fornecido
- Modo edição (com `appointment`): título "Editar Consulta", campos pré-preenchidos
- Campos (Tela 4 da spec):
  - **Paciente**: dropdown com busca por nome usando `<Combobox>` do shadcn/ui — lista apenas
    pacientes passados como prop (todos ativos). Obrigatório. Erro: "Selecione um paciente" (AC-12)
  - **Data**: input `type="date"` com máscara visual DD/MM/AAAA. Obrigatório. Erro: "Data é obrigatória" (AC-13)
  - **Horário**: input `type="time"` formato 24h. Obrigatório. Erro: "Horário é obrigatório" (AC-14)
  - **Duração**: input numérico (`type="number"`, mínimo 1) com sufixo "minutos". Padrão 50. Erro: "Duração deve ser de pelo menos 1 minuto" (AC-18)
  - **Modalidade**: dois radio buttons — "Presencial" e "Online"
  - **Local / Link**: input texto livre, opcional, placeholder "Endereço (presencial) ou link de reunião (online)"
- Banner de conflito de horário: exibido abaixo do campo de horário quando `createAppointment`
  ou `updateAppointment` retorna `{ type: "conflict", message: "..." }` (Tela 4 da spec, AC-17/AC-23)
- Validação client-side com `AppointmentFormSchema` via react-hook-form + zodResolver
- Ao submeter criação: chama `createAppointment(data)` (AC-19 — desabilita botão, mostra loading)
- Ao submeter edição: chama `updateAppointment({ appointmentId, ...data })`
- Após sucesso na criação: exibe toast "Consulta agendada com sucesso" e navega para `/appointments` (AC-11)
- Após sucesso na edição: exibe toast "Consulta atualizada com sucesso" e navega para `/appointments/[id]` (AC-21)
- Botão "Cancelar": `router.back()` sem salvar

**Critérios de aceite desta task:**
- [ ] Formulário de criação exibe campos em branco com `durationMinutes = 50` (RN-01)
- [ ] `searchParams.date` pré-preenche o campo de data (para "Agendar neste dia")
- [ ] Formulário de edição pré-preenche todos os campos com dados da consulta (AC-20)
- [ ] Consulta com status terminal exibe mensagem sem renderizar formulário (AC-22)
- [ ] Dropdown de pacientes lista apenas pacientes ativos do psicólogo (RN-07)
- [ ] Erros de validação exibidos inline com mensagens exatas da spec (AC-12, AC-13, AC-14, AC-18)
- [ ] Banner de conflito exibido quando action retorna `type: "conflict"` (AC-17, AC-23)
- [ ] Botão de submit desabilitado com loading durante submissão (AC-19)
- [ ] Toast "Consulta agendada com sucesso" após criação bem-sucedida (AC-11)
- [ ] Toast "Consulta atualizada com sucesso" após edição bem-sucedida (AC-21)
- [ ] Formulário funciona em viewport 375px sem scroll horizontal
- [ ] Campo de horário usa `type="time"` (mobile-first)

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

### TASK-08: criar página de detalhes da consulta (/appointments/[id])

- **Status:** todo
- **Dependências:** TASK-02, TASK-03, TASK-04
- **target_path:** projects/agenda-psicologos/src/app/(auth)/appointments/[id]/
- **Estimativa:** P

**O que fazer:**

Criar a página de detalhes de uma consulta individual. Esta rota é acessada quando
o psicólogo clica em "Ver detalhes" na visualização diária ou quando é redirecionado
após uma ação no painel de detalhes. Pode ser desenvolvida em paralelo com TASK-05,
TASK-06 e TASK-07 pois opera em rota diferente.

**Arquivos a criar:**

**1. `src/app/(auth)/appointments/[id]/page.tsx`** — Server Component

- Recebe `params.id`
- Chama `getCurrentUser()`
- Chama `getAppointmentById(userId, id)` — se null: renderiza `notFound()` do Next.js (AC-35)
- Renderiza conteúdo da página com os dados da consulta
- Inclui link "← Voltar" que usa `router.back()` ou aponta para `/appointments`

**2. `src/features/appointments/components/AppointmentDetails.tsx`** — Client Component

- Recebe `appointment: AppointmentWithPatient & { hasNote: boolean }`
- Exibe todos os dados da consulta (equivalente ao painel de detalhes da Tela 3 da spec,
  mas como página completa em vez de sheet):
  - Nome do paciente como link para `/patients/[id]`
  - Data por extenso em pt-BR + horário de início e término calculado
  - Modalidade + local/link (se preenchido)
  - `<StatusBadge status={...} />`
- Seção de ações (mesma lógica do `AppointmentDetailPanel` da TASK-06):
  - Se `scheduled` ou `confirmed`: "Marcar como realizada", "Marcar como no-show",
    "Editar consulta", "Cancelar consulta"
  - Se `completed`: "Ver prontuário" ou "Registrar prontuário" (AC-29)
  - Se `cancelled` ou `no_show`: apenas badge de status sem ações
- Cada ação chama a respectiva Server Action e exibe toast correspondente
- "Cancelar consulta" abre `<CancelDialog>` (reutilizar de TASK-06)

**Critérios de aceite desta task:**
- [ ] Rota `/appointments/[id]` carrega e exibe dados completos da consulta (AC-10)
- [ ] URL com ID inexistente ou de outro psicólogo retorna 404 (AC-35)
- [ ] Horário de término calculado corretamente como `scheduledAt + durationMinutes` (RN-10)
- [ ] Ações exibidas corretamente conforme status (RN-03, RN-04)
- [ ] Link "Ver prontuário" ou "Registrar prontuário" visível apenas para `status = completed` (AC-29)
- [ ] Página funciona em viewport 375px
- [ ] Nome do paciente é link para `/patients/[id]`

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

### TASK-09: testes de integração do fluxo de agenda

- **Status:** todo
- **Dependências:** TASK-05, TASK-06, TASK-07, TASK-08
- **target_path:** projects/agenda-psicologos/src/features/appointments/
- **Estimativa:** M

**O que fazer:**

Criar testes de integração cobrindo os fluxos principais da feature. Os testes
usam Vitest e mockam o Prisma Client via `vi.mock('@/shared/lib/prisma')`.

**Arquivo a criar: `src/features/appointments/__tests__/appointment-flows.test.ts`**

Cobrir os seguintes cenários de integração entre queries e actions:

**Fluxo 1 — Criação de consulta:**
- Criar consulta válida → `appointments.create` chamado com `status = "scheduled"`
- Criar com paciente inativo → lança erro "Paciente não encontrado ou inativo"
- Criar com conflito de horário → retorna `{ type: "conflict", message: "..." }` com nome do paciente conflitante
- Criar sem autenticação → lança erro "Não autenticado"

**Fluxo 2 — Edição de consulta:**
- Editar consulta `scheduled` → `appointments.update` chamado
- Editar consulta `completed` → retorna erro "Consultas finalizadas não podem ser editadas."
- Editar com novo horário conflitante (excluindo a própria) → retorna conflito
- Editar com novo horário sem conflito → sucesso

**Fluxo 3 — Cancelamento:**
- Cancelar consulta `scheduled` com motivo → `status = "cancelled"`, `cancellationReason` preenchido
- Cancelar consulta `scheduled` sem motivo → `cancellationReason = null`
- Cancelar consulta `completed` → lança erro
- Verificar que `deletedAt` NÃO é preenchido ao cancelar (RN-08)

**Fluxo 4 — Transições de status:**
- Completar `scheduled` → sucesso
- Completar `confirmed` → sucesso
- Completar `cancelled` → lança erro
- No-show de `scheduled` → sucesso
- No-show de `no_show` → lança erro

**Fluxo 5 — Isolamento de dados:**
- `getAppointmentById` com `userId` diferente do dono → retorna `null`
- Criar consulta com `patientId` de outro psicólogo → lança erro

**Critérios de aceite desta task:**
- [ ] Todos os 5 fluxos têm cobertura de testes
- [ ] Cada cenário listado acima tem ao menos um teste
- [ ] Testes não fazem chamadas reais ao banco — Prisma mockado com `vi.mock`
- [ ] `pnpm test` passa com todos os testes verdes
- [ ] `pnpm test:coverage` mostra cobertura >= à task anterior
- [ ] Testes cobrem casos de erro (input inválido, não autenticado, recurso não encontrado)

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
TASK-01 (tipos + schemas)
  └── TASK-02 (queries de leitura)
        ├── TASK-03 (actions: criar + editar)    ← paralelo com TASK-04
        └── TASK-04 (actions: cancelar + status) ← paralelo com TASK-03
              ├── TASK-05 (visualização semanal)  ← paralelo com TASK-06, TASK-07, TASK-08
              ├── TASK-06 (visualização diária)   ← paralelo com TASK-05, TASK-07, TASK-08
              ├── TASK-07 (formulário novo/editar)← paralelo com TASK-05, TASK-06, TASK-08
              └── TASK-08 (página detalhes)       ← paralelo com TASK-05, TASK-06, TASK-07
                    └── TASK-09 (testes de integração) ← aguarda todas as UI tasks
```

**Paralelismo disponível:**
- TASK-03 e TASK-04 podem rodar em paralelo (arquivos diferentes, mesma dependência)
- TASK-05, TASK-06, TASK-07 e TASK-08 podem rodar em paralelo entre si (rotas diferentes, sem conflito)

**Ordem crítica:**
- TASK-01 primeiro — tipos são importados por queries e actions
- TASK-02 antes das actions — queries são usadas dentro das actions para buscar/validar dados
- TASK-03 e TASK-04 antes das UI tasks — componentes chamam as Server Actions
- TASK-09 depois de todas as UI tasks — valida a integração end-to-end
```
