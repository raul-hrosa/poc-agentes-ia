# Data Model — PsiAgenda

> Definido em: 2026-04-27
> Banco: MySQL 8.0 via Docker
> ORM: Prisma 5.14+
> Multi-tenancy: isolamento por `user_id` na camada de aplicação

---

## Visão geral das entidades

```
users (psicólogos)
  │
  ├── patients (1:N)
  │     │
  │     └── appointments (1:N) ──────┬── appointment_tokens (1:N)
  │                                   │
  │                                   ├── session_notes (1:1)
  │                                   │
  │                                   └── session_payments (1:1)
  │
  └── subscriptions (1:1)
        │
        └── subscription_plans (N:1)
```

---

## Multi-tenancy

**Estratégia:** Isolamento por `user_id` em banco compartilhado, aplicado na camada de aplicação.

Cada psicólogo é um `user`. Todas as tabelas de dados clínicos contêm
`user_id VARCHAR(36) NOT NULL REFERENCES users(id)`, que é o ID do psicólogo dono dos dados.

**Mecanismo de isolamento:** Toda query no Prisma inclui obrigatoriamente `where: { userId }`.
Não há mecanismo de banco que force isso — é uma convenção de código verificada em review.
Toda Server Action começa com `getCurrentUser()` e passa `userId` explicitamente para a query.

**Exceção:** Tabela `appointment_tokens` é acessível sem autenticação para validação
de token por pacientes (acesso público somente leitura por token específico, via API route).

---

## Soft delete

**Política:** Apenas `patients` e `appointments` usam soft delete via `deleted_at`.

**Motivo:** Psicólogos precisam arquivar pacientes sem perder histórico de prontuário.
Consultas canceladas devem aparecer no histórico financeiro como "cancelada".

Todas as outras tabelas usam hard delete — prontuário deletado é deletado de fato
(o psicólogo tem controle total conforme LGPD).

---

## Entidades

### `users`

Representa o psicólogo (usuário do sistema). Sincronizado com `auth.users` do Supabase.

```sql
id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()

-- dados do profissional
email           text        NOT NULL UNIQUE
name            text        NOT NULL
crp             text                          -- CRP do psicólogo (ex: "06/123456")
phone           text                          -- telefone para contato
timezone        text        NOT NULL DEFAULT 'America/Sao_Paulo'
avatar_url      text

-- plano
plan            text        NOT NULL DEFAULT 'free'  -- 'free' | 'pro'
plan_expires_at timestamptz                           -- null = free permanente
```

**Índices:**
- `UNIQUE (email)` — login por e-mail, unicidade necessária

**Nota:** `id` é o mesmo UUID gerado pelo Supabase Auth para `auth.users`. O `user_id`
em todas as tabelas filhas referencia este ID.

---

### `patients`

Pacientes cadastrados pelo psicólogo.

```sql
id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
deleted_at      timestamptz                           -- soft delete

user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE

-- dados do paciente
name            text        NOT NULL
phone           text        NOT NULL                  -- WhatsApp (ex: "11999999999")
birth_date      date                                  -- opcional, LGPD: dado sensível
emergency_contact_name  text                          -- opcional
emergency_contact_phone text                          -- opcional
notes           text                                  -- observações gerais (não prontuário)

-- controle
is_active       boolean     NOT NULL DEFAULT true     -- arquivado ou ativo
```

**Índices:**
- `INDEX (user_id)` — toda query de paciente filtra por psicólogo
- `INDEX (user_id, deleted_at)` — listagem de pacientes ativos/arquivados
- `INDEX (user_id, is_active)` — filtragem rápida por status

**Limite de negócio (aplicado em código):**
- Plano free: máximo 10 pacientes com `is_active = true` e `deleted_at IS NULL`
- Verificado em Server Action antes de criar novo paciente

---

### `appointments`

Consultas agendadas pelo psicólogo.

```sql
id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
deleted_at      timestamptz                           -- soft delete (consultas canceladas mantêm registro)

user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE
patient_id      uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE

-- dados da consulta
scheduled_at    timestamptz NOT NULL                  -- data e hora da consulta
duration_minutes int        NOT NULL DEFAULT 50       -- duração em minutos
modality        text        NOT NULL DEFAULT 'in_person'  -- 'in_person' | 'online'
location        text                                  -- endereço ou link videochamada
status          text        NOT NULL DEFAULT 'scheduled'
                                                      -- 'scheduled' | 'confirmed' | 'completed'
                                                      -- | 'cancelled' | 'no_show'
cancellation_reason text                              -- preenchido quando status = 'cancelled'
```

**Índices:**
- `INDEX (user_id, scheduled_at)` — visualização de agenda (semanal/diária)
- `INDEX (user_id, status)` — filtragem por status
- `INDEX (patient_id)` — histórico de consultas por paciente
- `INDEX (user_id, scheduled_at, deleted_at)` — agenda sem cancelados arquivados

**Nota sobre status:**
- `scheduled` → criado, sem resposta do paciente
- `confirmed` → paciente confirmou via link
- `completed` → psicólogo marcou como realizada
- `cancelled` → paciente cancelou via link OU psicólogo cancelou
- `no_show` → psicólogo marcou como falta sem aviso

---

### `appointment_tokens`

Tokens de uso único para confirmação de consulta pelo paciente.

```sql
id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
created_at      timestamptz NOT NULL DEFAULT now()

appointment_id  uuid        NOT NULL REFERENCES appointments(id) ON DELETE CASCADE

-- token
token           text        NOT NULL UNIQUE           -- HMAC-SHA256 hex string
expires_at      timestamptz NOT NULL                  -- padrão: created_at + 72 horas
used_at         timestamptz                           -- null = não usado ainda
action          text                                  -- 'confirmed' | 'cancelled' (preenchido ao usar)
```

**Índices:**
- `UNIQUE (token)` — lookup por token deve ser único e rápido (O(1))
- `INDEX (appointment_id)` — verificar se consulta já tem token ativo

**Regras de negócio (aplicadas em código):**
- Token expirado (`expires_at < now()`) é inválido
- Token usado (`used_at IS NOT NULL`) é inválido
- Uma consulta pode ter múltiplos tokens (reenvio de lembrete), mas apenas
  o mais recente não expirado é válido

---

### `session_notes`

Prontuário simplificado por sessão, vinculado a uma consulta realizada.

```sql
id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()

user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE
appointment_id  uuid        NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE
                                                      -- UNIQUE: uma nota por consulta

-- conteúdo
content         text        NOT NULL                  -- texto livre, sem limite definido
```

**Índices:**
- `UNIQUE (appointment_id)` — uma nota por consulta (constraint + lookup)
- `INDEX (user_id, appointment_id)` — histórico por psicólogo

**Conformidade CFP/LGPD:**
- RLS garante que apenas o psicólogo dono (`user_id`) acessa suas notas
- Conteúdo é texto livre sem estrutura — conforme orientação de produto
- Hard delete: prontuário excluído pelo psicólogo é removido definitivamente

---

### `session_payments`

Registro de pagamento por sessão realizada.

```sql
id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()

user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE
appointment_id  uuid        NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE
                                                      -- UNIQUE: um registro por consulta

-- valores
amount_cents    int         NOT NULL                  -- valor em centavos (ex: 15000 = R$ 150,00)
status          text        NOT NULL DEFAULT 'pending'  -- 'pending' | 'paid'
paid_at         timestamptz                           -- data do pagamento (preenchida ao marcar como pago)
payment_method  text                                  -- 'pix' | 'cash' | 'card' | 'transfer' (opcional)
notes           text                                  -- observações (ex: "paciente pagou metade")
```

**Índices:**
- `UNIQUE (appointment_id)` — um registro de pagamento por consulta
- `INDEX (user_id, status)` — resumo financeiro (sessões pendentes vs pagas)
- `INDEX (user_id, paid_at)` — relatório mensal filtrado por mês

**Nota:** `amount_cents` armazena valor em centavos (inteiro) para evitar problemas
de arredondamento com float. R$ 150,00 = 15000 centavos.

---

### `subscriptions`

Assinatura do psicólogo no plano profissional. Um registro por usuário.

```sql
id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()

user_id             uuid        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE

-- Stripe
stripe_customer_id      text    NOT NULL UNIQUE
stripe_subscription_id  text    UNIQUE                -- null = free (sem assinatura ativa)
stripe_price_id         text                          -- ID do price no Stripe

-- status
status              text        NOT NULL DEFAULT 'inactive'
                                                      -- 'active' | 'inactive' | 'past_due' | 'cancelled'
current_period_start timestamptz
current_period_end   timestamptz
cancelled_at        timestamptz
```

**Índices:**
- `UNIQUE (user_id)` — um registro de assinatura por psicólogo
- `UNIQUE (stripe_customer_id)` — lookup por evento de webhook Stripe
- `UNIQUE (stripe_subscription_id)` — lookup por evento de webhook Stripe

---

## Relações — diagrama detalhado

```
users (1) ──────────────────── (N) patients
users (1) ──────────────────── (N) appointments
users (1) ──────────────────── (1) subscriptions
users (1) ──────────────────── (N) session_notes    [via user_id, denormalizado para RLS]
users (1) ──────────────────── (N) session_payments [via user_id, denormalizado para RLS]

patients (1) ────────────────── (N) appointments

appointments (1) ──────────────── (N) appointment_tokens
appointments (1) ──────────────── (0..1) session_notes     [UNIQUE constraint]
appointments (1) ──────────────── (0..1) session_payments  [UNIQUE constraint]
```

**Por que `user_id` em `session_notes` e `session_payments` se já existe via `appointments`?**
Para RLS: policies RLS precisam de `user_id` direto na tabela para funcionar eficientemente,
sem joins. Isso é um trade-off documentado intencional. Ver ADR `user-id-denormalizacao-rls.md`.

---

## Schema Prisma (referência)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(uuid()) @db.VarChar(36)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  email          String    @unique @db.VarChar(255)
  name           String    @db.VarChar(255)
  password       String    @db.VarChar(255)             // bcrypt hash
  crp            String?   @db.VarChar(20)
  phone          String?   @db.VarChar(20)
  timezone       String    @default("America/Sao_Paulo") @db.VarChar(50)
  avatarUrl      String?   @map("avatar_url") @db.VarChar(500)
  plan           String    @default("free") @db.VarChar(10)
  planExpiresAt  DateTime? @map("plan_expires_at")

  patients        Patient[]
  appointments    Appointment[]
  sessionNotes    SessionNote[]
  sessionPayments SessionPayment[]
  subscription    Subscription?

  @@map("users")
}

model Patient {
  id                    String    @id @default(uuid()) @db.VarChar(36)
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  deletedAt             DateTime? @map("deleted_at")
  userId                String    @map("user_id") @db.VarChar(36)
  name                  String    @db.VarChar(255)
  phone                 String    @db.VarChar(20)
  birthDate             DateTime? @map("birth_date") @db.Date
  emergencyContactName  String?   @map("emergency_contact_name") @db.VarChar(255)
  emergencyContactPhone String?   @map("emergency_contact_phone") @db.VarChar(20)
  notes                 String?   @db.Text
  isActive              Boolean   @default(true) @map("is_active")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments Appointment[]

  @@index([userId])
  @@index([userId, deletedAt])
  @@index([userId, isActive])
  @@map("patients")
}

model Appointment {
  id                 String    @id @default(uuid()) @db.VarChar(36)
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")
  deletedAt          DateTime? @map("deleted_at")
  userId             String    @map("user_id") @db.VarChar(36)
  patientId          String    @map("patient_id") @db.VarChar(36)
  scheduledAt        DateTime  @map("scheduled_at")
  durationMinutes    Int       @default(50) @map("duration_minutes")
  modality           String    @default("in_person") @db.VarChar(20)
  location           String?   @db.VarChar(500)
  status             String    @default("scheduled") @db.VarChar(20)
  cancellationReason String?   @map("cancellation_reason") @db.Text

  user           User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  patient        Patient            @relation(fields: [patientId], references: [id], onDelete: Cascade)
  tokens         AppointmentToken[]
  sessionNote    SessionNote?
  sessionPayment SessionPayment?

  @@index([userId, scheduledAt])
  @@index([userId, status])
  @@index([patientId])
  @@map("appointments")
}

model AppointmentToken {
  id            String    @id @default(uuid()) @db.VarChar(36)
  createdAt     DateTime  @default(now()) @map("created_at")
  appointmentId String    @map("appointment_id") @db.VarChar(36)
  token         String    @unique @db.VarChar(64)
  expiresAt     DateTime  @map("expires_at")
  usedAt        DateTime? @map("used_at")
  action        String?   @db.VarChar(20)

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@index([appointmentId])
  @@map("appointment_tokens")
}

model SessionNote {
  id            String   @id @default(uuid()) @db.VarChar(36)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  userId        String   @map("user_id") @db.VarChar(36)
  appointmentId String   @unique @map("appointment_id") @db.VarChar(36)
  content       String   @db.Text

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@map("session_notes")
}

model SessionPayment {
  id            String    @id @default(uuid()) @db.VarChar(36)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  userId        String    @map("user_id") @db.VarChar(36)
  appointmentId String    @unique @map("appointment_id") @db.VarChar(36)
  amountCents   Int       @map("amount_cents")
  status        String    @default("pending") @db.VarChar(20)
  paidAt        DateTime? @map("paid_at")
  paymentMethod String?   @map("payment_method") @db.VarChar(20)
  notes         String?   @db.Text

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, paidAt])
  @@map("session_payments")
}

model Subscription {
  id                   String    @id @default(uuid()) @db.VarChar(36)
  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")
  userId               String    @unique @map("user_id") @db.VarChar(36)
  stripeCustomerId     String    @unique @map("stripe_customer_id") @db.VarChar(255)
  stripeSubscriptionId String?   @unique @map("stripe_subscription_id") @db.VarChar(255)
  stripePriceId        String?   @map("stripe_price_id") @db.VarChar(255)
  status               String    @default("inactive") @db.VarChar(20)
  currentPeriodStart   DateTime? @map("current_period_start")
  currentPeriodEnd     DateTime? @map("current_period_end")
  cancelledAt          DateTime? @map("cancelled_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}
```

---

## Estratégia de migrations

- **Ferramenta:** Prisma Migrate
- **Comando de criação:** `pnpm db:migrate` (dev — cria migration + aplica)
- **Comando de produção:** `pnpm db:migrate:deploy` (aplica migrations pendentes sem criar novas)
- **Convenção de nome:** gerado automaticamente pelo Prisma (`YYYYMMDDHHMMSS_descricao`)
- **Down migrations:** não obrigatórias no MVP — Prisma não gera automaticamente;
  reversão é feita criando nova migration se necessário
- **Seeds:** `prisma/seed.ts` cria 1 psicólogo de desenvolvimento com 3 pacientes
  e 5 consultas em estados variados para facilitar desenvolvimento local

---

## Enums (implementados como `text` com validação em código)

Prisma Enums geram tipos no banco que dificultam migrations futuras.
Usamos `text` com validação Zod nos schemas de aplicação.

| Campo | Valores válidos |
|---|---|
| `appointments.status` | `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show` |
| `appointments.modality` | `in_person`, `online` |
| `session_payments.status` | `pending`, `paid` |
| `session_payments.payment_method` | `pix`, `cash`, `card`, `transfer` |
| `subscriptions.status` | `active`, `inactive`, `past_due`, `cancelled` |
| `users.plan` | `free`, `pro` |
| `appointment_tokens.action` | `confirmed`, `cancelled` |
