# TechSpec — PsiClínica

## Stack Decisão

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|--------------|
| Frontend | Next.js (App Router) | 14+ | SSR + RSC para render inicial; sem Server Actions — só UI |
| Estilo | Tailwind CSS + shadcn/ui | latest | Design system acessível, componentes prontos (Calendar, Dialog, Tabs) |
| Linguagem | TypeScript | strict | Tipos compartilhados entre frontend e backend via pacote `@psiclinica/types` |
| Backend | NestJS | 10+ | Framework estruturado, modular, decorators, DI nativa — ideal para domínio complexo |
| ORM | TypeORM | 0.3+ | Integração nativa com NestJS; migrations controladas; suporte completo ao MySQL |
| Banco | MySQL | 8.0+ | ACID, transações confiáveis, FULLTEXT nativo para busca de pacientes |
| Auth | JWT (RS256) + Refresh Token | — | Access token (15 min) + refresh token (30 dias) em httpOnly cookie |
| Storage | Cloudflare R2 | — | S3-compatível, sem egress fee, SDK AWS SDK v3 funciona direto |
| E-mail | Resend | — | DX superior, bom deliverability, SDK TypeScript |
| PDF | Puppeteer (server-side) | — | Renderiza HTML/CSS para PDF via NestJS; melhor fidelidade visual que react-pdf |
| Editor rico | Tiptap | — | Extensível; exporta JSON/HTML para armazenar e renderizar |
| Jobs agendados | @nestjs/schedule + BullMQ | — | Cron jobs NestJS + fila Redis para lembretes confiáveis com retry |
| Fila / cache | Upstash Redis | — | Serverless Redis; usado pelo BullMQ e rate limiting |
| Pagamentos | Stripe | — | Padrão de mercado; webhooks confiáveis |
| Validação | class-validator + class-transformer | — | Integração nativa com NestJS pipes; DTOs decorados |
| Deploy | Vercel (frontend) + Railway (backend) | — | Vercel para Next.js; Railway para NestJS + MySQL sem configuração de K8s |

---

## Arquitetura

Separação completa entre frontend e backend. Next.js é responsável exclusivamente por renderização e UX — sem Server Actions de mutação. NestJS expõe API REST com autenticação JWT. O frontend consome a API via `fetch` server-side (em Server Components) e client-side (em Client Components com React Query). Auth usa access token de curta duração + refresh token em httpOnly cookie, renovado silenciosamente. Jobs de lembrete rodam via BullMQ com workers NestJS.

```
[Browser — Next.js Client Components]
        │  fetch (Authorization: Bearer <access_token>)
        │
[Vercel — Next.js App]
  ├── Server Components   → fetch server-side para a API NestJS (SSR)
  ├── Client Components   → React Query → NestJS API
  └── /api/auth/callback  → troca de tokens OAuth (se necessário)
        │
        │  REST (JSON)
        ▼
[Railway — NestJS API]
  ├── Guards              → JwtAuthGuard, PlanGuard
  ├── Modules             → auth, patients, sessions, records,
  │                          financial, communication, subscriptions
  ├── Workers (BullMQ)    → ReminderWorker, ChargeWorker
  └── Scheduled Jobs      → @Cron para disparar filas
        │
        ├── MySQL 8.0     → dados relacionais (TypeORM, migrations)
        ├── Upstash Redis → filas BullMQ + rate limiting
        └── Cloudflare R2 → documentos, avatares, PDFs gerados

[Stripe]  ←── webhooks ──→  NestJS /webhooks/stripe
[Resend]  ←── envio ──────  NestJS ReminderWorker
```

---

## Módulos NestJS

```
src/
├── auth/          → login, refresh, logout, recuperação de senha
├── psychologists/ → perfil, configurações de atendimento
├── patients/      → CRUD, ficha, anamnese, documentos
├── sessions/      → agenda, recorrências, estados, bloqueios
├── records/       → prontuário, versões, plano terapêutico
├── documents/     → geração de PDFs clínicos, exportação de prontuário
├── financial/     → pagamentos, cobranças digitais, relatórios
├── communication/ → templates, envio, histórico, automações
├── subscriptions/ → planos, trial, upgrade/downgrade
├── webhooks/      → Stripe, integrações externas
├── public/        → agendamento público (sem auth)
└── common/        → guards, decorators, pipes, crypto, interceptors
```

---

## Modelos de Dados (MySQL / TypeORM)

### Tabela: `psychologists`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| updated_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP ON UPDATE | |
| email | VARCHAR(255) | ❌ | — | UNIQUE |
| password_hash | VARCHAR(255) | ❌ | — | bcrypt hash |
| full_name | VARCHAR(255) | ❌ | — | |
| crp | VARCHAR(50) | ❌ | — | |
| state | CHAR(2) | ❌ | — | UF |
| phone | VARCHAR(20) | ✅ | — | |
| avatar_path | VARCHAR(500) | ✅ | — | R2 object key |
| bio | VARCHAR(300) | ✅ | — | |
| approach | VARCHAR(50) | ✅ | — | TCC / Psicanálise / Humanista / Sistêmica / Comportamental / Outra |
| specialties | JSON | ❌ | '[]' | string[] |
| session_duration_min | TINYINT UNSIGNED | ❌ | 50 | |
| session_price_cents | INT UNSIGNED | ❌ | 0 | |
| gap_between_sessions_min | TINYINT UNSIGNED | ❌ | 0 | |
| min_booking_advance_hours | SMALLINT UNSIGNED | ❌ | 24 | |
| min_cancellation_advance_hours | SMALLINT UNSIGNED | ❌ | 24 | |
| cancellation_policy | VARCHAR(500) | ✅ | — | |
| public_booking_enabled | TINYINT(1) | ❌ | 1 | |
| public_booking_slug | VARCHAR(100) | ❌ | — | UNIQUE |
| public_show_price | TINYINT(1) | ❌ | 0 | |
| public_require_approval | TINYINT(1) | ❌ | 0 | |
| email_confirmed | TINYINT(1) | ❌ | 0 | |
| email_confirm_token | VARCHAR(100) | ✅ | — | |
| password_reset_token | VARCHAR(100) | ✅ | — | |
| password_reset_expires_at | DATETIME | ✅ | — | |
| login_attempts | TINYINT UNSIGNED | ❌ | 0 | |
| locked_until | DATETIME | ✅ | — | |

> Índices: `UNIQUE(email)`, `UNIQUE(public_booking_slug)`

---

### Tabela: `refresh_tokens`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) ON DELETE CASCADE |
| token_hash | VARCHAR(255) | ❌ | — | SHA-256 do token real |
| expires_at | DATETIME | ❌ | — | |
| revoked_at | DATETIME | ✅ | — | |
| user_agent | VARCHAR(500) | ✅ | — | |
| ip_address | VARCHAR(45) | ✅ | — | |

> Índices: `INDEX(psychologist_id)`, `INDEX(token_hash)`

---

### Tabela: `schedule_availability`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) ON DELETE CASCADE |
| day_of_week | TINYINT UNSIGNED | ❌ | — | 0=Dom … 6=Sáb |
| start_time | TIME | ❌ | — | |
| end_time | TIME | ❌ | — | |

> Índices: `INDEX(psychologist_id)`

---

### Tabela: `patients`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| updated_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP ON UPDATE | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) ON DELETE RESTRICT |
| full_name | VARCHAR(255) | ❌ | — | |
| birth_date | DATE | ❌ | — | |
| phone | VARCHAR(20) | ❌ | — | |
| email | VARCHAR(255) | ❌ | — | |
| gender | VARCHAR(50) | ✅ | — | |
| marital_status | VARCHAR(50) | ✅ | — | |
| occupation | VARCHAR(100) | ✅ | — | |
| referral_source | VARCHAR(50) | ✅ | — | |
| emergency_contact_name | VARCHAR(255) | ✅ | — | |
| emergency_contact_phone | VARCHAR(20) | ✅ | — | |
| notes | TEXT | ✅ | — | |
| status | ENUM('active','paused','archived') | ❌ | 'active' | |
| session_price_cents | INT UNSIGNED | ✅ | — | Sobrescreve preço padrão |
| tags | JSON | ❌ | '[]' | string[] |
| avatar_path | VARCHAR(500) | ✅ | — | |
| started_at | DATE | ✅ | — | |

> Índices:
> ```sql
> INDEX idx_patients_psychologist (psychologist_id),
> INDEX idx_patients_status (psychologist_id, status),
> FULLTEXT idx_patients_name (full_name)
> ```

---

### Tabela: `session_recurrences`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) |
| frequency | ENUM('weekly','biweekly','monthly') | ❌ | — | |
| start_date | DATE | ❌ | — | |
| end_date | DATE | ✅ | — | |
| day_of_week | TINYINT UNSIGNED | ❌ | — | |
| time_of_day | TIME | ❌ | — | |
| duration_min | SMALLINT UNSIGNED | ❌ | — | |
| modality | ENUM('in_person','online') | ❌ | — | |
| location | VARCHAR(255) | ✅ | — | |
| price_cents | INT UNSIGNED | ❌ | — | |

---

### Tabela: `sessions`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| updated_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP ON UPDATE | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) ON DELETE RESTRICT |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) ON DELETE RESTRICT |
| recurrence_id | CHAR(36) | ✅ | — | FK → session_recurrences(id) |
| scheduled_at | DATETIME | ❌ | — | |
| duration_min | SMALLINT UNSIGNED | ❌ | — | |
| modality | ENUM('in_person','online') | ❌ | — | |
| location | VARCHAR(255) | ✅ | — | |
| price_cents | INT UNSIGNED | ❌ | — | |
| status | ENUM('scheduled','confirmed','completed','missed','cancelled_patient','cancelled_psychologist','rescheduled') | ❌ | 'scheduled' | |
| cancellation_fee_cents | INT UNSIGNED | ✅ | — | |
| notes | TEXT | ✅ | — | |
| cancelled_at | DATETIME | ✅ | — | |
| completed_at | DATETIME | ✅ | — | |

> Índices:
> ```sql
> INDEX idx_sessions_psychologist_date (psychologist_id, scheduled_at),
> INDEX idx_sessions_patient (patient_id),
> INDEX idx_sessions_recurrence (recurrence_id)
> ```

---

### Tabela: `schedule_blocks`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) ON DELETE CASCADE |
| starts_at | DATETIME | ❌ | — | |
| ends_at | DATETIME | ❌ | — | |
| title | VARCHAR(100) | ✅ | — | |

> Índices: `INDEX(psychologist_id, starts_at, ends_at)`

---

### Tabela: `medical_records`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | Imutável |
| updated_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP ON UPDATE | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) |
| session_id | CHAR(36) | ✅ | — | FK → sessions(id) |
| content_encrypted | LONGBLOB | ❌ | — | AES-256-CBC; IV prefixado nos primeiros 16 bytes |
| private_notes_encrypted | LONGBLOB | ✅ | — | Não exportável |
| mood_score | TINYINT UNSIGNED | ✅ | — | 1–10 |
| techniques_used | JSON | ❌ | '[]' | string[] |
| next_steps | JSON | ❌ | '[]' | string[] |
| version | SMALLINT UNSIGNED | ❌ | 1 | |

> Índices: `INDEX(patient_id)`, `INDEX(session_id)`
> **Regra**: nunca DELETE; apenas UPDATE (versão incrementada via trigger ou lógica de serviço).

---

### Tabela: `medical_record_versions`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| record_id | CHAR(36) | ❌ | — | FK → medical_records(id) |
| version | SMALLINT UNSIGNED | ❌ | — | |
| content_encrypted | LONGBLOB | ❌ | — | Snapshot criptografado |
| edited_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | Quem editou |

---

### Tabela: `therapeutic_plans`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) |
| version | SMALLINT UNSIGNED | ❌ | 1 | |
| short_term_goals_encrypted | LONGBLOB | ✅ | — | |
| mid_term_goals_encrypted | LONGBLOB | ✅ | — | |
| long_term_goals_encrypted | LONGBLOB | ✅ | — | |
| diagnosis_hypothesis_encrypted | LONGBLOB | ✅ | — | |
| cid10 | VARCHAR(10) | ✅ | — | |
| strategies_encrypted | LONGBLOB | ✅ | — | |
| superseded_at | DATETIME | ✅ | — | Substituído por nova versão |

---

### Tabela: `anamneses`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| updated_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP ON UPDATE | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id), UNIQUE |
| chief_complaint_encrypted | LONGBLOB | ✅ | — | |
| history_encrypted | LONGBLOB | ✅ | — | |
| medications_encrypted | LONGBLOB | ✅ | — | |
| general_health_encrypted | LONGBLOB | ✅ | — | |
| family_history_encrypted | LONGBLOB | ✅ | — | |
| therapeutic_goals_encrypted | LONGBLOB | ✅ | — | |
| custom_fields | JSON | ❌ | '[]' | `{label, type, value}[]` |

---

### Tabela: `clinical_documents`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) |
| document_type | ENUM('attendance_declaration','psychological_report','referral','attendance_certificate') | ❌ | — | |
| r2_object_key | VARCHAR(500) | ❌ | — | Chave no R2 |
| title | VARCHAR(255) | ❌ | — | |

---

### Tabela: `patient_documents`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) |
| r2_object_key | VARCHAR(500) | ❌ | — | |
| file_name | VARCHAR(255) | ❌ | — | |
| file_size_bytes | INT UNSIGNED | ❌ | — | |
| mime_type | VARCHAR(50) | ❌ | — | |

---

### Tabela: `payments`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) |
| amount_cents | INT UNSIGNED | ❌ | — | |
| paid_at | DATE | ❌ | — | |
| method | ENUM('pix','cash','debit_card','credit_card','transfer','other') | ❌ | — | |
| notes | TEXT | ✅ | — | |
| charge_id | CHAR(36) | ✅ | — | FK → charges(id) |

---

### Tabela: `payment_sessions`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| payment_id | CHAR(36) | ❌ | — | FK → payments(id) ON DELETE CASCADE |
| session_id | CHAR(36) | ❌ | — | FK → sessions(id) ON DELETE CASCADE |
| PRIMARY KEY | (payment_id, session_id) | | | |

---

### Tabela: `charges`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) |
| amount_cents | INT UNSIGNED | ❌ | — | |
| due_date | DATE | ❌ | — | |
| status | ENUM('pending','paid','expired','cancelled') | ❌ | 'pending' | |
| stripe_payment_intent_id | VARCHAR(255) | ✅ | — | |
| stripe_payment_link | TEXT | ✅ | — | |
| paid_at | DATETIME | ✅ | — | |

> Índices: `INDEX(psychologist_id, status)`

---

### Tabela: `communication_templates`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ✅ | — | NULL = template base do sistema |
| category | ENUM('reminder','cancellation','billing','onboarding','sensitive') | ❌ | — | |
| name | VARCHAR(100) | ❌ | — | |
| body | TEXT | ❌ | — | Variáveis `{{...}}` |
| is_system | TINYINT(1) | ❌ | 0 | Templates base não deletáveis |
| channel | ENUM('whatsapp','email','both') | ❌ | — | |

---

### Tabela: `communication_logs`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id) |
| patient_id | CHAR(36) | ❌ | — | FK → patients(id) |
| template_id | CHAR(36) | ✅ | — | FK → communication_templates(id) |
| channel | ENUM('whatsapp','email') | ❌ | — | |
| type | ENUM('automated','manual','billing') | ❌ | — | |
| status | ENUM('sent','failed') | ❌ | — | |
| body_snapshot | TEXT | ❌ | — | Mensagem com variáveis substituídas |

---

### Tabela: `subscriptions`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| psychologist_id | CHAR(36) | ❌ | — | FK → psychologists(id), UNIQUE |
| plan | ENUM('free','pro','clinic') | ❌ | 'free' | |
| status | ENUM('trialing','active','past_due','cancelled') | ❌ | 'trialing' | |
| trial_ends_at | DATETIME | ✅ | — | |
| current_period_ends_at | DATETIME | ✅ | — | |
| stripe_customer_id | VARCHAR(255) | ✅ | — | |
| stripe_subscription_id | VARCHAR(255) | ✅ | — | |
| cancelled_at | DATETIME | ✅ | — | |

---

### Tabela: `audit_logs`
| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|---------|---------|-----------|
| id | CHAR(36) | ❌ | UUID() | PK |
| created_at | DATETIME(3) | ❌ | CURRENT_TIMESTAMP | |
| psychologist_id | CHAR(36) | ❌ | — | Quem realizou a ação |
| action | VARCHAR(100) | ❌ | — | record_viewed / record_edited / prontuario_exported / document_generated |
| resource_type | VARCHAR(50) | ❌ | — | medical_record / patient / clinical_document |
| resource_id | CHAR(36) | ❌ | — | ID do recurso |
| ip_address | VARCHAR(45) | ✅ | — | |
| metadata | JSON | ❌ | '{}' | |

> Índices: `INDEX(psychologist_id, created_at DESC)`

---

## API REST (NestJS)

Prefixo base: `/api/v1`

### Auth — `AuthModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/auth/register` | Pública | Cadastro; inicia trial |
| POST | `/auth/login` | Pública | Login; retorna access + refresh token |
| POST | `/auth/refresh` | Cookie `refresh_token` | Renova access token |
| POST | `/auth/logout` | JWT | Revoga refresh token |
| POST | `/auth/forgot-password` | Pública | Envia link de recuperação |
| POST | `/auth/reset-password` | Token por query | Redefine senha |
| POST | `/auth/confirm-email` | Token por query | Confirma e-mail |

**Fluxo JWT**:
- Login → NestJS assina access token (RS256, 15 min) + gera refresh token (opaque, 30 dias)
- Refresh token armazenado como hash SHA-256 em `refresh_tokens`; valor real em httpOnly cookie
- Frontend envia access token no header `Authorization: Bearer <token>`
- `JwtAuthGuard` valida o token em todos os endpoints protegidos

---

### Psicólogos — `PsychologistsModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/psychologists/me` | JWT | Retorna perfil completo |
| PATCH | `/psychologists/me` | JWT | Atualiza perfil e configurações |
| POST | `/psychologists/me/avatar` | JWT | Upload de foto (multipart) |
| GET | `/psychologists/me/availability` | JWT | Lista blocos de disponibilidade |
| PUT | `/psychologists/me/availability` | JWT | Substitui grade semanal |

---

### Pacientes — `PatientsModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/patients` | JWT | Lista com busca full-text e filtros |
| POST | `/patients` | JWT | Cria paciente; verifica limite do plano |
| GET | `/patients/:id` | JWT | Ficha completa |
| PATCH | `/patients/:id` | JWT | Atualiza dados do paciente |
| PATCH | `/patients/:id/archive` | JWT | Arquiva (não exclui) |
| POST | `/patients/:id/documents` | JWT | Upload de documento (multipart) |
| GET | `/patients/:id/documents` | JWT | Lista documentos |
| DELETE | `/patients/:id/documents/:docId` | JWT | Remove documento do R2 |
| GET | `/patients/:id/anamnese` | JWT | Retorna anamnese |
| PUT | `/patients/:id/anamnese` | JWT | Cria ou atualiza anamnese |

**Regras de serviço**:
- `GET /patients`: FULLTEXT search via `MATCH(full_name) AGAINST(?)` + filtro por `status`
- Paginação por cursor (`after=<last_id>&limit=20`)
- `PATCH archive`: bloqueia se `medical_records` existem (apenas arquiva)
- `POST patients`: se plano Gratuito, conta `WHERE psychologist_id=? AND status='active'` antes de INSERT

---

### Sessões — `SessionsModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/sessions` | JWT | Lista por período (query: `from`, `to`) |
| POST | `/sessions` | JWT | Cria sessão (única ou recorrente) |
| GET | `/sessions/:id` | JWT | Detalhe da sessão |
| PATCH | `/sessions/:id` | JWT | Edita sessão |
| PATCH | `/sessions/:id/status` | JWT | Muda estado |
| DELETE | `/sessions/:id` | JWT | Cancela (soft — muda status) |
| GET | `/schedule/blocks` | JWT | Lista bloqueios |
| POST | `/schedule/blocks` | JWT | Cria bloqueio de período |
| DELETE | `/schedule/blocks/:id` | JWT | Remove bloqueio |
| GET | `/schedule/available-slots` | JWT | Slots livres para um período |

**Regras de serviço**:
- `POST /sessions` com recorrência: transaction que insere `session_recurrences` + até 52 `sessions` em bulk
- Conflito de horário: `SELECT COUNT(*) WHERE psychologist_id=? AND scheduled_at < ends_at AND scheduled_at + INTERVAL duration MINUTE > scheduled_at` — rejeita se > 0
- `PATCH status=completed`: aceito apenas se `scheduled_at <= NOW()`
- Resposta de `status=completed` inclui `promptPayment: true`

---

### Prontuário — `RecordsModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/patients/:id/records` | JWT | Lista evoluções (paginado) |
| POST | `/patients/:id/records` | JWT | Cria evolução |
| PATCH | `/patients/:id/records/:rid` | JWT | Edita (salva versão anterior) |
| GET | `/patients/:id/records/:rid/versions` | JWT | Histórico de versões |
| GET | `/patients/:id/therapeutic-plan` | JWT | Plano terapêutico ativo |
| POST | `/patients/:id/therapeutic-plan` | JWT | Cria nova versão do plano |
| POST | `/patients/:id/export` | JWT | Gera PDF do prontuário completo |

**Regras de serviço**:
- Criptografia: `RecordsService.encrypt(content)` / `decrypt()` via `CryptoService` (AES-256-CBC, `ENCRYPTION_KEY` de env)
- `PATCH record`: copia row para `medical_record_versions` antes de UPDATE; incrementa `version`
- Sem DELETE em `medical_records`
- `POST export`: gera PDF via Puppeteer, faz upload no R2, retorna URL presigned com TTL 24h; registra em `audit_logs`

---

### Financeiro — `FinancialModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/financial/payments` | JWT | Lista pagamentos com filtros |
| POST | `/financial/payments` | JWT | Registra pagamento manual |
| GET | `/financial/delinquencies` | JWT | Sessões sem pagamento |
| GET | `/financial/report` | JWT | Relatório financeiro por período |
| POST | `/financial/charges` | JWT + PlanGuard(pro) | Cria cobrança digital Stripe |
| GET | `/financial/charges` | JWT | Lista cobranças |
| PATCH | `/financial/charges/:id/cancel` | JWT | Cancela cobrança |

---

### Comunicação — `CommunicationModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/communication/templates` | JWT | Lista templates (sistema + próprios) |
| POST | `/communication/templates` | JWT | Cria template personalizado |
| PATCH | `/communication/templates/:id` | JWT | Edita template próprio |
| DELETE | `/communication/templates/:id` | JWT | Deleta template próprio (nunca `is_system=true`) |
| POST | `/communication/send` | JWT | Envia mensagem; retorna `waLink` ou confirma e-mail |
| GET | `/communication/logs/:patientId` | JWT | Histórico de mensagens do paciente |

---

### Assinaturas — `SubscriptionsModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/subscriptions/me` | JWT | Plano atual e status |
| POST | `/subscriptions/checkout` | JWT | Cria sessão Stripe Checkout |
| POST | `/subscriptions/portal` | JWT | Abre Stripe Customer Portal |

---

### Agendamento Público — `PublicModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/public/psychologists/:slug` | Pública | Perfil público do psicólogo |
| GET | `/public/psychologists/:slug/slots` | Pública | Slots disponíveis (query: `date`) |
| POST | `/public/psychologists/:slug/book` | Pública | Cria sessão + cadastro simplificado de paciente |

---

### Webhooks — `WebhooksModule`

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/webhooks/stripe` | `stripe-signature` | Trata eventos Stripe |
| POST | `/webhooks/reminders` | Bearer secret | Disparado pelo @nestjs/schedule para enviar lembretes |

**Eventos Stripe tratados**:
- `checkout.session.completed` → atualiza `subscriptions`
- `invoice.payment_succeeded` → renova período
- `invoice.payment_failed` → `status=past_due`
- `customer.subscription.deleted` → `status=cancelled`
- `payment_intent.succeeded` (cobrança avulsa) → `charges.status=paid`, cria `payment`

---

## Autenticação e Autorização (NestJS)

### Guards

```typescript
// JwtAuthGuard — aplicado globalmente via APP_GUARD
// Extrai Bearer token do header, valida assinatura RS256, popula req.user

// PlanGuard — aplicado por endpoint
@UsePlanGuard('pro') // verifica subscription.plan IN ('pro', 'clinic')
async createCharge() { ... }

// OwnershipGuard — integrado aos services (não via decorator)
// Toda query inclui WHERE psychologist_id = req.user.id
```

### Proteção de recursos
Todos os services incluem `psychologist_id = currentUser.id` em todas as queries — nunca confiar no `id` do body/params isoladamente.

---

## Criptografia de Dados Clínicos

```typescript
// src/common/crypto/crypto.service.ts
import { Injectable } from '@nestjs/common'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

@Injectable()
export class CryptoService {
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

  encrypt(plaintext: string): Buffer {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-cbc', this.key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    return Buffer.concat([iv, encrypted])
  }

  decrypt(ciphertext: Buffer): string {
    const iv = ciphertext.subarray(0, 16)
    const data = ciphertext.subarray(16)
    const decipher = createDecipheriv('aes-256-cbc', this.key, iv)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  }
}
```

**Regra**: `CryptoService` injetado apenas em `RecordsService`, `AnamnesesService`, `TherapeuticPlansService`. Dados descriptografados nunca saem do processo NestJS — o frontend recebe apenas texto plano na resposta JSON.

---

## Jobs Agendados (BullMQ + @nestjs/schedule)

```typescript
// RemindersScheduler — roda a cada hora via @Cron
@Cron('0 * * * *')
async queueReminders() {
  // Busca sessões com scheduled_at entre now()+1h50min e now()+2h10min → lembrete 2h
  // Busca sessões com scheduled_at entre now()+23h50min e now()+24h10min → lembrete 24h
  // Adiciona jobs na fila BullMQ 'reminders'
}

// ReminderWorker — processa jobs da fila
@Process('send-reminder')
async sendReminder(job: Job<ReminderJobData>) {
  // Interpola template
  // Se canal email: Resend.send()
  // Se canal whatsapp: registra log (psicólogo envia manualmente)
  // Registra em communication_logs
}
```

---

## Segurança

| Área | Implementação |
|------|--------------|
| Validação de input | `ValidationPipe` global com `whitelist: true, forbidNonWhitelisted: true` |
| Auth em endpoints | `JwtAuthGuard` global; endpoints públicos marcados com `@Public()` |
| Ownership | `WHERE psychologist_id = req.user.id` em todas as queries de dados |
| Dados clínicos | AES-256-CBC via `CryptoService`; descriptografia apenas em Services NestJS |
| Senhas | bcrypt com `saltRounds: 12` |
| Rate limiting | `@nestjs/throttler` + Upstash Redis: 100 req/min por IP; 5 tentativas de login → bloqueio 15 min |
| CORS | `app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true })` |
| Helmet | `app.use(helmet())` em produção |
| Stripe webhooks | `stripe.webhooks.constructEvent()` com `STRIPE_WEBHOOK_SECRET` antes de processar |
| Upload de arquivos | Validação de MIME type + tamanho máximo no NestJS antes de enviar ao R2 |
| Variáveis sensíveis | `ENCRYPTION_KEY`, `JWT_PRIVATE_KEY`, `STRIPE_SECRET_KEY` nunca expostos ao frontend |

---

## Estrutura de Pastas

### Backend (NestJS)
```
apps/api/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/          ← jwt.strategy.ts, local.strategy.ts
│   └── guards/              ← jwt-auth.guard.ts, public.decorator.ts
├── psychologists/
│   ├── psychologists.module.ts
│   ├── psychologists.controller.ts
│   ├── psychologists.service.ts
│   ├── dto/
│   └── entities/psychologist.entity.ts
├── patients/
│   ├── patients.module.ts
│   ├── patients.controller.ts
│   ├── patients.service.ts
│   ├── dto/
│   └── entities/
├── sessions/
│   ├── sessions.module.ts
│   ├── sessions.controller.ts
│   ├── sessions.service.ts    ← lógica de conflito, recorrência
│   ├── dto/
│   └── entities/
├── records/
│   ├── records.module.ts
│   ├── records.controller.ts
│   ├── records.service.ts
│   ├── dto/
│   └── entities/
├── financial/
│   ├── financial.module.ts
│   ├── financial.controller.ts
│   ├── financial.service.ts
│   └── dto/
├── communication/
│   ├── communication.module.ts
│   ├── communication.controller.ts
│   ├── communication.service.ts
│   └── dto/
├── subscriptions/
│   ├── subscriptions.module.ts
│   ├── subscriptions.controller.ts
│   └── subscriptions.service.ts
├── webhooks/
│   ├── webhooks.module.ts
│   └── webhooks.controller.ts  ← stripe, reminders
├── public/
│   ├── public.module.ts
│   └── public.controller.ts
├── jobs/
│   ├── jobs.module.ts
│   ├── reminders.scheduler.ts  ← @Cron
│   └── reminder.worker.ts      ← BullMQ processor
└── common/
    ├── crypto/crypto.service.ts
    ├── storage/r2.service.ts
    ├── mail/resend.service.ts
    ├── pdf/pdf.service.ts
    ├── guards/plan.guard.ts
    ├── interceptors/audit.interceptor.ts
    └── pipes/                  ← validação customizada
```

### Frontend (Next.js)
```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           ← sidebar, plano no contexto
│   │   ├── page.tsx             ← dashboard
│   │   ├── patients/
│   │   ├── schedule/
│   │   ├── financial/
│   │   ├── communication/
│   │   └── settings/
│   ├── agendar/
│   │   └── [slug]/page.tsx      ← página pública
│   └── globals.css
├── lib/
│   ├── api.ts                   ← fetch wrapper com refresh automático de token
│   └── query-client.ts          ← React Query client
├── hooks/                       ← React Query hooks por módulo
└── components/
    ├── ui/                      ← shadcn/ui
    └── [feature]/               ← componentes de domínio
```

### Monorepo
```
/
├── apps/
│   ├── api/     ← NestJS
│   └── web/     ← Next.js
├── packages/
│   └── types/   ← @psiclinica/types (DTOs e tipos compartilhados)
└── package.json ← npm workspaces ou turbo
```

---

## Variáveis de Ambiente

### Backend (`apps/api/.env`)
```bash
# Database
DATABASE_URL=mysql://user:pass@host:3306/psiclinica

# Auth
JWT_PRIVATE_KEY=                  # RS256 private key (PEM)
JWT_PUBLIC_KEY=                   # RS256 public key (PEM)

# Criptografia de prontuário
ENCRYPTION_KEY=                   # hex 64 chars (32 bytes AES-256)

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_CLINIC_MONTHLY=
STRIPE_PRICE_CLINIC_YEARLY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@psiclinica.com.br

# Redis (Upstash)
REDIS_URL=

# App
FRONTEND_URL=https://psiclinica.com.br
REMINDERS_WEBHOOK_SECRET=
```

### Frontend (`apps/web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=https://api.psiclinica.com.br/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## Performance

| Área | Estratégia |
|------|-----------|
| Fetch client-side | React Query com staleTime configurado por domínio (agenda: 30s, pacientes: 5min) |
| Fetch server-side | Server Components fazem fetch direto à API NestJS no SSR |
| Lista de pacientes | Paginação por cursor; FULLTEXT index para busca |
| Agenda semanal | Query com range indexado `scheduled_at BETWEEN ? AND ?` |
| Prontuário | Descriptografar apenas registros do período solicitado |
| Upload de arquivos | Stream direto do NestJS para R2 (sem buffer em memória) |
| PDF | Puppeteer em worker separado; resultado no R2 com presigned URL |
| Índices críticos | `sessions(psychologist_id, scheduled_at)`, `patients(FULLTEXT full_name)`, `audit_logs(psychologist_id, created_at DESC)` |

---

## Decisões de Arquitetura (ADR)

### ADR-001: NestJS como backend dedicado (não Next.js Server Actions)
- **Contexto**: Produto com lógica de domínio complexa (criptografia, cron jobs, workers BullMQ, webhooks Stripe, geração de PDF), múltiplos tipos de guard (plano, ownership, auditoria), e necessidade de testes unitários de serviços isolados.
- **Decisão**: NestJS como API REST separada do Next.js. Frontend é puramente de apresentação.
- **Consequências**: Dois deployments (Vercel + Railway). Monorepo com pacote `@psiclinica/types` compartilha DTOs. Latência extra de um round-trip, mitigada por SSR no Next.js para páginas críticas.

### ADR-002: MySQL com TypeORM (não Postgres/Prisma)
- **Contexto**: Usuário optou por MySQL. TypeORM é a integração canônica do NestJS.
- **Decisão**: MySQL 8.0 + TypeORM 0.3. FULLTEXT para busca de pacientes. LONGBLOB para dados clínicos criptografados. Migrations versionadas via TypeORM CLI.
- **Consequências**: Sem arrays nativos (JSON como substituto). Sem `pg_cron` (substituído por `@nestjs/schedule` + BullMQ). FULLTEXT MySQL é suficiente para o volume esperado.

### ADR-003: Criptografia AES-256-CBC a nível de aplicação
- **Contexto**: CFP exige que dados de prontuário não sejam acessíveis ao operador do sistema. Criptografia de disco não é suficiente.
- **Decisão**: `CryptoService` no NestJS criptografa campos clínicos antes de gravar; descriptografa antes de retornar. IV prefixado nos primeiros 16 bytes do LONGBLOB.
- **Consequências**: Busca full-text dentro do conteúdo do prontuário é impossível. Rotação de chave requer re-criptografia (script de migração necessário). Sem pgcrypto — lógica 100% no aplicativo.

### ADR-004: JWT RS256 com refresh token em httpOnly cookie
- **Contexto**: Access tokens de curta duração reduzem janela de exposição. Refresh token em httpOnly cookie previne roubo via XSS.
- **Decisão**: Access token RS256 (15 min) no header `Authorization`. Refresh token opaque armazenado como hash no banco + httpOnly cookie com `Secure; SameSite=Strict`.
- **Consequências**: O frontend deve implementar lógica de refresh automático no `api.ts` wrapper (intercepta 401, chama `/auth/refresh`, repete a request original).

### ADR-005: BullMQ para lembretes (não cron direto)
- **Contexto**: Lembretes de sessão precisam de retry em caso de falha no Resend. Cron simples perde jobs se o worker reinicia durante o envio.
- **Decisão**: `@Cron` a cada hora enfileira jobs no BullMQ (Redis Upstash). `ReminderWorker` processa com retry automático (3 tentativas com backoff exponencial).
- **Consequências**: Redis é dependência adicional, mitigada pelo Upstash serverless (sem infra extra). Jobs são idempotentes: verifica se lembrete já foi enviado antes de enviar.
