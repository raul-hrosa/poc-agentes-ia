# Architecture — PsiAgenda

> Definido em: 2026-04-27
> Padrão: Monolito modular (Next.js full-stack)
> Deploy: manual

---

## Visão geral

PsiAgenda é um monolito modular construído sobre Next.js 14 com App Router.
Não há backend separado — Server Components e Server Actions executam lógica
de servidor no mesmo processo. O banco é MySQL 8 rodando via Docker.

A escolha de monolito é deliberada: 1 desenvolvedor, MVP de validação, sem
necessidade de escala horizontal independente por serviço. Ver ADR `monolito-vs-microsservicos.md`.

---

## Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO FINAL                           │
│                  (psicólogo — browser/mobile)                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App (servidor)                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────┐    ┌──────────────────────────┐    │  │
│  │  │  React Client   │    │   Server Components /    │    │  │
│  │  │  Components     │◄──►│   Server Actions         │    │  │
│  │  │  (UI / forms)   │    │   (lógica de negócio)    │    │  │
│  │  └─────────────────┘    └──────────────┬───────────┘    │  │
│  │                                         │                │  │
│  │  ┌──────────────────────────────────────▼───────────┐    │  │
│  │  │              Feature Modules                     │    │  │
│  │  │  auth │ patients │ appointments │ notes │ payments│   │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │                         │                                │  │
│  │  ┌──────────────────────▼───────────────────────────┐    │  │
│  │  │              Shared Layer                        │    │  │
│  │  │  lib/prisma │ lib/auth │ lib/stripe │ lib/resend  │   │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │           │                           │
└─────────────────────────┼───────────┼───────────────────────────┘
                          │           │
          ┌───────────────┘           └────────────────┐
          │ Prisma + MySQL wire                         │ REST
          ▼                                             ▼
┌─────────────────────┐                   ┌────────────────────────┐
│  MySQL 8 (Docker)   │                   │   SERVIÇOS EXTERNOS    │
│                     │                   │                        │
│  psiagenda DB       │                   │  Resend (e-mail)       │
│                     │                   │  Stripe (pagamentos)   │
└─────────────────────┘                   │  Sentry (erros)        │
                                          └────────────────────────┘

─────────────────────────────────────────────────────────────────
FLUXO PÚBLICO (sem auth)

┌──────────────┐       link com token        ┌─────────────────┐
│   PACIENTE   │ ──────────────────────────► │  /confirm/[tok] │
│  (browser)   │                             │  (página pública│
└──────────────┘ ◄──────────────────────────  │   Next.js)      │
                       resposta visual         └────────┬────────┘
                                                        │ valida token
                                                        ▼
                                               ┌─────────────────┐
                                               │   MySQL DB      │
                                               │  appointment_   │
                                               │  tokens table   │
                                               └─────────────────┘
```

---

## Componentes e responsabilidades

### Next.js App

**Responsabilidade:** Renderização de UI, roteamento, autenticação via middleware,
execução de Server Actions, entrega de assets estáticos.

**Expõe:**
- Rotas de UI em `/app/(auth)/` e `/app/(public)/`
- API routes em `/app/api/` (webhooks Stripe, confirmação de token, auth NextAuth)
- Página pública de confirmação em `/app/confirm/[token]/`

**Consome:**

- MySQL via Prisma (banco de dados)
- NextAuth.js (sessão e auth)
- Resend (e-mails)
- Stripe (checkout + webhooks)
- Sentry (erros)

**Nao deve:**
- Conter lógica de negócio em componentes React — apenas em Server Actions e services
- Fazer queries SQL raw fora de `lib/prisma`
- Expor `APP_SECRET` ou `AUTH_SECRET` em qualquer arquivo com prefixo `NEXT_PUBLIC_`
- Armazenar dados de sessão clínica em localStorage ou cookies

### Feature Modules (`src/features/[feature]/`)

Cada feature é um módulo autossuficiente com UI, lógica e tipos próprios.

**Módulos do MVP:**
- `auth` — login, logout, reset de senha, middleware de proteção
- `patients` — CRUD de pacientes do psicólogo
- `appointments` — agenda, criação/edição/cancelamento de consultas
- `reminders` — geração de link de lembrete, fluxo de envio manual
- `tokens` — criação e validação de tokens de confirmação (usados por reminders)
- `notes` — prontuário por sessão (vinculado a appointment)
- `payments` — marcação de sessão como paga/pendente, resumo financeiro mensal
- `billing` — planos (free vs pro), integração Stripe, gestão de assinatura

**Cada módulo expõe:**
```
features/[feature]/
  components/   ← UI específica (Server e Client Components)
  actions/      ← Server Actions (mutações)
  queries/      ← funções de data fetching (usadas em Server Components)
  hooks/        ← custom hooks para Client Components
  schema.ts     ← schemas Zod para validação de inputs
  types.ts      ← tipos TypeScript específicos da feature
```

**Nao deve:**
- Importar de outro módulo de feature diretamente (acoplamento lateral)
- Usar `fetch()` do cliente para chamar rotas da própria aplicação — usar Server Actions
- Implementar lógica de banco fora de `queries/` e `actions/`

### Shared Layer (`src/shared/`)

**Responsabilidade:** Código reutilizável entre features — clientes externos, componentes
de UI genéricos, utilitários.

```
shared/
  components/    ← UI genérica (Button, Input, Modal, etc. do shadcn/ui)
  lib/
    prisma.ts    ← singleton do Prisma Client
    auth.ts      ← configuração NextAuth.js (providers, callbacks, adapter)
    stripe.ts    ← cliente Stripe
    resend.ts    ← cliente Resend
    tokens.ts    ← utilitários HMAC para tokens de confirmação
  types/
    index.ts     ← tipos globais compartilhados
  utils/
    cn.ts        ← utilitário clsx + twMerge
    format.ts    ← formatadores de data, moeda, telefone
```

---

## Fluxo de confirmação por token (feature crítica)

O fluxo de lembrete e confirmação acontece sem integração com WhatsApp Business API.

```
1. Psicólogo agenda consulta → appointment criado (status: "scheduled")

2. Sistema gera token HMAC:
   token = HMAC-SHA256(APP_SECRET, appointment_id + expires_at)
   Salvo em appointment_tokens: { token, appointment_id, expires_at, used_at }

3. Sistema monta URL de confirmação:
   https://app.psiagenda.com.br/confirm/[token]

4. Psicólogo vê botão "Copiar link de lembrete" na agenda
   → copia URL e envia manualmente pelo WhatsApp ao paciente
   (no plano pro: sistema prepara mensagem pré-formatada com a URL)

5. Paciente acessa a URL:
   → Página pública /confirm/[token] (sem autenticação)
   → Valida token: existe? não expirou? não foi usado?
   → Exibe nome do psicólogo, data/hora da consulta

6. Paciente clica "Confirmar" ou "Cancelar":
   → Server Action valida token novamente
   → Atualiza appointment.status para "confirmed" ou "cancelled"
   → Marca token como usado (used_at = now())
   → Exibe tela de feedback ao paciente

7. Psicólogo vê status atualizado na agenda em tempo real
   (ou ao recarregar — sem real-time no MVP)
```

**Segurança do token:**
- Expiração padrão: 72 horas após geração
- Token é de uso único (usado = inválido)
- HMAC evita enumeração/forjamento de tokens
- Não contém dados do paciente na URL

---

## Estrutura de pastas completa

```
projects/agenda-psicologos/
  prisma/
    schema.prisma         ← schema do banco
    migrations/           ← migrations versionadas
    seed.ts               ← seed de dados de desenvolvimento
  src/
    app/                  ← rotas Next.js (App Router)
      (auth)/             ← rotas protegidas por middleware
        dashboard/
          page.tsx
        patients/
          page.tsx
          [id]/
            page.tsx
        appointments/
          page.tsx
          new/
            page.tsx
          [id]/
            page.tsx
            notes/
              page.tsx
        payments/
          page.tsx
        settings/
          page.tsx
      (public)/           ← rotas sem autenticação
        login/
          page.tsx
        signup/
          page.tsx
        forgot-password/
          page.tsx
      confirm/
        [token]/
          page.tsx        ← confirmação de consulta pelo paciente
      api/
        webhooks/
          stripe/
            route.ts      ← webhook Stripe
    features/
      auth/
        components/
        actions/
        queries/
        schema.ts
        types.ts
      patients/
        components/
        actions/
        queries/
        hooks/
        schema.ts
        types.ts
      appointments/
        components/
        actions/
        queries/
        hooks/
        schema.ts
        types.ts
      reminders/
        actions/
        queries/
        schema.ts
        types.ts
      tokens/
        actions/
        queries/
        schema.ts
        types.ts
      notes/
        components/
        actions/
        queries/
        schema.ts
        types.ts
      payments/
        components/
        actions/
        queries/
        schema.ts
        types.ts
      billing/
        components/
        actions/
        queries/
        schema.ts
        types.ts
    shared/
      components/
        ui/               ← componentes shadcn/ui copiados
      lib/
        prisma.ts
        supabase/
          client.ts
          server.ts
        stripe.ts
        resend.ts
        tokens.ts
      types/
        index.ts
      utils/
        cn.ts
        format.ts
    middleware.ts         ← proteção de rotas, auth check
  public/
    icons/
    images/
  .env.local
  .env.example
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
  prisma/
    schema.prisma
```

---

## Convenções obrigatórias de código

### Nomenclatura

| Artefato | Convenção | Exemplo |
|---|---|---|
| Arquivo de componente | PascalCase | `PatientCard.tsx` |
| Arquivo de action | camelCase | `createPatient.ts` |
| Arquivo de query | camelCase | `getPatientById.ts` |
| Arquivo de schema | camelCase | `schema.ts` por feature |
| Pasta de feature | kebab-case | `appointments/` |
| Variável/função | camelCase | `appointmentStatus` |
| Tipo/Interface | PascalCase | `AppointmentStatus` |
| Enum | PascalCase + values SCREAMING_SNAKE | `AppointmentStatus.NO_SHOW` |
| Constante global | SCREAMING_SNAKE_CASE | `MAX_FREE_PATIENTS` |

### Server Actions

Toda mutação de dados usa Server Action (`"use server"`).
Server Actions vivem em `features/[feature]/actions/`.
Nunca em componentes Client (`"use client"`).

```typescript
// Padrão obrigatório para Server Actions
"use server"

import { z } from "zod"
import { createPatientSchema } from "../schema"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"

export async function createPatient(input: z.infer<typeof createPatientSchema>) {
  const user = await getCurrentUser() // sempre valida auth primeiro
  if (!user) throw new Error("Unauthorized")

  const validated = createPatientSchema.parse(input) // valida input com Zod

  // lógica de negócio aqui
}
```

### Tratamento de erros

- Server Actions lançam exceções (`throw new Error(...)`) com mensagens em português
- Client Components capturam com `try/catch` e exibem mensagem ao usuário
- Erros inesperados são capturados pelo Sentry automaticamente via `@sentry/nextjs`
- Nunca expor stack traces ao usuário final

### Validação de inputs

- Todo input externo (form, query param, body) é validado com Zod antes de processar
- Schemas Zod ficam em `features/[feature]/schema.ts`
- Nunca confiar em dados do cliente sem revalidar no servidor

### Autenticação

- Middleware em `src/middleware.ts` protege todas as rotas `/(auth)/`
- Toda Server Action começa com `getCurrentUser()` — nunca assumir que o usuário está autenticado
- `getCurrentUser()` usa `auth()` do NextAuth.js v5 (cookies httpOnly assinados)

### Queries de banco

- Toda query usa o Prisma Client singleton de `shared/lib/prisma.ts`
- Nunca instanciar `new PrismaClient()` fora do singleton
- Toda query filtra por `userId` — nunca retornar dados de outro psicólogo

### Mobile-first

- Todo componente novo começa com estilos mobile (sem prefixo `sm:`, `md:`)
- Estilos para telas maiores usam `md:` e `lg:` como overrides
- Targets de toque mínimos: 44x44px (seguir WCAG 2.1 guideline 2.5.5)
- Sem hover como única forma de revelar ação — toque deve funcionar

---

## Decisões de arquitetura

| Decisão | Escolha | ADR |
|---|---|---|
| Monolito vs microsserviços | Monolito modular Next.js | `ADR/monolito-vs-microsservicos.md` |
| SSR vs SPA | SSR com Server Components (Next.js App Router) | — |
| Multi-tenancy | Isolamento por `user_id` na camada de aplicação | `ADR/multitenancy-rls.md` |
| Token de confirmação | HMAC-SHA256 com expiração e uso único | `ADR/token-confirmacao.md` |
| Auth de prontuário | NextAuth.js v5 + filtro por userId (sem senha adicional por CFP) | `ADR/auth-prontuario-cfp.md` |

---

## Limites de responsabilidade: frontend vs backend

| Responsabilidade | Onde fica |
|---|---|
| Renderização de UI | React Components (`components/`) |
| Validação de form (UX imediata) | Client Component com Zod (`hooks/`) |
| Validação de segurança (definitiva) | Server Action (`actions/`) |
| Queries de leitura | Server Components via `queries/` |
| Mutações | Server Actions (`actions/`) |
| Autenticação | Middleware NextAuth.js + `auth()` em Server Actions |
| Autorização (isolamento de dados) | Filtro obrigatório por `userId` em toda query Prisma |
| Lógica de token de confirmação | `shared/lib/tokens.ts` + `features/tokens/` |
| Lógica de pagamento | `features/billing/actions/` + webhook Stripe |
| Envio de e-mail | `shared/lib/resend.ts` chamado dentro de Server Actions |
