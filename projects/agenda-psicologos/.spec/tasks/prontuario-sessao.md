# Tasks — prontuario-sessao

**Feature:** Prontuário Simplificado por Sessão
**Slug:** `prontuario-sessao`
**Criado em:** 2026-04-28
**Status:** aguardando aprovação

---

## Resumo

6 tasks cobrindo as camadas: tipos/schema Zod, queries, Server Actions, UI de criação/visualização/edição, UI de histórico e testes de integração.

O schema Prisma da tabela `session_notes` já está definido no `prisma/schema.prisma` (modelo `SessionNote`) — nenhuma migration nova é necessária. As tasks começam diretamente na camada de tipos e validação.

**Pré-requisitos externos obrigatórios:**
- Feature `autenticacao` implementada — especificamente `autenticacao/TASK-03` que fornece `getCurrentUser()`
- Feature `cadastro-pacientes` implementada — pacientes devem existir no banco
- Feature `agenda-consultas` implementada — consultas com `status = completed` devem existir

---

## Tasks

### TASK-01: criar schema Zod e tipos TypeScript do módulo notes

- **Status:** todo
- **Dependências:** autenticacao/TASK-03
- **target_path:** projects/agenda-psicologos/src/features/notes/
- **Estimativa:** P

**O que fazer:**

Criar os dois arquivos base do módulo `features/notes/`:

**1. `src/features/notes/schema.ts`** — schemas Zod para validação de inputs:

```typescript
import { z } from "zod"

export const SessionNoteFormSchema = z.object({
  appointmentId: z.string().uuid("ID da consulta inválido"),
  content: z
    .string()
    .min(1, "O conteúdo do prontuário é obrigatório")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "O conteúdo do prontuário é obrigatório"),
})

export const UpdateSessionNoteSchema = z.object({
  noteId: z.string().uuid("ID do prontuário inválido"),
  content: z
    .string()
    .min(1, "O conteúdo do prontuário é obrigatório")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "O conteúdo do prontuário é obrigatório"),
})

export const DeleteSessionNoteSchema = z.object({
  noteId: z.string().uuid("ID do prontuário inválido"),
})
```

**2. `src/features/notes/types.ts`** — tipos TypeScript da feature:

```typescript
export type SessionNoteWithContext = {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  appointmentId: string
  userId: string
  appointment: {
    scheduledAt: Date
    durationMinutes: number
    modality: string
    patient: {
      id: string
      name: string
    }
  }
}

export type SessionNoteListItem = {
  id: string
  content: string
  createdAt: Date
  appointment: {
    scheduledAt: Date
  }
}

// Tipo de retorno das Server Actions
export type NoteActionResult =
  | { success: true; noteId: string }
  | { error: string }
```

O tipo `SessionNoteWithContext` é usado nas páginas de criação e visualização.
O tipo `SessionNoteListItem` é usado na listagem de histórico por paciente.
O campo `modality` é `'in_person' | 'online'` — validação de enum é feita em código, não via schema Prisma.

**Critérios de aceite desta task:**
- [ ] `src/features/notes/schema.ts` exporta `SessionNoteFormSchema`, `UpdateSessionNoteSchema` e `DeleteSessionNoteSchema`
- [ ] `SessionNoteFormSchema` rejeita `content` vazio ou composto apenas de espaços em branco
- [ ] `SessionNoteFormSchema` rejeita `appointmentId` que não seja UUID válido
- [ ] `src/features/notes/types.ts` exporta `SessionNoteWithContext`, `SessionNoteListItem` e `NoteActionResult`
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

### TASK-02: criar queries de leitura do módulo notes

- **Status:** todo
- **Dependências:** TASK-01
- **target_path:** projects/agenda-psicologos/src/features/notes/queries/
- **Estimativa:** M

**O que fazer:**

Criar três arquivos de query em `src/features/notes/queries/`. Todas as queries usam o singleton Prisma de `shared/lib/prisma.ts` e obrigatoriamente filtram por `userId` em todas as operações.

**1. `src/features/notes/queries/getSessionNoteByAppointment.ts`:**

```typescript
// Recebe: userId (string), appointmentId (string)
// Retorna: SessionNoteWithContext | null
//
// Operação:
// prisma.sessionNote.findFirst({
//   where: { appointmentId, userId },
//   include: {
//     appointment: {
//       include: { patient: { select: { id: true, name: true } } },
//       select: { scheduledAt: true, durationMinutes: true, modality: true, patient: true }
//     }
//   }
// })
//
// Retorna null se nota não encontrada.
// Usado na página /notes/new para verificar se já existe nota antes de exibir o formulário.
```

**2. `src/features/notes/queries/getSessionNoteById.ts`:**

```typescript
// Recebe: userId (string), noteId (string)
// Retorna: SessionNoteWithContext | null
//
// Operação:
// prisma.sessionNote.findFirst({
//   where: { id: noteId, userId },
//   include: {
//     appointment: {
//       include: { patient: { select: { id: true, name: true } } },
//       select: { scheduledAt: true, durationMinutes: true, modality: true, patient: true }
//     }
//   }
// })
//
// Retorna null se nota não encontrada ou não pertence ao userId.
// A camada de chamada (Server Component ou Action) é responsável por retornar 404 quando null.
// Usado na página /notes/[note_id].
```

**3. `src/features/notes/queries/getPatientSessionNotes.ts`:**

```typescript
// Recebe: userId (string), patientId (string)
// Retorna: SessionNoteListItem[]
//
// Operação:
// prisma.sessionNote.findMany({
//   where: { userId, appointment: { patientId } },
//   select: {
//     id: true,
//     content: true,
//     createdAt: true,
//     appointment: { select: { scheduledAt: true } }
//   },
//   orderBy: { appointment: { scheduledAt: 'desc' } }
// })
//
// A condição `appointment: { patientId }` garante que apenas notas do paciente correto
// são retornadas, combinada com o filtro de userId.
// Usado na página /patients/[patient_id]/notes.
```

**Regras para todas as queries:**
- Nunca instanciar `new PrismaClient()` — usar sempre o singleton de `@/shared/lib/prisma`
- Toda query inclui `userId` no `where` — nunca retornar dados de outro psicólogo
- Sem queries N+1 — relações carregadas com `include` ou `select` aninhado na mesma query

**Critérios de aceite desta task:**
- [ ] `getSessionNoteByAppointment(userId, appointmentId)` retorna `null` quando nota não existe
- [ ] `getSessionNoteByAppointment(userId, appointmentId)` retorna `null` quando `appointmentId` pertence a outro psicólogo
- [ ] `getSessionNoteById(userId, noteId)` retorna `null` quando `noteId` pertence a outro psicólogo (isolamento AC-24)
- [ ] `getPatientSessionNotes(userId, patientId)` retorna lista vazia quando paciente não tem notas
- [ ] `getPatientSessionNotes(userId, patientId)` não retorna notas de pacientes de outro psicólogo
- [ ] Todas as queries carregam `appointment.patient.name` sem query N+1
- [ ] `pnpm typecheck` passa sem erros
- [ ] Testes unitários para cada query: nota encontrada, nota não encontrada, acesso a dado de outro usuário

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

### TASK-03: criar Server Actions createSessionNote, updateSessionNote e deleteSessionNote

- **Status:** todo
- **Dependências:** TASK-02
- **target_path:** projects/agenda-psicologos/src/features/notes/actions/
- **Estimativa:** M

**O que fazer:**

Criar três arquivos de Server Action em `src/features/notes/actions/`. Todos os arquivos começam com `"use server"` e chamam `getCurrentUser()` como primeira operação.

**1. `src/features/notes/actions/createSessionNote.ts`:**

```typescript
"use server"
// Recebe: { appointmentId: string, content: string }
// Retorna: NoteActionResult
//
// Passos:
// 1. const user = await getCurrentUser() — lança erro se não autenticado
// 2. const validated = SessionNoteFormSchema.parse(input) — valida e faz trim do content
// 3. Buscar appointment:
//    prisma.appointment.findFirst({ where: { id: validated.appointmentId, userId: user.id } })
//    - Se null: throw new Error("Consulta não encontrada") → 404 no componente (CE-01, AC-25)
// 4. Se appointment.status !== 'completed':
//    return { error: "Prontuário só pode ser registrado para sessões realizadas" } (RN-01, AC-08, CE-02)
// 5. Verificar unicidade:
//    prisma.sessionNote.findUnique({ where: { appointmentId: validated.appointmentId } })
//    - Se existir: return { success: true, noteId: existingNote.id } — redireciona sem criar (AC-07, CE-03, RN-02)
// 6. Criar nota:
//    prisma.sessionNote.create({
//      data: { appointmentId: validated.appointmentId, userId: user.id, content: validated.content }
//    })
// 7. return { success: true, noteId: newNote.id }
```

**2. `src/features/notes/actions/updateSessionNote.ts`:**

```typescript
"use server"
// Recebe: { noteId: string, content: string }
// Retorna: NoteActionResult
//
// Passos:
// 1. const user = await getCurrentUser()
// 2. const validated = UpdateSessionNoteSchema.parse(input)
// 3. Buscar nota com validação de propriedade:
//    prisma.sessionNote.findFirst({ where: { id: validated.noteId, userId: user.id } })
//    - Se null: throw new Error("Prontuário não encontrado") → 404 no componente (AC-24, CE-04)
// 4. Atualizar nota (Prisma atualiza updatedAt automaticamente via @updatedAt):
//    prisma.sessionNote.update({
//      where: { id: validated.noteId },
//      data: { content: validated.content }
//    })
// 5. return { success: true, noteId: validated.noteId }
```

**3. `src/features/notes/actions/deleteSessionNote.ts`:**

```typescript
"use server"
// Recebe: { noteId: string }
// Retorna: { success: true; appointmentId: string } | { error: string }
//
// Passos:
// 1. const user = await getCurrentUser()
// 2. const validated = DeleteSessionNoteSchema.parse(input)
// 3. Buscar nota para obter o appointmentId (necessário para redirecionar após exclusão):
//    prisma.sessionNote.findFirst({ where: { id: validated.noteId, userId: user.id } })
//    - Se null: throw new Error("Prontuário não encontrado") → 404 no componente (AC-24, CE-04)
// 4. Executar hard delete (sem soft delete conforme RN-04):
//    prisma.sessionNote.delete({ where: { id: validated.noteId } })
// 5. return { success: true, appointmentId: note.appointmentId }
//    — o componente usa appointmentId para redirecionar para a consulta (AC-17)
```

**Regras para todas as actions:**
- A primeira linha de código (após `"use server"`) deve ser `const user = await getCurrentUser()`
- Validação Zod obrigatória antes de qualquer operação de banco
- Erros de "não encontrado" ou "sem permissão" são tratados da mesma forma (404) — não revelar existência de dados alheios
- Erros de banco inesperados são lançados como exceção (capturados pelo Sentry)

**Critérios de aceite desta task:**
- [ ] `createSessionNote` retorna `{ error: "Prontuário só pode ser registrado para sessões realizadas" }` quando `appointment.status !== 'completed'`
- [ ] `createSessionNote` retorna `{ success: true, noteId }` com o ID da nota existente quando já existe nota para o appointment (sem criar duplicata — RN-02)
- [ ] `createSessionNote` retorna 404 (lança erro) quando appointment pertence a outro psicólogo
- [ ] `updateSessionNote` atualiza `content` e o Prisma atualiza `updatedAt` automaticamente
- [ ] `deleteSessionNote` executa hard delete e retorna `appointmentId` para redirecionamento
- [ ] `deleteSessionNote` retorna 404 (lança erro) quando nota pertence a outro psicólogo
- [ ] Todos os arquivos têm `"use server"` como primeira linha
- [ ] Testes unitários cobrem: input inválido (Zod), consulta não completada, nota já existente, nota não encontrada, permissão negada, sucesso
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

### TASK-04: criar página de criação de prontuário (/notes/new)

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/app/(auth)/notes/new/
- **Estimativa:** M

**O que fazer:**

Criar a página de criação do prontuário e seus componentes associados.

**1. `src/app/(auth)/notes/new/page.tsx`** — Server Component:

```typescript
// Props: { searchParams: { appointment?: string } }
//
// Lógica do Server Component:
// 1. const user = await getCurrentUser()
// 2. const appointmentId = searchParams.appointment
//    - Se ausente: notFound() — sem appointment na query string não há contexto
// 3. Buscar o appointment para validar status e exibir contexto:
//    prisma.appointment.findFirst({
//      where: { id: appointmentId, userId: user.id },
//      include: { patient: { select: { id: true, name: true } } }
//    })
//    - Se null: notFound() — não existe ou não pertence ao psicólogo (CE-01)
// 4. Se appointment.status !== 'completed':
//    renderizar <AppointmentNotCompletedError /> com mensagem
//    "Prontuário só pode ser registrado para sessões realizadas" (AC-08, CE-02)
// 5. Verificar se já existe nota para esse appointment:
//    getSessionNoteByAppointment(user.id, appointmentId)
//    - Se existir: redirect(`/notes/${existingNote.id}`) — sem criar duplicata (AC-07, CE-03)
// 6. Renderizar <SessionNoteForm appointment={appointment} /> para criação
```

**2. `src/features/notes/components/SessionNoteForm.tsx`** — Client Component (`"use client"`):

Este componente é usado tanto na criação (sem `note`) quanto na edição (com `note`).

```typescript
// Props:
//   appointment: { id, scheduledAt, durationMinutes, modality, patient: { id, name } }
//   note?: { id, content }  — quando presente, é modo edição
//
// Comportamento:
// - Exibe contexto da sessão como somente leitura: nome do paciente, data por extenso,
//   horário de início e término (calculado: scheduledAt + durationMinutes), modalidade
//   ("Presencial" para in_person, "Online" para online)
// - Campo <textarea> obrigatório para o content, sem limite de caracteres
//   - Sem formatação (plain text) — RN-06
//   - Em modo edição: pré-preenchido com note.content
// - Validação client-side: content não pode ser vazio ou somente espaços (AC-06, AC-14)
//   - Mensagem de erro: "O conteúdo do prontuário é obrigatório" abaixo do campo
// - Botão "Salvar prontuário" (criação) ou "Salvar alterações" (edição)
//   - Desabilitado durante submissão com spinner visível (AC-09)
// - Botão "Cancelar" — navega de volta sem salvar (AC-15)
//   - Em criação: router.push(`/appointments/${appointment.id}`)
//   - Em edição: onCancel() callback
//
// Ao submeter em criação:
//   createSessionNote({ appointmentId: appointment.id, content })
//   - success: router.push(`/notes/${result.noteId}`) + toast "Prontuário registrado com sucesso"
//   - error: toast "Não foi possível salvar o prontuário. Tente novamente." (CE-05)
//            mantém o formulário preenchido (não limpa o content)
//
// Ao submeter em edição:
//   updateSessionNote({ noteId: note.id, content })
//   - success: onSave() callback + toast "Prontuário atualizado"
//   - error: toast "Não foi possível salvar o prontuário. Tente novamente."
//            mantém o formulário preenchido
```

**3. `src/features/notes/components/AppointmentNotCompletedError.tsx`** — componente simples Server Component:
- Exibe mensagem de erro inline: "Prontuário só pode ser registrado para sessões realizadas"
- Botão/link "Voltar para a consulta" que navega para `/appointments/[id]`

**Formatação de data no contexto da sessão (usar `shared/utils/format.ts`):**
- Data por extenso: "Quinta-feira, 24 abr 2026" — usar `Intl.DateTimeFormat` ou `date-fns` (se disponível)
- Horário: "09:00–09:50" — início = `scheduledAt`, fim = `scheduledAt + durationMinutes`
- Modalidade: `in_person` → "Presencial", `online` → "Online"

**Critérios de aceite desta task:**
- [ ] Acessar `/notes/new?appointment=[id-inexistente]` retorna 404
- [ ] Acessar `/notes/new?appointment=[id-de-outro-psicologo]` retorna 404
- [ ] Acessar `/notes/new?appointment=[id-com-status-scheduled]` exibe mensagem de erro "Prontuário só pode ser registrado para sessões realizadas" (sem formulário)
- [ ] Acessar `/notes/new?appointment=[id-completo-com-nota-existente]` redireciona para `/notes/[note_id]` existente
- [ ] Formulário exibe nome do paciente, data por extenso e horário de início–fim como somente leitura
- [ ] Modalidade exibe "Presencial" ou "Online" (não os valores brutos `in_person`/`online`)
- [ ] Submeter com `content` vazio exibe "O conteúdo do prontuário é obrigatório" sem submeter
- [ ] Botão desabilitado com loading durante submissão
- [ ] Após sucesso: redireciona para `/notes/[note_id]` com toast "Prontuário registrado com sucesso"
- [ ] Em caso de erro de servidor: toast de erro exibido, formulário mantém o conteúdo digitado
- [ ] Página funciona em viewport 375px sem scroll horizontal
- [ ] Textarea tem target de toque mínimo 44px de altura inicial

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

### TASK-05: criar página de visualização e edição de prontuário (/notes/[note_id]) e integrar botão na página de detalhes da consulta

- **Status:** todo
- **Dependências:** TASK-04
- **target_path:** projects/agenda-psicologos/src/app/(auth)/notes/[note_id]/
- **Estimativa:** G

**O que fazer:**

Criar a página de visualização/edição do prontuário e integrar os botões de acesso a prontuário na página de detalhes da consulta (`/appointments/[id]`).

**1. `src/app/(auth)/notes/[note_id]/page.tsx`** — Server Component:

```typescript
// Props: { params: { note_id: string } }
//
// Lógica:
// 1. const user = await getCurrentUser()
// 2. getSessionNoteById(user.id, params.note_id)
//    - Se null: notFound() — não existe ou não pertence ao psicólogo (AC-24, CE-04)
// 3. Renderizar <SessionNoteView note={note} />
```

**2. `src/features/notes/components/SessionNoteView.tsx`** — Client Component (`"use client"`):

```typescript
// Props: note: SessionNoteWithContext
//
// Estados: isEditing (boolean, inicia como false)
//
// Estado de visualização (isEditing = false):
// - Header: botão "< Voltar" (router.back()) + botão "Editar" (define isEditing = true)
// - Contexto da sessão: nome do paciente, data por extenso, horário início–fim
// - Metadados: "Registrado em DD/MM/YYYY às HH:MM"
//   Se note.updatedAt > note.createdAt: exibir também "Editado em DD/MM/YYYY às HH:MM"
//   (comparar com tolerância de 1 segundo para evitar falso positivo)
// - Conteúdo: note.content exibido como texto simples
//   Preservar quebras de linha: usar `whitespace-pre-wrap` no Tailwind
// - Rodapé: botão "Excluir prontuário" (abre dialog de confirmação)
//
// Dialog de confirmação de exclusão (usar Dialog do shadcn/ui):
// - Título: "Excluir prontuário?"
// - Texto: "Esta ação não pode ser desfeita. O registro será removido permanentemente."
// - Botão "Cancelar": fecha o dialog (AC-18)
// - Botão "Sim, excluir": chama deleteSessionNote({ noteId: note.id })
//   - success: router.push(`/appointments/${note.appointmentId}`) + toast "Prontuário excluído" (AC-17)
//   - error: toast de erro, fecha dialog
//
// Estado de edição (isEditing = true):
// - Header muda para "Editar Anotação" + botão "< Cancelar edição" (define isEditing = false)
// - Renderizar <SessionNoteForm appointment={note.appointment} note={{ id: note.id, content: note.content }}
//     onSave={() => { setIsEditing(false); router.refresh() }}
//     onCancel={() => setIsEditing(false)} />
//   — router.refresh() recarrega os dados do Server Component para refletir updated_at atualizado
```

**3. Integração na página de detalhes da consulta** — editar o arquivo existente `src/app/(auth)/appointments/[id]/page.tsx` (criado pela feature `agenda-consultas`):

Adicionar uma seção de prontuário condicional baseada no status da consulta e na existência de nota:

```typescript
// Dentro do Server Component da página de detalhes da consulta:
// - Se appointment.status !== 'completed': não exibir nenhuma seção de prontuário (AC-03)
// - Se appointment.status === 'completed':
//   - Buscar nota: getSessionNoteByAppointment(user.id, appointment.id)
//   - Se nota não existe: exibir botão "Registrar prontuário" → link para /notes/new?appointment=[id] (AC-01)
//   - Se nota existe: exibir botão "Ver prontuário" → link para /notes/[note.id] (AC-02)
```

**Nota sobre `router.back()` no botão Voltar:**
- Na página `/notes/[note_id]` o botão Voltar usa `router.back()` — o componente deve ser Client Component para isso.
- Quando não há histórico de navegação disponível (ex: acesso direto via URL), fazer fallback para `router.push('/dashboard')`.

**Critérios de aceite desta task:**
- [ ] Acessar `/notes/[id-inexistente]` retorna 404
- [ ] Acessar `/notes/[id-de-outro-psicologo]` retorna 404
- [ ] Visualização exibe: nome do paciente, data/horário da sessão, data de criação do prontuário, conteúdo
- [ ] Campo "Editado em" é exibido apenas quando `updatedAt > createdAt` (com tolerância de 1 segundo)
- [ ] Quebras de linha do `content` são preservadas na exibição (não colapsadas)
- [ ] Botão "Editar" alterna para modo edição sem navegar para nova rota
- [ ] Cancelar edição volta para modo visualização sem salvar
- [ ] Salvar edição atualiza o conteúdo e retorna para visualização com `updated_at` refletido
- [ ] Dialog de exclusão exibe textos exatos: "Excluir prontuário?" e "Esta ação não pode ser desfeita. O registro será removido permanentemente."
- [ ] Confirmar exclusão remove a nota e redireciona para `/appointments/[id]` com toast "Prontuário excluído"
- [ ] Na página de detalhes da consulta: consulta `completed` sem nota exibe botão "Registrar prontuário"
- [ ] Na página de detalhes da consulta: consulta `completed` com nota exibe botão "Ver prontuário"
- [ ] Na página de detalhes da consulta: consulta `scheduled` ou `confirmed` não exibe nenhum botão de prontuário
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

### TASK-06: criar página de histórico de prontuários do paciente (/patients/[patient_id]/notes)

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/app/(auth)/patients/[patient_id]/notes/
- **Estimativa:** M

**O que fazer:**

Criar a página de histórico de prontuários de um paciente e o componente de listagem. Esta task pode ser implementada em paralelo com TASK-04 e TASK-05, pois opera em arquivos completamente diferentes — depende apenas das queries e actions já criadas em TASK-02 e TASK-03.

**1. `src/app/(auth)/patients/[patient_id]/notes/page.tsx`** — Server Component:

```typescript
// Props: { params: { patient_id: string } }
//
// Lógica:
// 1. const user = await getCurrentUser()
// 2. Verificar que o paciente existe e pertence ao psicólogo:
//    prisma.patient.findFirst({ where: { id: params.patient_id, userId: user.id, deletedAt: null } })
//    - Se null: notFound()
// 3. Buscar prontuários do paciente:
//    getPatientSessionNotes(user.id, params.patient_id)
// 4. Renderizar <PatientNotesList patient={patient} notes={notes} />
```

**2. `src/features/notes/components/PatientNotesList.tsx`** — Server Component (sem interatividade de estado):

```typescript
// Props:
//   patient: { id: string; name: string }
//   notes: SessionNoteListItem[]
//
// Comportamento:
// - Header: botão "< [nome do paciente]" que navega para /patients/[patient.id]
//           + título "Prontuários"
//
// - Se notes.length === 0: exibir estado vazio:
//   "Nenhum prontuário registrado ainda."
//   "Prontuários aparecem aqui após você marcar uma sessão como realizada e registrar as anotações."
//
// - Se notes.length > 0:
//   - Agrupar por ano (extrair o ano de note.appointment.scheduledAt)
//   - Para cada grupo de ano: exibir separador com o ano (ex: "2026")
//   - Para cada nota no grupo (ordenadas por scheduledAt DESC — ordem já vem da query):
//     - Data e horário da sessão: "24 abr 2026 · 09:00"
//     - Preview: primeiros 150 caracteres do content
//       - Remover quebras de linha do início antes de truncar (RN-09)
//       - Se content.length > 150: truncar e adicionar "..."
//     - Link "Ver completo" que navega para /notes/[note.id]
//     - O item inteiro é clicável (link para /notes/[note.id])
//
// - Separador visual entre itens (não entre grupos de ano)
```

**Geração do preview (RN-09) — implementar como utilitário em `shared/utils/format.ts`:**

```typescript
// Adicionar função em src/shared/utils/format.ts:
export function truncateNotePreview(content: string, maxLength = 150): string {
  const trimmed = content.replace(/^\s+/, '') // remove espaços e quebras de linha do início
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.slice(0, maxLength) + '...'
}
```

**Critérios de aceite desta task:**
- [ ] Acessar `/patients/[id-inexistente]/notes` retorna 404
- [ ] Acessar `/patients/[id-de-outro-psicologo]/notes` retorna 404
- [ ] Estado vazio exibe: "Nenhum prontuário registrado ainda." + texto explicativo completo
- [ ] Lista exibe prontuários agrupados por ano com separador visual do ano
- [ ] Preview exibe os primeiros 150 caracteres com "..." se truncado
- [ ] Preview remove espaços e quebras de linha do início do conteúdo antes de truncar
- [ ] Cada item da lista é clicável e navega para `/notes/[note.id]`
- [ ] Botão "< [nome do paciente]" navega para `/patients/[patient.id]`
- [ ] Ordenação é mais recente primeiro (garantida pela query)
- [ ] `truncateNotePreview` tem testes unitários: content curto, content longo, content com quebras no início
- [ ] Página funciona em viewport 375px sem scroll horizontal
- [ ] Área clicável de cada item tem mínimo 44px de altura

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
[autenticacao/TASK-03 — getCurrentUser disponível]
        |
        v
     TASK-01
  (schema Zod + types)
        |
        v
     TASK-02
  (queries de leitura)
        |
        v
     TASK-03
  (Server Actions: create, update, delete)
        |
        ├────────────────────────────────────┐
        v                                    v
     TASK-04                             TASK-06
  (página /notes/new                  (página /patients/[id]/notes
   + SessionNoteForm)                  + PatientNotesList)
        |
        v
     TASK-05
  (página /notes/[note_id]
   + SessionNoteView
   + integração /appointments/[id])
```

**Paralelismo disponível:**
- TASK-04 e TASK-06 podem rodar em paralelo após TASK-03 estar concluída
  - TASK-04 opera em: `src/app/(auth)/notes/new/` e `src/features/notes/components/SessionNoteForm.tsx`
  - TASK-06 opera em: `src/app/(auth)/patients/[patient_id]/notes/` e `src/features/notes/components/PatientNotesList.tsx`
  - Nenhuma das duas cria algo que a outra consome

**Ordem crítica:**
- TASK-01 → TASK-02 → TASK-03 (sequencial obrigatório — cada camada depende da anterior)
- TASK-05 depende de TASK-04 (reutiliza `SessionNoteForm` criado em TASK-04)
- TASK-05 também edita a página de detalhes da consulta — não pode rodar paralelo com TASK-04 pois TASK-04 pode criar/modificar componentes que TASK-05 importa
