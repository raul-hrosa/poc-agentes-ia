# Tasks — lembretes-consulta

**Feature:** Lembretes de Consulta
**Slug:** `lembretes-consulta`
**Criado em:** 2026-04-28
**Status:** aguardando aprovação

---

## Resumo

8 tasks cobrindo as camadas: schema/migration, tipos, service (HMAC), queries,
Server Actions, API Route pública, UI e testes de integração.
A feature depende de `agenda-consultas` e `cadastro-pacientes` estarem implementadas.

---

## Tasks

### TASK-01: adicionar campo email à tabela patients e criar utilitário HMAC

- **Status:** todo
- **Dependências:** nenhuma (pode rodar assim que agenda-consultas/TASK-01 estiver concluída, mas é independente desta feature)
- **target_path:** projects/agenda-psicologos/prisma/schema.prisma
- **Estimativa:** P

**O que fazer:**

Esta task tem dois sub-entregáveis que resultam num único commit.

**1. Migration: adicionar campo `email` ao model `Patient` em `prisma/schema.prisma`:**

```prisma
// Dentro do model Patient, após o campo phone:
email String? @db.VarChar(255)
```

O campo é opcional (`String?`) pois pacientes já cadastrados não possuem e-mail.
Não adicionar índice — a busca por e-mail de paciente ocorre sempre via `appointmentId`
(join), nunca como lookup direto.

Após editar o schema, executar `pnpm db:migrate` com o nome descritivo
`add_email_to_patients`. Em seguida, executar `pnpm db:generate` para regenerar
o Prisma Client.

**2. Criar `src/shared/lib/tokens.ts`** com as funções utilitárias de token HMAC:

```typescript
// src/shared/lib/tokens.ts
import { createHmac } from "crypto"

export function generateConfirmationToken(appointmentId: string, expiresAt: Date): string {
  const payload = `${appointmentId}:${expiresAt.toISOString()}`
  return createHmac("sha256", process.env.APP_SECRET!).update(payload).digest("hex")
}

export function buildConfirmationLink(token: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/confirm/${token}`
}

export function getTokenExpiration(): Date {
  return new Date(Date.now() + 72 * 60 * 60 * 1000)
}
```

**3. Adicionar variáveis de ambiente ao `.env.example`** (se ainda não existirem):

```
APP_SECRET=          # mínimo 32 caracteres, usado no HMAC-SHA256 de tokens
RESEND_API_KEY=      # chave da API Resend para envio de e-mail
NEXT_PUBLIC_APP_URL= # URL base do app, ex: https://app.psiagenda.com.br
```

**Critérios de aceite desta task:**
- [ ] Campo `email String? @db.VarChar(255)` presente no model `Patient` no schema Prisma
- [ ] Migration gerada com `pnpm db:migrate` com nome `add_email_to_patients`
- [ ] `prisma.patient` inclui campo `email` acessível sem erro de tipo após `pnpm db:generate`
- [ ] `src/shared/lib/tokens.ts` exporta `generateConfirmationToken`, `buildConfirmationLink` e `getTokenExpiration`
- [ ] `generateConfirmationToken` usa `crypto.createHmac("sha256", APP_SECRET)` conforme RN-01 da spec
- [ ] `getTokenExpiration` retorna `now() + 72 horas` conforme RN-02 da spec
- [ ] Testes unitários para `generateConfirmationToken` (determinístico com mesmo payload) e `getTokenExpiration`
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

### TASK-02: criar tipos e schemas Zod da feature reminders

- **Status:** todo
- **Dependências:** TASK-01
- **target_path:** projects/agenda-psicologos/src/features/reminders/
- **Estimativa:** P

**O que fazer:**

Criar os arquivos de tipos e schemas da feature `reminders`.

**1. Criar `src/features/reminders/schema.ts`:**

```typescript
// src/features/reminders/schema.ts
import { z } from "zod"

export const GenerateReminderSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
})

export const SendReminderEmailSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
})

export const ConfirmActionSchema = z.object({
  token: z.string().length(64, "Token inválido"),
  action: z.enum(["confirmed", "cancelled"]),
})
```

**2. Criar `src/features/reminders/types.ts`:**

```typescript
// src/features/reminders/types.ts

export type ReminderStatus =
  | "none"           // nenhum token gerado ainda
  | "pending"        // token gerado, aguardando resposta do paciente
  | "confirmed"      // paciente confirmou via link
  | "cancelled"      // paciente cancelou via link

export type ReminderInfo = {
  tokenId: string
  createdAt: Date
  expiresAt: Date
  usedAt: Date | null
  action: "confirmed" | "cancelled" | null
  status: ReminderStatus
  link: string
}

export type AppointmentWithReminderData = {
  id: string
  scheduledAt: Date
  durationMinutes: number
  modality: string
  location: string | null
  status: string
  patient: {
    id: string
    name: string
    email: string | null
  }
  user: {
    id: string
    name: string
  }
  latestReminder: ReminderInfo | null
}

export type ConfirmPageData = {
  valid: true
  appointment: {
    scheduledAt: Date
    durationMinutes: number
    modality: string
    location: string | null
    status: string
  }
  patient: {
    name: string
  }
  psychologist: {
    name: string
  }
  token: string
  action: "confirmed" | "cancelled" | null
}

export type ConfirmPageError =
  | { valid: false; reason: "not_found" }
  | { valid: false; reason: "expired" }
  | { valid: false; reason: "used"; action: "confirmed" | "cancelled" }
  | { valid: false; reason: "appointment_closed" }
```

**Critérios de aceite desta task:**
- [ ] `src/features/reminders/schema.ts` exporta `GenerateReminderSchema`, `SendReminderEmailSchema` e `ConfirmActionSchema`
- [ ] `ConfirmActionSchema` valida `token` com exatamente 64 caracteres e `action` como union de `"confirmed" | "cancelled"`
- [ ] `src/features/reminders/types.ts` exporta todos os tipos listados acima sem erros de tipo
- [ ] Não há importações circulares entre `reminders/` e outras features
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

### TASK-03: criar queries de reminder e token para o painel do psicólogo e a página pública

- **Status:** todo
- **Dependências:** TASK-02
- **target_path:** projects/agenda-psicologos/src/features/reminders/queries/
- **Estimativa:** M

**O que fazer:**

Criar os arquivos de query da feature `reminders`. Todas as queries usam o
Prisma Client singleton de `src/shared/lib/prisma.ts`.

**1. Criar `src/features/reminders/queries/getLatestReminderForAppointment.ts`:**

Busca o token mais recente de uma consulta para exibir o status de lembrete
no painel do psicólogo. Recebe `appointmentId: string` e `userId: string`.

Lógica:
- Busca a consulta por `id` filtrando por `userId` para garantir isolamento.
  Se não encontrar, lançar `new Error("Consulta não encontrada")`.
- Busca o `AppointmentToken` mais recente da consulta:
  ```typescript
  prisma.appointmentToken.findFirst({
    where: { appointmentId },
    orderBy: { createdAt: "desc" },
  })
  ```
- Se não houver token, retorna `null`.
- Se houver token, calcula o `ReminderStatus`:
  - Se `token.action === "confirmed"` → `"confirmed"`
  - Se `token.action === "cancelled"` → `"cancelled"`
  - Se `token.usedAt` não é null mas `action` é null → `"pending"` (não deveria ocorrer, mas cobrir)
  - Se `token.usedAt` é null → `"pending"`
- Retorna objeto `ReminderInfo` com o link montado via `buildConfirmationLink(token.token)`.

**2. Criar `src/features/reminders/queries/getAppointmentForReminder.ts`:**

Busca os dados completos de uma consulta para preencher os campos do painel
do psicólogo. Recebe `appointmentId: string` e `userId: string`.

Lógica:
- Busca o `Appointment` incluindo `patient` (campos: `id`, `name`, `email`)
  e `user` (campos: `id`, `name`).
- Filtra obrigatoriamente por `id: appointmentId` e `userId` para isolamento.
- Inclui o token mais recente via subchamada a `getLatestReminderForAppointment`.
- Retorna `AppointmentWithReminderData` ou `null` se não encontrado.

**3. Criar `src/features/reminders/queries/getTokenForConfirmPage.ts`:**

Query pública (sem filtro de userId) usada no Server Component da página
`/confirm/[token]`. Recebe `token: string`.

Lógica (seguir a ordem de validação do RN-09 da spec):
1. Busca `AppointmentToken` com `include: { appointment: { include: { patient: true, user: true } } }` onde `token = token`.
2. Se não encontrar: retorna `{ valid: false, reason: "not_found" }`.
3. Se `expiresAt <= now()`: retorna `{ valid: false, reason: "expired" }`.
4. Se `usedAt !== null`: retorna `{ valid: false, reason: "used", action: tokenRecord.action }`.
5. Se `appointment.status` é `"completed"`, `"cancelled"` ou `"no_show"`: retorna `{ valid: false, reason: "appointment_closed" }`.
6. Caso contrário: retorna `ConfirmPageData` com os dados da consulta, paciente, psicólogo e o token.

O campo `action` na `ConfirmPageData` é preenchido com o parâmetro de query
`?action=confirmed` ou `?action=cancelled` (passado pelo chamador, não por esta query).

**Critérios de aceite desta task:**
- [ ] `getLatestReminderForAppointment` filtra por `userId` antes de retornar dados
- [ ] `getLatestReminderForAppointment` retorna `null` quando a consulta não tem nenhum token
- [ ] `getLatestReminderForAppointment` calcula `ReminderStatus` corretamente para todos os estados
- [ ] `getTokenForConfirmPage` não filtra por `userId` (é query pública acessada por paciente)
- [ ] `getTokenForConfirmPage` segue exatamente a ordem de validação do RN-09: existência → expiração → uso → status da consulta
- [ ] `getTokenForConfirmPage` retorna dados da consulta sem expor informações de saúde (sem `session_notes`, sem `session_payments`)
- [ ] Testes unitários cobrem: consulta sem token, token ativo, token expirado, token usado, consulta fechada, token inexistente
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

### TASK-04: criar Server Actions generateReminderToken e sendReminderEmail

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/features/reminders/actions/
- **Estimativa:** M

**O que fazer:**

Criar as duas Server Actions da feature reminders. Ambas ficam no diretório
`src/features/reminders/actions/` com `"use server"` no topo.

**1. Criar `src/features/reminders/actions/generateReminderToken.ts`:**

Recebe `{ appointmentId: string }`. Lógica:

1. Chama `getCurrentUser()` — lança erro se não autenticado.
2. Valida input com `GenerateReminderSchema`.
3. Busca o `Appointment` pelo `id` filtrando por `userId = user.id` via Prisma.
   Se não encontrar: lança `new Error("Consulta não encontrada")` — retorna 404 sem revelar existência (AC-21).
4. Verifica se `appointment.status` é `"scheduled"` ou `"confirmed"`.
   Se não for: lança `new Error("Não é possível gerar lembrete para esta consulta")` (AC-04, RN-06).
5. Invalida o token ativo anterior (RN-04):
   ```typescript
   await prisma.appointmentToken.updateMany({
     where: {
       appointmentId,
       usedAt: null,
       expiresAt: { gt: new Date() },
     },
     data: { expiresAt: new Date() },
   })
   ```
6. Gera o novo token:
   - `expiresAt = getTokenExpiration()` (72h a partir de agora)
   - `token = generateConfirmationToken(appointmentId, expiresAt)` usando `shared/lib/tokens.ts`
7. Cria registro em `appointment_tokens`:
   ```typescript
   await prisma.appointmentToken.create({
     data: { appointmentId, token, expiresAt },
   })
   ```
8. Retorna `{ success: true, token, link: buildConfirmationLink(token) }`.

**2. Criar `src/features/reminders/actions/sendReminderEmail.ts`:**

Recebe `{ appointmentId: string }`. Lógica:

1. Chama `getCurrentUser()` — lança erro se não autenticado.
2. Valida input com `SendReminderEmailSchema`.
3. Busca a consulta com `include: { patient: true, user: true }`, filtrando por `userId = user.id`.
   Se não encontrar: lança `new Error("Consulta não encontrada")`.
4. Verifica se `patient.email` está preenchido.
   Se não estiver: lança `new Error("Paciente não tem e-mail cadastrado")`.
5. Chama `generateReminderToken({ appointmentId })` para obter o token e link atuais.
6. Instancia o cliente Resend via `shared/lib/resend.ts` e envia o e-mail:
   - `from`: `"PsiAgenda <lembretes@psiagenda.com.br>"` (RN-11)
   - `to`: `patient.email`
   - `subject`: `"Lembrete: sua consulta com ${user.name}"`
   - `html`: Template HTML com os dados do wireframe da spec (Tela 2):
     - Saudação com `patient.name`
     - Bloco com psicólogo, data por extenso, horário de início e término, modalidade e local/link (omitido se null)
     - Dois botões: `${link}?action=confirmed` e `${link}?action=cancelled`
     - Link de fallback em texto puro
     - Rodapé: "Enviado por PsiAgenda · psiagenda.com.br"
   - Link de confirmação: `${link}?action=confirmed`
   - Link de cancelamento: `${link}?action=cancelled`
7. Se o Resend retornar erro: lançar `new Error("Falha ao enviar e-mail. Copie o link e envie manualmente.")` (AC-07).
8. Retorna `{ success: true, link }`.

**Nota sobre `shared/lib/resend.ts`:** Se o arquivo ainda não existir, criá-lo
com o cliente Resend singleton:
```typescript
// src/shared/lib/resend.ts
import { Resend } from "resend"
export const resend = new Resend(process.env.RESEND_API_KEY)
```
Instalar o pacote `resend` se ainda não estiver em `package.json`.

**Critérios de aceite desta task:**
- [ ] `generateReminderToken` começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] `generateReminderToken` filtra consulta por `userId` — retorna erro 404 genérico para consultas de outros usuários (AC-21)
- [ ] `generateReminderToken` rejeita consultas com status `completed`, `cancelled` ou `no_show` (RN-06)
- [ ] `generateReminderToken` invalida o token ativo anterior antes de criar o novo (RN-04)
- [ ] Token gerado tem `expiresAt = now() + 72h` (RN-02)
- [ ] `sendReminderEmail` não exibe nem aciona envio se paciente não tem e-mail
- [ ] `sendReminderEmail` usa remetente fixo `lembretes@psiagenda.com.br` (RN-11)
- [ ] Template de e-mail inclui: nome do psicólogo, data por extenso, horário, modalidade, local/link (se preenchido), botões de confirmação e cancelamento, link de fallback
- [ ] Erro do Resend é capturado e relançado com mensagem amigável em português (AC-07)
- [ ] Testes unitários cobrem: consulta não encontrada, status inválido, token ativo anterior invalidado, reenvio, paciente sem e-mail, falha do Resend
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

### TASK-05: criar API Route pública POST /api/confirm/[token]

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/app/api/confirm/[token]/route.ts
- **Estimativa:** M

**O que fazer:**

Criar a Route Handler pública que processa as ações de confirmar e cancelar
consulta pelo paciente. Esta rota NÃO usa Server Action pois deve funcionar
sem autenticação (RN-10).

**Criar `src/app/api/confirm/[token]/route.ts`:**

```typescript
// Método: POST
// Recebe no body: { action: "confirmed" | "cancelled" }
// Parâmetro de rota: token (string de 64 chars)
```

Lógica:
1. Extrair `token` dos params da rota.
2. Parsear o body JSON e validar com `ConfirmActionSchema`:
   `{ token, action }` — se inválido: retornar `Response` com status 400 e
   body `{ error: "Dados inválidos" }`.
3. Buscar o `AppointmentToken` no banco:
   ```typescript
   prisma.appointmentToken.findUnique({
     where: { token },
     include: { appointment: true },
   })
   ```
4. Validar na ordem obrigatória do RN-09:
   - Se não encontrar: retornar `{ error: "not_found" }` com status 404
   - Se `expiresAt <= now()`: retornar `{ error: "expired" }` com status 410
   - Se `usedAt !== null`: retornar `{ error: "used", action: tokenRecord.action }` com status 409
   - Se `appointment.status` não é `"scheduled"` nem `"confirmed"`: retornar `{ error: "appointment_closed" }` com status 422
5. Executar a transação atômica (RN-08):
   ```typescript
   await prisma.$transaction([
     prisma.appointment.update({
       where: { id: tokenRecord.appointmentId },
       data: { status: action === "confirmed" ? "confirmed" : "cancelled" },
     }),
     prisma.appointmentToken.update({
       where: { token },
       data: { usedAt: new Date(), action },
     }),
   ])
   ```
6. Retornar `{ success: true, action }` com status 200.
7. Tratar exceções não esperadas: retornar `{ error: "Erro interno" }` com status 500.

**Nota importante sobre idempotência (RN-08):** Se `action === "confirmed"` e
`appointment.status` já é `"confirmed"`, o update do appointment é um no-op
mas ainda prossegue sem erro.

**Critérios de aceite desta task:**
- [ ] Rota responde a `POST /api/confirm/[token]` sem autenticação
- [ ] Input `action` é validado com `ConfirmActionSchema` antes de qualquer operação
- [ ] Token inválido retorna 404, token expirado retorna 410, token já usado retorna 409
- [ ] Transação é atômica: `appointment.status` e `appointmentToken.usedAt + action` são atualizados juntos
- [ ] `action === "confirmed"` define `appointment.status = "confirmed"`
- [ ] `action === "cancelled"` define `appointment.status = "cancelled"` (sem `cancellation_reason`)
- [ ] `appointment_tokens.action` é preenchido com o valor correto após uso
- [ ] Testes unitários cobrem: token não encontrado, token expirado, token usado, consulta fechada, confirmação bem-sucedida, cancelamento bem-sucedido
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

### TASK-06: criar seção Lembrete no painel de detalhes da consulta

- **Status:** todo
- **Dependências:** TASK-04
- **target_path:** projects/agenda-psicologos/src/features/reminders/components/
- **Estimativa:** G

**O que fazer:**

Criar os componentes React para a seção "Lembrete" exibida no painel de detalhes
da consulta (`/appointments/[id]`). O painel de detalhes é existente (implementado
em `agenda-consultas`). Esta task adiciona a seção de lembrete a ele.

**1. Criar `src/features/reminders/components/ReminderSection.tsx`** — Server Component:

Recebe `appointmentId: string` e `userId: string` como props.
- Chama `getAppointmentForReminder(appointmentId, userId)` para buscar os dados.
- Renderiza `<ReminderSectionClient ... />` passando os dados como props.
- Para consultas com status terminal (`completed`, `cancelled`, `no_show`):
  exibe apenas o histórico de lembrete sem botões de ação.
- Para consultas com status `scheduled` ou `confirmed`: exibe a interface completa.

**2. Criar `src/features/reminders/components/ReminderSectionClient.tsx`** — Client Component (`"use client"`):

Recebe as props:
```typescript
type ReminderSectionClientProps = {
  appointmentId: string
  patientEmail: string | null
  latestReminder: ReminderInfo | null
  appointmentStatus: string
}
```

Estados da seção (conforme wireframes da Tela 1 da spec):

**Estado: sem lembrete enviado (`latestReminder === null`):**
- Exibe texto "Nenhum lembrete enviado."
- Botão "Gerar lembrete" — ao clicar, chama `generateReminderToken({ appointmentId })`
- Durante loading: botão desabilitado com spinner

**Estado: lembrete gerado, aguardando resposta (`latestReminder.status === "pending"`):**
- Exibe "Gerado em: [data formatada]"
- Exibe "Status: aguardando resposta do paciente"
- Campo de texto somente leitura com o link truncado (usar `input readOnly className="truncate"`)
- Botão "Copiar link" — ao clicar, copia `latestReminder.link` para clipboard via `navigator.clipboard.writeText()`; muda texto para "Copiado!" por 2 segundos (AC-02)
- Botão "Enviar por e-mail" — visível APENAS se `patientEmail !== null` (AC-06); ao clicar, chama `sendReminderEmail({ appointmentId })`; durante loading: desabilitado com spinner (AC-08)
- Botão "Gerar novo lembrete" — reativa o fluxo de geração (invalida token anterior)
- Toast de sucesso "E-mail enviado com sucesso" após envio (AC-05)
- Toast de erro "Falha ao enviar e-mail. Copie o link e envie manualmente." se Resend falhar (AC-07)

**Estado: paciente confirmou (`latestReminder.status === "confirmed"`):**
- Exibe "Paciente confirmou presença" com a data/hora da confirmação formatada (AC-11)
- Botão "Gerar novo lembrete"

**Estado: paciente cancelou (`latestReminder.status === "cancelled"`):**
- Exibe "Paciente cancelou via link" com a data/hora do cancelamento formatada (AC-12)
- Botão "Gerar novo lembrete"

**Comportamento geral:**
- Após qualquer ação bem-sucedida (`generateReminderToken` ou `sendReminderEmail`),
  chamar `router.refresh()` para recarregar os dados do Server Component pai.
- Usar `useTransition` ou estado local de loading para as ações assíncronas.
- Todos os botões têm mínimo 44x44px de target de toque.
- Nenhum comportamento dependente exclusivamente de hover.

**Integração com o painel de detalhes existente:**
- Editar `src/app/(auth)/appointments/[id]/page.tsx` (ou o componente de detalhes
  da feature `appointments`) para incluir `<ReminderSection appointmentId={id} userId={userId} />`.
- A seção de lembrete deve aparecer APÓS as informações básicas da consulta e
  ANTES das ações de status (conforme wireframe da spec).

**Critérios de aceite desta task:**
- [ ] Seção "Lembrete" exibida no painel de detalhes para consultas com status `scheduled` ou `confirmed`
- [ ] Estado sem lembrete exibe texto "Nenhum lembrete enviado." e botão "Gerar lembrete"
- [ ] Estado com lembrete gerado exibe link somente leitura, botão "Copiar link" e (se paciente tem e-mail) botão "Enviar por e-mail"
- [ ] Botão "Copiar link" muda para "Copiado!" por 2 segundos após clicar (AC-02)
- [ ] Botão "Enviar por e-mail" NÃO aparece quando `patientEmail` é `null` (AC-06)
- [ ] Botão "Enviar por e-mail" fica desabilitado com loading durante submissão (AC-08)
- [ ] Toast de sucesso exibido após envio de e-mail (AC-05)
- [ ] Toast de erro exibido com mensagem exata quando Resend falha (AC-07)
- [ ] Estado "Paciente confirmou presença" com data/hora (AC-11)
- [ ] Estado "Paciente cancelou via link" com data/hora (AC-12)
- [ ] Para consultas com status terminal: seção exibe apenas histórico sem botões de ação
- [ ] Componente funciona em viewport 375px sem scroll horizontal
- [ ] Todos os botões têm target de toque mínimo 44x44px

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

### TASK-07: criar página pública de confirmação /confirm/[token]

- **Status:** todo
- **Dependências:** TASK-05
- **target_path:** projects/agenda-psicologos/src/app/confirm/[token]/
- **Estimativa:** G

**O que fazer:**

Criar a página pública de confirmação de consulta acessada pelo paciente.
Esta rota fica fora do grupo `(auth)` e não requer autenticação (RN-10, AC-23).

**1. Criar `src/app/confirm/[token]/page.tsx`** — Server Component:

```typescript
// Recebe: { params: { token: string }, searchParams: { action?: string } }
```

Lógica:
- Chama `getTokenForConfirmPage(token)`.
- Se retornar erro (`valid: false`): renderizar o estado de erro correspondente
  diretamente no Server Component (sem Client Component — é conteúdo estático):
  - `reason: "not_found"` → "Link inválido." + orientação para contatar o psicólogo (AC-19)
  - `reason: "expired"` → "Este link expirou." + orientação (AC-17)
  - `reason: "used"` com `action: "confirmed"` → "Este link já foi utilizado." + "Você já confirmou sua presença." (AC-18)
  - `reason: "used"` com `action: "cancelled"` → "Este link já foi utilizado." + "Você já cancelou esta consulta." (AC-18)
  - `reason: "appointment_closed"` → "Esta consulta não está mais disponível para confirmação." (AC-20)
- Se retornar `{ valid: true, ... }`:
  - Ler `searchParams.action` e validar se é `"confirmed"` ou `"cancelled"` (ignorar outros valores)
  - Renderizar `<ConfirmPageClient data={data} preselectedAction={action ?? null} />`

**2. Criar `src/features/reminders/components/ConfirmPageClient.tsx`** — Client Component (`"use client"`):

Recebe `data: ConfirmPageData` e `preselectedAction: "confirmed" | "cancelled" | null`.

**Estado inicial — aguardando ação (`preselectedAction === null`):**
- Exibe logo "PsiAgenda" no topo (sem menu de navegação — página isolada)
- Saudação: "Olá, [patient.name]!"
- Bloco de dados da consulta: psicólogo, data por extenso, horário início–fim, modalidade,
  local/link (omitido se null)
- Dois botões de ação: "Confirmar presença" e "Preciso cancelar" (AC-13)

**Estado de cancelamento pendente (`preselectedAction === "cancelled"` OU após clicar "Preciso cancelar"):**
- Tela intermediária de confirmação do cancelamento (AC-15):
  - "Tem certeza que deseja cancelar?"
  - Bloco resumido da consulta (psicólogo, data, horário)
  - Botão "Voltar" (retorna ao estado inicial)
  - Botão "Confirmar cancelamento"

**Ao clicar "Confirmar presença" (ou se `preselectedAction === "confirmed"`):**
- Chamar `POST /api/confirm/[token]` com `{ action: "confirmed" }` via `fetch`
- Durante loading: botão desabilitado
- Após sucesso: exibir tela de sucesso: "Presença confirmada!" + "Até [data formatada às HH:mm]." + "Dra/Dr. [nome] já foi notificada." (AC-14)
- Após erro da API: exibir mensagem de erro e manter os botões

**Ao confirmar cancelamento:**
- Chamar `POST /api/confirm/[token]` com `{ action: "cancelled" }` via `fetch`
- Após sucesso: exibir tela de sucesso: "Cancelamento registrado." + "Sua psicóloga foi notificada. Em caso de dúvidas, entre em contato diretamente com o consultório." (AC-16)

**Nota sobre parâmetro `?action=`:**
Se `preselectedAction === "confirmed"`, pré-preencher e executar a confirmação
automaticamente ao carregar (o usuário chegou diretamente do link no e-mail).
Se `preselectedAction === "cancelled"`, mostrar a tela intermediária de cancelamento
diretamente.

**Elementos obrigatórios:**
- Sem links para login ou cadastro — página isolada (RN-10)
- Sem cookies ou rastreamento além do necessário
- Página responsiva, otimizada para mobile (paciente acessa pelo WhatsApp/e-mail)
- Logo/nome "PsiAgenda" no topo sem menu de navegação

**Critérios de aceite desta task:**
- [ ] Rota `/confirm/[token]` renderiza sem exigir autenticação (AC-23)
- [ ] Token inválido: exibe "Link inválido." sem revelar informação sobre outros tokens (AC-19)
- [ ] Token expirado: exibe "Este link expirou." com orientação (AC-17)
- [ ] Token usado com `action: "confirmed"`: exibe "Você já confirmou sua presença." (AC-18)
- [ ] Token usado com `action: "cancelled"`: exibe "Você já cancelou esta consulta." (AC-18)
- [ ] Consulta fechada: exibe "Esta consulta não está mais disponível para confirmação." sem botões (AC-20)
- [ ] Token válido: exibe dados da consulta com botões "Confirmar presença" e "Preciso cancelar" (AC-13)
- [ ] "Preciso cancelar" abre tela intermediária com botões "Voltar" e "Confirmar cancelamento" (AC-15)
- [ ] Confirmação de presença faz POST para API e exibe tela de sucesso com data/hora (AC-14)
- [ ] Confirmação de cancelamento faz POST para API e exibe tela de sucesso com mensagem correta (AC-16)
- [ ] `?action=confirmed` pré-seleciona e executa a confirmação automaticamente
- [ ] `?action=cancelled` exibe diretamente a tela intermediária
- [ ] Página não exibe links para login ou cadastro
- [ ] Página funciona em viewport 375px sem scroll horizontal
- [ ] Botões têm target de toque mínimo 44x44px

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

### TASK-08: testes de integração do fluxo completo de lembretes

- **Status:** todo
- **Dependências:** TASK-06, TASK-07
- **target_path:** projects/agenda-psicologos/src/features/reminders/
- **Estimativa:** M

**O que fazer:**

Criar testes de integração que cobrem o fluxo completo da feature,
verificando a integração entre queries, actions e a API Route.

Os testes usam Vitest com mocking do Prisma Client (via `vi.mock`) e
do cliente Resend.

**Criar `src/features/reminders/__tests__/reminders.integration.test.ts`:**

Fluxos a cobrir:

**Fluxo 1 — Geração de token pelo psicólogo:**
- Psicólogo autenticado chama `generateReminderToken` para consulta `scheduled`
- Verifica que `appointment_tokens` recebe novo registro com `expiresAt = now+72h`
- Verifica que token anterior ativo é invalidado (expiresAt atualizado para now)
- Verifica que `buildConfirmationLink(token)` retorna URL correta

**Fluxo 2 — Envio de e-mail:**
- Psicólogo chama `sendReminderEmail` para consulta com paciente que tem e-mail
- Verifica que `resend.emails.send` foi chamado com `from`, `to`, `subject` corretos
- Verifica que o `subject` é `"Lembrete: sua consulta com [nome do psicólogo]"`
- Verifica que o e-mail contém link `?action=confirmed` e `?action=cancelled`
- Simular falha do Resend e verificar que erro amigável é lançado

**Fluxo 3 — Confirmação pelo paciente via API Route:**
- POST `/api/confirm/[token]` com `action: "confirmed"` para token válido
- Verifica que `appointment.status` muda para `"confirmed"`
- Verifica que `appointment_tokens.usedAt` e `action` são preenchidos
- Verifica que a transação é atômica (ambas as atualizações ocorrem)

**Fluxo 4 — Cancelamento pelo paciente:**
- POST `/api/confirm/[token]` com `action: "cancelled"` para token válido
- Verifica que `appointment.status` muda para `"cancelled"`
- Verifica que `cancellation_reason` permanece `null`

**Fluxo 5 — Casos de erro da API Route:**
- Token expirado → resposta 410
- Token já usado → resposta 409 com a action já registrada
- Token inexistente → resposta 404
- Consulta com status `completed` → resposta 422

**Fluxo 6 — Autorização:**
- Psicólogo tenta gerar token para consulta de outro psicólogo → erro 404 genérico
- Chamada sem autenticação à Server Action → erro "Não autenticado"

**Critérios de aceite desta task:**
- [ ] Testes de integração cobrem os 6 fluxos descritos
- [ ] Todos os testes passam: `pnpm test`
- [ ] Cobertura das funções em `reminders/actions/` e `reminders/queries/` não é inferior a 80%
- [ ] Casos de borda testados: reenvio (token anterior invalidado), paciente sem e-mail
- [ ] Mocks do Prisma e Resend são limpos entre testes (`beforeEach` / `afterEach`)
- [ ] `pnpm test:coverage` não diminui em relação à task anterior

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
TASK-01 (schema: email em patients + shared/lib/tokens.ts)
  └── TASK-02 (types: schema Zod + tipos TypeScript)
        └── TASK-03 (queries: getLatestReminderForAppointment, getAppointmentForReminder, getTokenForConfirmPage)
              ├── TASK-04 (actions: generateReminderToken + sendReminderEmail)  [paralelo com TASK-05]
              │     └── TASK-06 (ui: ReminderSection no painel do psicólogo)   [sequencial após TASK-04]
              │
              └── TASK-05 (api: POST /api/confirm/[token])                      [paralelo com TASK-04]
                    └── TASK-07 (ui: página pública /confirm/[token])           [sequencial após TASK-05]

TASK-08 (testes de integração) ← depende de TASK-06 e TASK-07 estarem concluídas
```

**Paralelismo disponível:**
- TASK-04 e TASK-05 podem rodar em paralelo — operam em arquivos completamente
  diferentes (actions vs route handler) e nenhuma consome output da outra
- TASK-06 e TASK-07 podem rodar em paralelo após suas respectivas dependências
  (TASK-04 e TASK-05) estarem concluídas — operam em componentes e páginas distintas
- TASK-08 aguarda TASK-06 e TASK-07 para ter todos os artefatos disponíveis para teste

**Ordem crítica:**
- TASK-01 primeiro (migration + utilitário HMAC)
- TASK-02 após TASK-01 (tipos dependem do campo email no Patient)
- TASK-03 após TASK-02 (queries usam os tipos definidos)
- TASK-04 e TASK-05 após TASK-03 (ambas consomem as queries)
- TASK-06 após TASK-04 e TASK-07 após TASK-05
- TASK-08 por último (testa o sistema completo)
```
