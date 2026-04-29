# Tasks — confirmacao-paciente

**Feature:** Confirmação de Consulta pelo Paciente
**Slug:** `confirmacao-paciente`
**Criado em:** 2026-04-28
**Status:** aguardando aprovação

---

## Resumo

5 tasks cobrindo as camadas: types/schema Zod, queries, Server Action, UI de
agenda com indicadores de status, e UI do diálogo de cancelamento + painel de
detalhes atualizado. Nenhuma migration é necessária — `appointments.cancellation_reason`
e `appointment_tokens` já existem no schema Prisma definido em `data-model.md`.

**Dependências externas obrigatórias antes de iniciar qualquer task:**
- Feature `autenticacao` implementada — fornece `getCurrentUser()`
- Feature `agenda-consultas` implementada — fornece os componentes de agenda e
  painel de detalhes que esta feature modifica
- Feature `lembretes-consulta` implementada — cria e valida tokens em
  `appointment_tokens`; as queries desta feature fazem join nessa tabela

---

## Tasks

### TASK-01: adicionar tipos e schema Zod para cancelamento de consulta

- **Status:** todo
- **Dependências:** nenhuma (não requer implementação de outra feature, apenas o schema Prisma já existente)
- **target_path:** projects/agenda-psicologos/src/features/appointments/schema.ts
- **Estimativa:** P

**O que fazer:**

Adicionar ao arquivo `src/features/appointments/schema.ts` (que já existe após
`agenda-consultas`) o schema Zod para cancelamento de consulta pelo psicólogo:

```typescript
// Adição ao src/features/appointments/schema.ts

import { z } from "zod"

export const CancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
  cancellationReason: z
    .string()
    .max(500, "Motivo deve ter no máximo 500 caracteres")
    .optional(),
})
```

Criar ou atualizar `src/features/appointments/types.ts` adicionando os tipos
necessários para a feature:

```typescript
// Adição ao src/features/appointments/types.ts

// Origem do cancelamento — inferida a partir de appointment_tokens
export type CancellationOrigin = "patient" | "psychologist" | null

// Dados do token mais recente de uma consulta (para inferir origem e status)
export type AppointmentTokenSummary = {
  action: "confirmed" | "cancelled" | null
  usedAt: Date | null
  expiresAt: Date
}

// Consulta enriquecida com dados do token para exibição na agenda
export type AppointmentWithTokenStatus = {
  id: string
  patientId: string
  patientName: string
  scheduledAt: Date
  durationMinutes: number
  modality: "in_person" | "online"
  location: string | null
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
  cancellationReason: string | null
  cancellationOrigin: CancellationOrigin // calculado em query, não armazenado
  latestToken: AppointmentTokenSummary | null
}
```

A lógica de `cancellationOrigin` é inferida em código (nunca armazenada no banco):
- Se `status = cancelled` E existe token com `action = 'cancelled'` E `usedAt IS NOT NULL`:
  origem é `"patient"`
- Se `status = cancelled` E nenhum token tem `action = 'cancelled'`:
  origem é `"psychologist"`
- Qualquer outro status: origem é `null`

**Critérios de aceite desta task:**
- [ ] `CancelAppointmentSchema` exportado de `schema.ts` com validações exatas: `uuid()` no `appointmentId` e `max(500)` no `cancellationReason`
- [ ] `CancellationOrigin`, `AppointmentTokenSummary` e `AppointmentWithTokenStatus` exportados de `types.ts`
- [ ] `pnpm typecheck` passa sem erros
- [ ] `pnpm lint` passa sem erros

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

### TASK-02: criar e atualizar queries de consulta com dados de token

- **Status:** todo
- **Dependências:** TASK-01, agenda-consultas implementada, lembretes-consulta implementada
- **target_path:** projects/agenda-psicologos/src/features/appointments/queries/
- **Estimativa:** M

**O que fazer:**

Criar `src/features/appointments/queries/getAppointmentsForWeek.ts` e atualizar
`src/features/appointments/queries/getAppointmentDetails.ts` para incluir join
com `appointment_tokens`.

**1. Criar `getAppointmentsForWeek.ts`:**

```typescript
// src/features/appointments/queries/getAppointmentsForWeek.ts

// Recebe: userId: string, weekStart: Date, weekEnd: Date
// Retorna: AppointmentWithTokenStatus[]

// Query Prisma:
// prisma.appointment.findMany({
//   where: {
//     userId,
//     scheduledAt: { gte: weekStart, lte: weekEnd },
//     deletedAt: null,
//   },
//   include: {
//     patient: { select: { id: true, name: true } },
//     tokens: {
//       orderBy: { createdAt: "desc" },
//       take: 1,            // apenas o token mais recente
//       select: { action: true, usedAt: true, expiresAt: true },
//     },
//   },
//   orderBy: { scheduledAt: "asc" },
// })

// Após buscar, calcular cancellationOrigin para cada consulta:
// - status = 'cancelled' E tokens[0].action = 'cancelled' E tokens[0].usedAt != null
//   → cancellationOrigin = "patient"
// - status = 'cancelled' E (sem tokens com action = 'cancelled')
//   → cancellationOrigin = "psychologist"
// - demais status → cancellationOrigin = null

// Mapear para AppointmentWithTokenStatus antes de retornar
```

Esta query retorna dados suficientes para renderizar todos os blocos da agenda
semanal/diária com indicadores de status, conforme AC-04 (dados em uma única
query, sem requisição adicional por consulta).

**2. Atualizar `getAppointmentDetails.ts`:**

O arquivo já existe após `agenda-consultas`. Modificar para incluir o token
mais recente no retorno:

```typescript
// Adicionar ao include existente:
// tokens: {
//   orderBy: { createdAt: "desc" },
//   take: 1,
//   select: { action: true, usedAt: true, expiresAt: true },
// }

// Calcular cancellationOrigin na resposta (mesma lógica de getAppointmentsForWeek)
// Retornar o dado enriquecido com latestToken e cancellationOrigin
```

Garantir que ambas as queries filtram por `userId` — nunca retornar dados de
outro psicólogo (AC-16: consulta de outro psicólogo retorna 404/não encontrado).

**Critérios de aceite desta task:**
- [ ] `getAppointmentsForWeek(userId, weekStart, weekEnd)` retorna array de `AppointmentWithTokenStatus`
- [ ] A query não gera N+1 — tokens carregados via `include`, não por consulta separada
- [ ] `cancellationOrigin` é calculado corretamente para os três casos: `"patient"`, `"psychologist"`, `null`
- [ ] `getAppointmentDetails(appointmentId, userId)` inclui `latestToken` e `cancellationOrigin` no retorno
- [ ] Ambas as queries filtram por `userId` — busca com `userId` diferente do dono retorna `null` ou array vazio
- [ ] Testes unitários cobrem: consulta sem tokens, consulta cancelada pelo paciente (token com action=cancelled), consulta cancelada pelo psicólogo (sem token cancelled), consulta confirmada, semana sem consultas
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

### TASK-03: criar Server Action cancelAppointment

- **Status:** todo
- **Dependências:** TASK-01, autenticacao implementada
- **target_path:** projects/agenda-psicologos/src/features/appointments/actions/cancelAppointment.ts
- **Estimativa:** M

**O que fazer:**

Criar `src/features/appointments/actions/cancelAppointment.ts` com a Server
Action de cancelamento de consulta pelo psicólogo.

```typescript
"use server"

import { z } from "zod"
import { CancelAppointmentSchema } from "../schema"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"

export async function cancelAppointment(
  input: z.infer<typeof CancelAppointmentSchema>
) {
  // 1. Autentica o psicólogo
  const user = await getCurrentUser()
  if (!user) throw new Error("Não autenticado")

  // 2. Valida input com Zod
  const validated = CancelAppointmentSchema.parse(input)

  // 3. Busca a consulta garantindo que pertence ao psicólogo autenticado
  //    prisma.appointment.findUnique({
  //      where: { id: validated.appointmentId },
  //      select: { id: true, userId: true, status: true }
  //    })
  //    - Se não encontrada OU userId != user.id: throw new Error("Consulta não encontrada")
  //      (retorna 404 sem revelar existência — AC-16)

  // 4. Valida status permitido para cancelamento
  //    - status deve ser 'scheduled' ou 'confirmed'
  //    - Se for 'completed', 'cancelled' ou 'no_show':
  //      throw new Error("Não é possível cancelar uma consulta com status " + status)
  //      (AC-09: botão não exibido na UI, mas validação também no servidor)

  // 5. Executa transação atômica (RN-02):
  //    prisma.$transaction([
  //      // a. Atualiza status e motivo da consulta
  //      prisma.appointment.update({
  //        where: { id: validated.appointmentId },
  //        data: {
  //          status: "cancelled",
  //          cancellationReason: validated.cancellationReason ?? null,
  //        },
  //      }),
  //      // b. Invalida token ativo mais recente se existir (AC-11, RN-02)
  //      //    Atualiza expires_at = now() para todos os tokens não expirados e não usados
  //      prisma.appointmentToken.updateMany({
  //        where: {
  //          appointmentId: validated.appointmentId,
  //          usedAt: null,
  //          expiresAt: { gt: new Date() },
  //        },
  //        data: { expiresAt: new Date() },
  //      }),
  //    ])
  //    RN-03: se updateMany atualizar 0 registros (sem token ativo), não é erro

  // 6. Retorna { success: true }
}
```

**Comportamento de erros:**
- Usuário não autenticado: `throw new Error("Não autenticado")` (AC-17)
- Consulta não encontrada ou de outro psicólogo: `throw new Error("Consulta não encontrada")` — sem revelar existência (AC-16)
- Status terminal: `throw new Error("Não é possível cancelar esta consulta")` (AC-09)
- Falha na transação: deixar propagar para o Sentry via erro não tratado

**Critérios de aceite desta task:**
- [ ] Arquivo usa `"use server"` no topo
- [ ] Começa com `getCurrentUser()` antes de qualquer operação
- [ ] Valida input com `CancelAppointmentSchema` antes de acessar o banco
- [ ] Verifica que `appointment.userId === user.id` — lança erro 404-like se diferente
- [ ] Bloqueia cancelamento de status `completed`, `cancelled`, `no_show`
- [ ] Usa `prisma.$transaction` para garantir atomicidade entre atualização de `appointments` e `appointment_tokens`
- [ ] `updateMany` em `appointment_tokens` não gera erro quando não há token ativo (0 registros atualizados é válido — RN-03)
- [ ] Testes unitários cobrem: cancelamento válido (status scheduled), cancelamento com token ativo (verifica que token é invalidado), sem token ativo (não gera erro), status terminal (lança erro), consulta de outro psicólogo (lança erro), não autenticado (lança erro)
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

### TASK-04: atualizar blocos da agenda com indicadores visuais de status

- **Status:** todo
- **Dependências:** TASK-02, agenda-consultas implementada
- **target_path:** projects/agenda-psicologos/src/features/appointments/components/
- **Estimativa:** M

**O que fazer:**

Atualizar o componente de bloco de consulta na agenda semanal/diária
(componente criado em `agenda-consultas`, provavelmente
`AppointmentBlock.tsx` ou equivalente) para exibir indicadores de status
conforme AC-01, AC-02, AC-03.

**1. Atualizar `AppointmentBlock.tsx` (ou componente equivalente da agenda):**

O componente recebe dados do tipo `AppointmentWithTokenStatus` (definido em TASK-01).
Adicionar a seção de indicador de status conforme a seguinte lógica:

```
status = 'scheduled'  → sem indicador de confirmação (apenas ícone de calendário)
status = 'confirmed'  → borda/fundo verde sutil + badge "Confirmada pelo paciente"
status = 'cancelled' + cancellationOrigin = 'patient'
                      → bloco com opacidade reduzida (opacity-50) + badge "Cancelada pelo paciente"
status = 'cancelled' + cancellationOrigin = 'psychologist'
                      → bloco com opacidade reduzida + badge "Cancelada pelo psicólogo"
status = 'completed'  → badge "Realizada"
status = 'no_show'    → badge "Falta"
```

Consultas com `status = 'cancelled'` têm classe Tailwind `opacity-50` aplicada
no bloco inteiro. Consultas com `status = 'confirmed'` têm classe de borda ou
fundo verde sutil (ex: `border-green-500 bg-green-50`).

**2. Criar componente `AppointmentStatusBadge.tsx`:**

Componente de apresentação pura (sem lógica de negócio) que recebe
`status: string` e `cancellationOrigin: CancellationOrigin` e retorna o
elemento visual correto. Exemplo:

```typescript
// src/features/appointments/components/AppointmentStatusBadge.tsx
// "use client" se necessário, mas preferencialmente Server Component puro

type Props = {
  status: AppointmentWithTokenStatus["status"]
  cancellationOrigin: CancellationOrigin
}

// Retorna <span> com texto e estilo adequados conforme tabela de status acima
// Texto exato conforme wireframe:
//   confirmed → "Confirmada pelo paciente"
//   cancelled + patient → "Cancelada pelo paciente"
//   cancelled + psychologist → "Cancelada pelo psicólogo"
//   completed → "Realizada"
//   no_show → "Falta"
//   scheduled → null (sem badge)
```

**3. Garantir estado vazio da agenda:**

Se `getAppointmentsForWeek` retornar array vazio, exibir estado vazio conforme
wireframe (US-06):
```
"Nenhuma consulta agendada para esta semana."
[Agendar consulta]  ← link/botão que navega para /appointments/new
```

**Critérios de aceite desta task:**
- [ ] Bloco de consulta exibe `AppointmentStatusBadge` conforme o `status` e `cancellationOrigin`
- [ ] Consultas `cancelled` têm opacidade reduzida visível
- [ ] Consultas `confirmed` têm destaque verde sutil visível
- [ ] Badge "Confirmada pelo paciente" aparece quando `status = confirmed`
- [ ] Badge "Cancelada pelo paciente" aparece quando `status = cancelled` e `cancellationOrigin = 'patient'`
- [ ] Badge "Cancelada pelo psicólogo" aparece quando `status = cancelled` e `cancellationOrigin = 'psychologist'`
- [ ] Estado vazio exibe mensagem "Nenhuma consulta agendada para esta semana." quando não há consultas
- [ ] Componente funciona em viewport 375px sem scroll horizontal
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

### TASK-05: criar diálogo de cancelamento e atualizar painel de detalhes

- **Status:** todo
- **Dependências:** TASK-03, TASK-04, agenda-consultas implementada
- **target_path:** projects/agenda-psicologos/src/features/appointments/components/
- **Estimativa:** G

**O que fazer:**

Criar o componente `CancelAppointmentDialog.tsx` e atualizar o painel de
detalhes da consulta (componente de `agenda-consultas`) para exibir:
- Botão "Cancelar consulta" (quando status permite)
- Status pós-resposta do paciente
- Motivo de cancelamento (quando preenchido)

**1. Criar `CancelAppointmentDialog.tsx` — Client Component (`"use client"`):**

Diálogo modal de confirmação de cancelamento conforme wireframe (AC-06):

```
Props:
  appointmentId: string
  patientName: string
  scheduledAt: Date
  onSuccess: () => void   // chamado após cancelamento bem-sucedido
  onClose: () => void     // chamado ao fechar/voltar sem cancelar
```

Estrutura do diálogo (usar `Dialog` do shadcn/ui):
- Título: "Cancelar consulta"
- Dados da consulta: nome do paciente + data/hora formatada (ex: "Sexta-feira, 08 mai 2026 · 09:00")
- Campo `<textarea>` "Motivo do cancelamento (opcional)" com `maxLength={500}`
  e contador de caracteres restantes
- Botão "Voltar" — fecha o diálogo sem ação (AC-08)
- Botão "Confirmar cancelamento" — executa `cancelAppointment`

Comportamento ao confirmar (AC-07, AC-10):
1. Desabilita botão "Confirmar cancelamento" e exibe texto "Cancelando..." durante requisição
2. Chama `cancelAppointment({ appointmentId, cancellationReason })` (Server Action de TASK-03)
3. Em caso de sucesso:
   - Fecha o diálogo
   - Chama `onSuccess()` para o componente pai revalidar os dados
   - Exibe toast "Consulta cancelada" (usar `toast` do shadcn/ui Sonner — AC-07, AC-13)
4. Em caso de erro:
   - Reabilita o botão
   - Exibe mensagem de erro inline no diálogo

**2. Atualizar painel de detalhes da consulta (componente existente de `agenda-consultas`):**

Arquivo provável: `src/app/(auth)/appointments/[id]/page.tsx` ou componente
`AppointmentDetailPanel.tsx`. Adicionar/modificar:

a. **Seção de status pós-resposta do paciente** (AC-01, AC-02, AC-03):
   - Exibir `AppointmentStatusBadge` (criado em TASK-04) no campo "Status:"
   - Se `cancellationOrigin = 'patient'` e token com `usedAt != null`: exibir
     linha "Paciente [confirmou/cancelou] presença em [data/hora do usedAt]"
   - Se `cancellationOrigin = 'psychologist'`: não exibir linha de data/hora do token

b. **Campo Motivo (AC-14, AC-15):**
   - Se `status = 'cancelled'` E `cancellationReason != null`: exibir
     `<p>Motivo: {cancellationReason}</p>` na seção de informações
   - Se `status = 'cancelled'` E `cancellationReason === null` (cancelamento pelo
     paciente): omitir o campo completamente — não exibir nada

c. **Seção de Ações — botão "Cancelar consulta" (AC-05, AC-09):**
   - Exibir botão "Cancelar consulta" somente quando `status = 'scheduled'` ou
     `status = 'confirmed'`
   - Não exibir o botão quando `status = 'completed'`, `'cancelled'` ou `'no_show'`
   - Ao clicar: abrir `<CancelAppointmentDialog />` com os dados da consulta
   - Após cancelamento confirmado (`onSuccess`): revalidar página para refletir
     novo status (usar `router.refresh()` ou `revalidatePath`)

d. **Seção vazia de ações para status terminais:**
   - Quando `status` é terminal (`completed`, `cancelled`, `no_show`): exibir
     apenas "(nenhuma ação disponível)" na seção de ações, sem botões

**Critérios de aceite desta task:**
- [ ] Botão "Cancelar consulta" visível apenas para `status = scheduled` ou `confirmed`
- [ ] Botão não visível para `status = completed`, `cancelled`, `no_show`
- [ ] Diálogo exibe nome do paciente e data/hora da consulta formatados
- [ ] Campo de motivo aceita até 500 caracteres (textarea com maxLength e contador)
- [ ] Botão "Confirmar cancelamento" fica desabilitado com texto "Cancelando..." durante a operação (AC-10)
- [ ] Botão "Voltar" fecha o diálogo sem alterar dados (AC-08)
- [ ] Toast "Consulta cancelada" exibido após sucesso (AC-07, AC-13)
- [ ] Painel de detalhes exibe "Motivo:" quando `cancellationReason != null` (AC-14)
- [ ] Painel de detalhes omite "Motivo:" quando `cancellationReason === null` (AC-15)
- [ ] Linha de data/hora do token exibida quando paciente confirmou/cancelou via token
- [ ] Após cancelamento, página revalida e exibe status atualizado
- [ ] Todos os componentes funcionam em viewport 375px sem scroll horizontal
- [ ] Target de toque do botão "Cancelar consulta" é de no mínimo 44x44px
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

## Diagrama de execução

```
TASK-01 (types + schema Zod)
  ├── TASK-02 (queries com join em appointment_tokens) [sequencial após TASK-01]
  │     └── TASK-04 (UI: blocos da agenda com indicadores de status) [sequencial após TASK-02]
  │                                                                        │
  └── TASK-03 (Server Action cancelAppointment) [paralelo com TASK-02]    │
                                                                           │
                              TASK-05 (diálogo de cancelamento + painel de detalhes)
                              [sequencial após TASK-03 E TASK-04]
```

**Paralelismo disponível:**
- TASK-02 e TASK-03 podem rodar em paralelo após TASK-01 concluída
  - TASK-02 opera em `queries/` (somente leitura de dados)
  - TASK-03 opera em `actions/` (mutação de dados)
  - Arquivos completamente distintos, sem conflito de merge

**Ordem crítica:**
- TASK-01 primeiro — define os tipos e schemas que TASK-02, TASK-03 e TASK-04 importam
- TASK-05 exige TASK-03 (Server Action) E TASK-04 (AppointmentStatusBadge e lógica de blocos)
- TASK-02 precisa estar concluída antes de TASK-04 (query alimenta os componentes)
