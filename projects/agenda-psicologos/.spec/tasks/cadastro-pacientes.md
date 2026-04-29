# Tasks — cadastro-pacientes

**Feature:** Cadastro de Pacientes
**Slug:** `cadastro-pacientes`
**Criado em:** 2026-04-28
**Status:** aguardando aprovação

---

## Resumo

7 tasks cobrindo as camadas: tipos/schema Zod, queries de leitura, Server Actions de mutação, página de listagem com busca e abas, página de perfil do paciente, e formulário de cadastro/edição.

O schema Prisma do modelo `Patient` já está definido em `data-model.md` e será incluído na migration inicial do projeto (não é necessária migration adicional para esta feature). O `getCurrentUser()` já é implementado pela feature `autenticacao` (TASK-03).

---

## Dependências de outra feature

Todas as tasks desta feature dependem que `autenticacao/TASK-03` esteja concluída,
pois utilizam `getCurrentUser()` de `src/features/auth/queries/getCurrentUser.ts`.

---

## Tasks

### TASK-01: criar tipos TypeScript e schema Zod da feature patients

- **Status:** todo
- **Dependências:** autenticacao/TASK-03
- **target_path:** projects/agenda-psicologos/src/features/patients/
- **Estimativa:** P

**O que fazer:**

Criar dois arquivos no módulo `src/features/patients/`:

**1. `src/features/patients/types.ts`**

Exportar os tipos TypeScript usados em toda a feature:

```typescript
export type Patient = {
  id: string
  userId: string
  name: string
  phone: string
  birthDate: Date | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// Projeção usada na listagem (campos mínimos necessários)
export type PatientListItem = Pick<Patient, 'id' | 'name' | 'phone' | 'isActive'>

// Projeção usada no perfil (sem userId e sem deletedAt)
export type PatientProfile = Omit<Patient, 'userId' | 'deletedAt'>

// Tipo retorno de criação/atualização
export type PatientActionResult =
  | { success: true; patientId: string }
  | { error: string }
  | { fieldErrors: Record<string, string[]> }

// Tipo retorno de arquivamento/restauração
export type PatientToggleResult =
  | { success: true }
  | { error: string }
```

**2. `src/features/patients/schema.ts`**

Exportar o schema Zod para criação e edição de paciente:

```typescript
import { z } from "zod"

export const PatientFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .regex(/^\d{10,11}$/, "Telefone inválido. Use o formato 11999999999"),
  birthDate: z.coerce
    .date()
    .max(new Date(), "Data de nascimento não pode ser uma data futura")
    .optional()
    .nullable(),
  emergencyContactName: z.string().max(255).optional().nullable(),
  emergencyContactPhone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido. Use o formato 11999999999")
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    const hasName = !!data.emergencyContactName?.trim()
    const hasPhone = !!data.emergencyContactPhone?.trim()
    return hasName === hasPhone
  },
  {
    message: "Informe também o telefone do contato de emergência",
    path: ["emergencyContactPhone"],
  }
).refine(
  (data) => {
    const hasName = !!data.emergencyContactName?.trim()
    const hasPhone = !!data.emergencyContactPhone?.trim()
    return hasName === hasPhone
  },
  {
    message: "Informe também o nome do contato de emergência",
    path: ["emergencyContactName"],
  }
)

export type PatientFormInput = z.infer<typeof PatientFormSchema>
```

Também definir a constante:

```typescript
// src/features/patients/schema.ts
export const MAX_FREE_PATIENTS = 10
```

**Critérios de aceite desta task:**
- [ ] `src/features/patients/types.ts` exporta `Patient`, `PatientListItem`, `PatientProfile`, `PatientActionResult`, `PatientToggleResult`
- [ ] `src/features/patients/schema.ts` exporta `PatientFormSchema`, `PatientFormInput` e `MAX_FREE_PATIENTS`
- [ ] `PatientFormSchema` rejeita `name` vazio com mensagem "Nome é obrigatório"
- [ ] `PatientFormSchema` rejeita `phone` com menos de 10 ou mais de 11 dígitos com mensagem "Telefone inválido. Use o formato 11999999999"
- [ ] `PatientFormSchema` rejeita `birthDate` futura com mensagem "Data de nascimento não pode ser uma data futura"
- [ ] `PatientFormSchema` rejeita par incompleto de contato de emergência (apenas nome sem telefone, ou apenas telefone sem nome)
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

### TASK-02: criar queries de leitura da feature patients

- **Status:** todo
- **Dependências:** TASK-01
- **target_path:** projects/agenda-psicologos/src/features/patients/queries/
- **Estimativa:** P

**O que fazer:**

Criar quatro arquivos de query em `src/features/patients/queries/`. Todas as queries usam o singleton `prisma` de `src/shared/lib/prisma.ts` e filtram obrigatoriamente por `userId`.

**1. `src/features/patients/queries/getActivePatients.ts`**

```typescript
// Retorna lista de pacientes ativos do psicólogo autenticado.
// Filtra: isActive = true, deletedAt = null
// Ordena: name ASC (alfabética)
// Projeção: PatientListItem (id, name, phone, isActive)
export async function getActivePatients(userId: string): Promise<PatientListItem[]>
```

Implementação com Prisma:
```typescript
return prisma.patient.findMany({
  where: { userId, isActive: true, deletedAt: null },
  select: { id: true, name: true, phone: true, isActive: true },
  orderBy: { name: "asc" },
})
```

**2. `src/features/patients/queries/getArchivedPatients.ts`**

```typescript
// Retorna lista de pacientes arquivados do psicólogo autenticado.
// Filtra: isActive = false, deletedAt = null
// Ordena: name ASC
// Projeção: PatientListItem (id, name, phone, isActive)
export async function getArchivedPatients(userId: string): Promise<PatientListItem[]>
```

**3. `src/features/patients/queries/getPatientById.ts`**

```typescript
// Retorna o perfil completo de um paciente pelo id.
// Filtra: userId obrigatório para isolamento (RN-06).
// Se o paciente não existir OU pertencer a outro userId: retorna null.
// O chamador (page.tsx) deve chamar notFound() se retornar null.
// Projeção: PatientProfile (todos os campos exceto userId e deletedAt)
export async function getPatientById(
  userId: string,
  patientId: string
): Promise<PatientProfile | null>
```

Implementação:
```typescript
return prisma.patient.findFirst({
  where: { id: patientId, userId, deletedAt: null },
  select: {
    id: true, name: true, phone: true, birthDate: true,
    emergencyContactName: true, emergencyContactPhone: true,
    notes: true, isActive: true, createdAt: true, updatedAt: true,
  },
})
```

**4. `src/features/patients/queries/countActivePatients.ts`**

```typescript
// Conta pacientes ativos do psicólogo. Usado nas Server Actions para validar
// limite do plano free antes de criar ou restaurar paciente.
// Filtra: isActive = true, deletedAt = null
export async function countActivePatients(userId: string): Promise<number>
```

Implementação:
```typescript
return prisma.patient.count({
  where: { userId, isActive: true, deletedAt: null },
})
```

**Critérios de aceite desta task:**
- [ ] `getActivePatients` retorna apenas pacientes com `isActive = true` e `deletedAt = null`, ordenados por `name ASC`
- [ ] `getArchivedPatients` retorna apenas pacientes com `isActive = false` e `deletedAt = null`, ordenados por `name ASC`
- [ ] `getPatientById` retorna `null` quando o `patientId` existe mas pertence a outro `userId`
- [ ] `getPatientById` retorna `null` quando o paciente tem `deletedAt` preenchido
- [ ] `countActivePatients` retorna `0` para psicólogo sem pacientes ativos
- [ ] Todas as queries filtram por `userId` sem exceção
- [ ] Testes unitários cobrem: lista vazia, lista com resultados, isolamento por userId, paciente de outro userId
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

### TASK-03: criar Server Actions createPatient, updatePatient, archivePatient e restorePatient

- **Status:** todo
- **Dependências:** TASK-02
- **target_path:** projects/agenda-psicologos/src/features/patients/actions/
- **Estimativa:** M

**O que fazer:**

Criar o arquivo `src/features/patients/actions/patientActions.ts` com as quatro Server Actions da feature. Todas começam com `getCurrentUser()` de `src/features/auth/queries/getCurrentUser.ts`.

**`createPatient(input: PatientFormInput): Promise<PatientActionResult>`**

```
"use server"
1. Chamar getCurrentUser() — lança erro se não autenticado
2. Validar input com PatientFormSchema.parse(input) — lança ZodError se inválido
3. Se user.plan === "free": chamar countActivePatients(user.id)
   - Se count >= MAX_FREE_PATIENTS (10): retornar {
       error: "Você atingiu o limite de 10 pacientes no plano grátis. Arquive um paciente ou faça upgrade para o plano Pro."
     }
4. Criar registro: prisma.patient.create({
     data: {
       userId: user.id,
       name: validated.name,
       phone: validated.phone,
       birthDate: validated.birthDate ?? null,
       emergencyContactName: validated.emergencyContactName ?? null,
       emergencyContactPhone: validated.emergencyContactPhone ?? null,
       notes: validated.notes ?? null,
       isActive: true,
     }
   })
5. Retornar { success: true, patientId: patient.id }
```

**`updatePatient(patientId: string, input: PatientFormInput): Promise<PatientActionResult>`**

```
"use server"
1. Chamar getCurrentUser() — lança erro se não autenticado
2. Validar input com PatientFormSchema.parse(input)
3. Buscar paciente: prisma.patient.findFirst({ where: { id: patientId, userId: user.id, deletedAt: null } })
   - Se não encontrado: retornar { error: "Paciente não encontrado" }
4. Atualizar: prisma.patient.update({
     where: { id: patientId },
     data: { name, phone, birthDate, emergencyContactName, emergencyContactPhone, notes }
   })
5. Retornar { success: true, patientId }
```

**`archivePatient(patientId: string): Promise<PatientToggleResult>`**

```
"use server"
1. Chamar getCurrentUser() — lança erro se não autenticado
2. Buscar paciente: prisma.patient.findFirst({ where: { id: patientId, userId: user.id, deletedAt: null } })
   - Se não encontrado: retornar { error: "Paciente não encontrado" }
3. Atualizar: prisma.patient.update({ where: { id: patientId }, data: { isActive: false } })
4. Retornar { success: true }
```

**`restorePatient(patientId: string): Promise<PatientToggleResult>`**

```
"use server"
1. Chamar getCurrentUser() — lança erro se não autenticado
2. Buscar paciente: prisma.patient.findFirst({ where: { id: patientId, userId: user.id, deletedAt: null } })
   - Se não encontrado: retornar { error: "Paciente não encontrado" }
3. Se user.plan === "free": chamar countActivePatients(user.id)
   - Se count >= MAX_FREE_PATIENTS (10): retornar {
       error: "Limite de pacientes atingido. Arquive outro paciente ou faça upgrade para o plano Pro."
     }
4. Atualizar: prisma.patient.update({ where: { id: patientId }, data: { isActive: true } })
5. Retornar { success: true }
```

**Critérios de aceite desta task:**
- [ ] `createPatient` está em arquivo com `"use server"` no topo
- [ ] `createPatient` retorna erro de limite com a mensagem exata quando plano free tem 10 pacientes ativos
- [ ] `createPatient` não aplica limite para usuário com `plan === "pro"`
- [ ] `updatePatient` retorna `{ error: "Paciente não encontrado" }` quando `patientId` pertence a outro userId
- [ ] `archivePatient` define `isActive = false` sem alterar `deletedAt`
- [ ] `restorePatient` valida limite do plano free antes de reativar
- [ ] `restorePatient` retorna erro de limite com a mensagem exata quando plano free tem 10 pacientes ativos
- [ ] Todas as 4 actions filtram por `userId: user.id` ao buscar o paciente antes de modificar
- [ ] Testes unitários cobrem: autenticação ausente, limite do plano, paciente de outro userId, operação bem-sucedida
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

### TASK-04: criar página de listagem de pacientes (/patients)

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/app/(auth)/patients/
- **Estimativa:** M

**O que fazer:**

Criar a página de listagem com abas "Ativos" e "Arquivados", campo de busca e lista agrupada por letra inicial.

**1. `src/app/(auth)/patients/page.tsx`** — Server Component

- Chamar `getCurrentUser()` para obter o `userId`
- Buscar em paralelo: `getActivePatients(userId)` e `getArchivedPatients(userId)`
- Passar os dados para o Client Component `<PatientsPage />`

```typescript
// page.tsx
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getActivePatients } from "@/features/patients/queries/getActivePatients"
import { getArchivedPatients } from "@/features/patients/queries/getArchivedPatients"
import { PatientsPage } from "@/features/patients/components/PatientsPage"
import { notFound } from "next/navigation"

export default async function Page() {
  const user = await getCurrentUser()
  const [active, archived] = await Promise.all([
    getActivePatients(user.id),
    getArchivedPatients(user.id),
  ])
  return <PatientsPage activePatients={active} archivedPatients={archived} />
}
```

**2. `src/features/patients/components/PatientsPage.tsx`** — Client Component (`"use client"`)

Props: `activePatients: PatientListItem[]`, `archivedPatients: PatientListItem[]`

Comportamento:
- Duas abas: "Ativos (n)" e "Arquivados (n)" — aba ativa por padrão é "Ativos"
- Campo de busca com input `type="search"` e botão limpar (x) que aparece quando há texto digitado
- Busca filtra a lista exibida em tempo real (client-side) por `name` com `includes()` case-insensitive
- Se a lista ativa da aba for vazia E não há texto de busca: exibir estado vazio com mensagem "Nenhum paciente cadastrado ainda" e botão "Adicionar primeiro paciente" que navega para `/patients/new`
- Se busca não retornar resultados: exibir mensagem `Nenhum paciente encontrado para "[termo]"`
- Lista agrupada por letra inicial do nome (separadores alfabéticos, ex: "A", "B", "C")
- Cada item da lista: nome e telefone formatado com máscara `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX`
- Toque no item navega para `/patients/[id]`
- Na aba "Arquivados": cada item exibe botão "Restaurar" inline
  - Ao clicar "Restaurar": abre Dialog de confirmação antes de executar
  - Dialog exibe nome do paciente e botões "Cancelar" e "Restaurar"
  - Após confirmar: chama `restorePatient(patientId)`, exibe toast de sucesso ou erro
- Botão fixo "+ Novo Paciente" no topo direito que navega para `/patients/new`
- Formatação de telefone: usar `src/shared/utils/format.ts` com função `formatPhone(phone: string): string`

**3. `src/shared/utils/format.ts`** — adicionar função `formatPhone`:

```typescript
// Formata string de dígitos para exibição:
// 10 dígitos: (XX) XXXX-XXXX
// 11 dígitos: (XX) XXXXX-XXXX
export function formatPhone(phone: string): string
```

**Critérios de aceite desta task:**
- [ ] Página `/patients` renderiza lista de pacientes ativos por padrão
- [ ] Abas "Ativos (n)" e "Arquivados (n)" exibem contagem correta
- [ ] Busca filtra por nome em tempo real (case-insensitive) ao digitar ao menos 1 caractere
- [ ] Limpar busca restaura a lista completa
- [ ] Estado vazio exibido quando não há pacientes na aba ativa e campo de busca vazio
- [ ] Mensagem "Nenhum paciente encontrado para [termo]" quando busca não retorna resultados
- [ ] Lista agrupada por letra inicial com separadores visíveis
- [ ] Cada item navega para `/patients/[id]` ao tocar
- [ ] Botão "Restaurar" na aba Arquivados abre Dialog de confirmação
- [ ] Após restaurar com sucesso: toast "Paciente reativado com sucesso"
- [ ] Página funciona em viewport 375px sem scroll horizontal
- [ ] `pnpm build` passa sem erros

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

### TASK-05: criar página de perfil do paciente (/patients/[id])

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/app/(auth)/patients/[id]/
- **Estimativa:** M

**O que fazer:**

Criar a página de perfil do paciente com dados pessoais, contato de emergência, observações e botão de arquivamento.

**1. `src/app/(auth)/patients/[id]/page.tsx`** — Server Component

- Chamar `getCurrentUser()` para obter `userId`
- Chamar `getPatientById(userId, params.id)`
- Se retornar `null`: chamar `notFound()` do Next.js (retorna 404 — não expõe que o paciente pertence a outro usuário, conforme AC-26)
- Passar `patient: PatientProfile` para o Client Component `<PatientProfilePage />`

**2. `src/features/patients/components/PatientProfilePage.tsx`** — Client Component (`"use client"`)

Props: `patient: PatientProfile`

Layout conforme wireframe (Tela 3 da spec):
- Header: botão `<- Pacientes` que navega para `/patients`, nome do paciente centralizado, botão "Editar" que navega para `/patients/[id]/edit`
- Seção "Dados pessoais":
  - Telefone formatado com `formatPhone(patient.phone)` — sempre exibido
  - Data de nascimento: exibida apenas se `patient.birthDate` não for null, formato `DD/MM/AAAA`, com idade calculada dinamicamente: `(N anos)`. Cálculo: diferença entre data atual e `birthDate` em anos completos
- Seção "Contato de emergência": exibida apenas se `emergencyContactName` OR `emergencyContactPhone` estiver preenchido. Mostra nome e telefone formatado
- Seção "Observações gerais": exibida apenas se `patient.notes` não for null/vazio. Exibe o texto preservando quebras de linha
- Link "Ver consultas deste paciente →" que navega para `/appointments?patient=[patient.id]`
- Botão "Arquivar paciente" no rodapé — ao clicar abre `<ArchivePatientDialog />`

**3. `src/features/patients/components/ArchivePatientDialog.tsx`** — Client Component

Props: `patientId: string`, `patientName: string`, `onArchived: () => void`

- Dialog de confirmação com texto: "[patientName] será removida da sua lista ativa. O histórico de consultas e prontuário será preservado."
- Botões: "Cancelar" e "Sim, arquivar"
- Ao confirmar: chama `archivePatient(patientId)`, exibe toast "Paciente arquivado. Você pode restaurá-lo a qualquer momento." e navega para `/patients` com `router.push("/patients")`
- Se `archivePatient` retornar `{ error }`: exibe toast de erro com a mensagem

**Cálculo de idade** (lógica pura, sem side effects):

```typescript
// src/shared/utils/format.ts — adicionar função:
export function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
```

**Critérios de aceite desta task:**
- [ ] Página `/patients/[id]` retorna 404 (via `notFound()`) quando o paciente não pertence ao userId autenticado
- [ ] Telefone exibido com máscara de formatação
- [ ] Data de nascimento exibida com idade calculada dinamicamente quando preenchida
- [ ] Seção "Contato de emergência" não aparece quando ambos os campos são null
- [ ] Seção "Observações gerais" não aparece quando `notes` é null ou vazio
- [ ] Botão "Arquivar paciente" abre Dialog de confirmação antes de executar
- [ ] Após arquivar: toast "Paciente arquivado. Você pode restaurá-lo a qualquer momento." e redirecionamento para `/patients`
- [ ] Link "Ver consultas deste paciente" navega para `/appointments?patient=[id]`
- [ ] Página funciona em viewport 375px sem scroll horizontal
- [ ] `pnpm build` passa sem erros

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

### TASK-06: criar formulário de cadastro (/patients/new) e edição (/patients/[id]/edit)

- **Status:** todo
- **Dependências:** TASK-03
- **target_path:** projects/agenda-psicologos/src/app/(auth)/patients/
- **Estimativa:** G

**O que fazer:**

Criar as páginas de cadastro e edição de paciente, compartilhando um único componente de formulário.

**1. `src/app/(auth)/patients/new/page.tsx`** — Server Component

- Chamar `getCurrentUser()` para obter o `userId` e `plan`
- Contar pacientes ativos: `countActivePatients(userId)`
- Passar `isAtLimit: boolean` (true se `plan === "free"` E count >= `MAX_FREE_PATIENTS`) e modo `"create"` para `<PatientFormPage />`

```typescript
export default async function Page() {
  const user = await getCurrentUser()
  const count = await countActivePatients(user.id)
  const isAtLimit = user.plan === "free" && count >= MAX_FREE_PATIENTS
  return <PatientFormPage mode="create" isAtLimit={isAtLimit} />
}
```

**2. `src/app/(auth)/patients/[id]/edit/page.tsx`** — Server Component

- Chamar `getCurrentUser()` para obter `userId`
- Chamar `getPatientById(userId, params.id)` — se `null`, chamar `notFound()`
- Passar `patient`, modo `"edit"` e `isAtLimit: false` para `<PatientFormPage />`

**3. `src/features/patients/components/PatientFormPage.tsx`** — Client Component (`"use client"`)

Props:
```typescript
type Props = {
  mode: "create" | "edit"
  isAtLimit: boolean
  patient?: PatientProfile  // apenas no modo "edit"
}
```

Layout conforme wireframe (Tela 2 da spec):
- Header: botão `<- Voltar` que navega para `/patients`, título "Novo Paciente" (create) ou "Editar Paciente" (edit)
- Banner de limite (exibido no topo do formulário se `isAtLimit === true`):
  - Texto: "Você atingiu o limite de 10 pacientes no plano grátis. Arquive um paciente ou faça upgrade para o plano Pro."
  - Botão "Fazer upgrade" que navega para `/settings` (ou URL de checkout — a ser definido na feature billing)
  - Quando `isAtLimit === true`, o botão de submit fica desabilitado
- Campos do formulário controlados com `react-hook-form` + `zodResolver(PatientFormSchema)`:
  - `name` — `type="text"`, obrigatório, label "Nome *"
  - `phone` — `type="tel"`, obrigatório, label "Telefone (WhatsApp) *", hint "Formato: 11999999999 (somente números)"
  - `birthDate` — `type="date"`, opcional, label "Data de nascimento"
  - `notes` — `<textarea>`, opcional, label "Observações gerais"
  - `emergencyContactName` — `type="text"`, opcional, label "Nome do contato"
  - `emergencyContactPhone` — `type="tel"`, opcional, label "Telefone do contato"
- Modo "edit": formulário pré-preenchido com os dados de `patient`
- Ao submeter:
  - Modo "create": chama `createPatient(data)`. Se `{ success: true }`: toast "Paciente [nome] cadastrado com sucesso" e navega para `/patients`. Se `{ error }`: exibe alerta com a mensagem de erro
  - Modo "edit": chama `updatePatient(patient.id, data)`. Se `{ success: true }`: toast "Dados de [nome] atualizados com sucesso" e navega para `/patients/[patient.id]`. Se `{ error }`: exibe alerta com a mensagem de erro
- Durante submissão: botão "Salvar paciente" desabilitado com spinner (AC-15)
- Botão "Cancelar" navega para `/patients` (create) ou `/patients/[id]` (edit) sem salvar
- Erros de validação inline: exibidos abaixo de cada campo com as mensagens exatas do `PatientFormSchema`
- Campos de formulário usam `type="tel"` para telefones (mobile-first)
- Todos os inputs têm `<label>` com `htmlFor` e o campo tem o `id` correspondente (acessibilidade)
- Erros de campo anunciados via `aria-describedby` apontando para elemento com a mensagem de erro

**Critérios de aceite desta task:**
- [ ] Página `/patients/new` exibe banner de limite quando `isAtLimit = true` e bloqueia o submit
- [ ] Página `/patients/[id]/edit` pré-preenche o formulário com os dados atuais do paciente
- [ ] Submissão em modo "create" chama `createPatient` e exibe toast com nome do paciente
- [ ] Submissão em modo "edit" chama `updatePatient` e exibe toast com nome do paciente
- [ ] Erros inline exibidos com mensagens exatas: "Nome é obrigatório", "Telefone é obrigatório", "Telefone inválido. Use o formato 11999999999", "Data de nascimento não pode ser uma data futura"
- [ ] Erro de par incompleto de contato de emergência exibido no campo correspondente
- [ ] Botão submit desabilitado com spinner durante submissão (previne duplo envio)
- [ ] Botão "Cancelar" navega para página anterior sem salvar
- [ ] Formulário funciona em viewport 375px sem scroll horizontal
- [ ] Campos de telefone usam `type="tel"`
- [ ] `pnpm build` passa sem erros

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

### TASK-07: testes de integração da feature patients

- **Status:** todo
- **Dependências:** TASK-04, TASK-05, TASK-06
- **target_path:** projects/agenda-psicologos/src/features/patients/
- **Estimativa:** M

**O que fazer:**

Criar testes de integração cobrindo os fluxos completos da feature. Usar Vitest com mocks do Prisma Client (`src/shared/lib/prisma.ts`) e mock de `getCurrentUser`.

**Arquivos a criar:**

**1. `src/features/patients/actions/patientActions.test.ts`**

Cobrir os seguintes cenários com testes unitários/integração das Server Actions:

- `createPatient`:
  - Criação bem-sucedida com campos obrigatórios preenchidos
  - Criação bem-sucedida com todos os campos preenchidos (inclusive opcionais)
  - Erro quando `name` está vazio
  - Erro quando `phone` tem formato inválido (ex: 9 dígitos)
  - Erro quando `birthDate` é uma data futura
  - Erro quando apenas `emergencyContactName` é preenchido sem `emergencyContactPhone`
  - Erro quando apenas `emergencyContactPhone` é preenchido sem `emergencyContactName`
  - Erro de limite do plano free quando `countActivePatients` retorna 10
  - Criação bem-sucedida para plano pro mesmo com 10+ pacientes ativos (sem limite)
  - Lança erro "Não autenticado" quando `getCurrentUser()` lança erro

- `updatePatient`:
  - Atualização bem-sucedida com dados válidos
  - Erro quando `patientId` pertence a outro userId (mock retorna null na busca)
  - Mesmas validações de input que `createPatient`

- `archivePatient`:
  - Arquivamento bem-sucedido — verifica que `isActive` foi definido como `false`
  - Erro quando `patientId` não encontrado para o userId

- `restorePatient`:
  - Restauração bem-sucedida quando plano free com menos de 10 ativos
  - Erro de limite quando plano free com 10 ativos
  - Restauração bem-sucedida para plano pro independente da contagem

**2. `src/features/patients/queries/patients.test.ts`**

Cobrir:

- `getActivePatients`: retorna lista vazia, retorna apenas pacientes ativos do userId, não retorna pacientes de outro userId
- `getArchivedPatients`: retorna apenas arquivados do userId
- `getPatientById`: encontrado, não encontrado, pertencente a outro userId
- `countActivePatients`: retorna 0, retorna contagem correta

**3. `src/shared/utils/format.test.ts`**

Cobrir:

- `formatPhone`: 10 dígitos → `(XX) XXXX-XXXX`, 11 dígitos → `(XX) XXXXX-XXXX`
- `calculateAge`: idade correta para datas passadas, ajuste correto para aniversário ainda não ocorrido no ano corrente

**Critérios de aceite desta task:**
- [ ] Todos os cenários listados têm ao menos um teste correspondente
- [ ] Testes de actions mockam `prisma` e `getCurrentUser` — sem acesso real ao banco
- [ ] Testes de queries mockam `prisma` — sem acesso real ao banco
- [ ] `pnpm test` passa sem falha
- [ ] `pnpm test:coverage` não exibe cobertura menor que a task anterior
- [ ] Nenhum teste com `it.only`, `test.only` ou `describe.only` no código commitado

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
autenticacao/TASK-03 (getCurrentUser — pré-requisito externo)
  └── TASK-01 — tipos/schema: PatientFormSchema + tipos TypeScript
        └── TASK-02 — queries: getActivePatients, getArchivedPatients, getPatientById, countActivePatients
              └── TASK-03 — actions: createPatient, updatePatient, archivePatient, restorePatient
                    ├── TASK-04 — ui: página /patients (listagem + abas + busca + restaurar)   ← paralelo com TASK-05 e TASK-06
                    ├── TASK-05 — ui: página /patients/[id] (perfil + arquivar)                ← paralelo com TASK-04 e TASK-06
                    └── TASK-06 — ui: formulário /patients/new e /patients/[id]/edit           ← paralelo com TASK-04 e TASK-05
                          └── TASK-07 — testes: integração de actions, queries e utils         ← após TASK-04, TASK-05 e TASK-06
```

**Paralelismo disponível:**

- TASK-04, TASK-05 e TASK-06 podem rodar em paralelo após TASK-03 — cada uma opera em rotas e componentes distintos sem dependência entre si
- TASK-07 aguarda TASK-04, TASK-05 e TASK-06 (testa o sistema completo)

**Ordem crítica:**

- TASK-01 primeiro (tipos e schema base para tudo)
- TASK-02 depende de TASK-01 (queries usam os tipos)
- TASK-03 depende de TASK-02 (actions usam as queries)
- TASK-07 é sempre a última (testa integração entre todas as camadas)
```
