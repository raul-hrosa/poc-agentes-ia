# Contexto — PsiClínica

## Localização

- Documentação: `projects/psi-clinica/`
- Código: `projects/code/`

> Todos os caminhos de arquivo (apps/, packages/, etc.) são relativos à raiz do código acima.

## Produto

Sistema de gestão de consultório para psicólogos em início de carreira (0–3 anos). Resolve agenda, prontuário, cobrança e comunicação ética em uma plataforma web responsiva, em conformidade com CFP e LGPD.

## Stack

- **Monorepo**: npm workspaces + Turborepo
- **Frontend**: Next.js 14, App Router, TypeScript strict, Tailwind CSS, shadcn/ui
- **Backend**: NestJS 10, REST API dedicada (sem Server Actions de mutação)
- **ORM**: TypeORM 0.3
- **Banco**: MySQL 8.0 (FULLTEXT search, LONGBLOB para dados criptografados)
- **Auth**: JWT RS256 (15 min) + Refresh Token opaque (30 dias, httpOnly cookie)
- **Criptografia**: AES-256-CBC via `CryptoService` (campos clínicos, IV nos primeiros 16 bytes)
- **Storage**: Cloudflare R2 (S3-compatível, AWS SDK v3)
- **E-mail**: Resend
- **PDF**: Puppeteer (server-side no NestJS)
- **Editor rico**: Tiptap
- **Jobs**: @nestjs/schedule (@Cron) + BullMQ + Upstash Redis
- **Pagamentos**: Stripe (assinaturas + cobranças avulsas)
- **Deploy**: Vercel (frontend) + Railway (backend + MySQL)

## Estrutura chave

```
apps/api/src/
├── auth/              → login, refresh, logout, recuperação, confirmação e-mail
├── psychologists/     → perfil, configurações, disponibilidade semanal
├── patients/          → CRUD, ficha, anamnese, documentos
├── sessions/          → agenda, recorrências, bloqueios, slots
├── records/           → prontuário criptografado, versões, plano terapêutico
├── documents/         → geração PDF clínicos, exportação prontuário
├── financial/         → pagamentos manuais, cobranças Stripe, relatórios
├── communication/     → templates CFP, envio, logs, automações
├── subscriptions/     → planos, trial, checkout Stripe, portal
├── webhooks/          → Stripe events
├── public/            → agendamento público sem auth
├── jobs/              → RemindersScheduler (@Cron) + ReminderWorker (BullMQ)
└── common/            → CryptoService, R2Service, ResendService, PdfService,
                         JwtAuthGuard, PlanGuard, AuditInterceptor

apps/web/src/
├── app/(auth)/        → login, register, forgot-password
├── app/(dashboard)/   → sidebar layout, dashboard, patients, schedule,
│                        financial, communication, settings
├── app/agendar/[slug] → página pública de agendamento
├── lib/api.ts         → fetch wrapper com refresh automático de token (intercepta 401)
├── lib/query-client.ts→ React Query client
├── hooks/             → React Query hooks por módulo
└── components/
    ├── ui/            → shadcn/ui (não modificar)
    └── [feature]/     → componentes de domínio

packages/types/        → @psiclinica/types (DTOs compartilhados)
```

## Padrões obrigatórios

**Backend (NestJS)**
- Toda Controller usa `JwtAuthGuard` global; endpoints públicos marcados `@Public()`
- Toda Service inclui `WHERE psychologist_id = req.user.id` em todas as queries
- Validação: `class-validator` + `class-transformer` em DTOs; `ValidationPipe` global com `whitelist: true`
- `PlanGuard('pro')` em endpoints de plano Pro
- Criptografia: apenas `RecordsService`, `AnamnesesService`, `TherapeuticPlansService` injetam `CryptoService`
- Retorno padrão: objeto TypeScript tipado via `@psiclinica/types`

**Frontend (Next.js)**
- Server Components por padrão; `"use client"` apenas para eventos/estado local
- Mutações via React Query `useMutation` → `api.ts` → NestJS REST
- `api.ts` intercepta 401 → chama `/auth/refresh` → repete request original
- Componentes de UI: shadcn/ui como base; estender com Tailwind
- Imagens: sempre `next/image`; fontes: sempre `next/font`

## Planos

| Plano | Limite | Features exclusivas |
|-------|--------|-------------------|
| Gratuito | 8 pacientes ativos | — |
| Pro | Ilimitados | Automações, cobrança digital Stripe, relatórios avançados |
| Clínica | Ilimitados | Pro + até 3 agendas + insights avançados |

## Segurança (não negociável)

- `JwtAuthGuard` global; `@Public()` apenas em auth + agendamento público
- `psychologist_id = req.user.id` em toda query de dados
- `CryptoService` (AES-256-CBC) em todos os campos clínicos antes de gravar no banco
- bcrypt `saltRounds: 12` para senhas
- Rate limiting: 100 req/min por IP; 5 tentativas de login → bloqueio 15 min
- Refresh token: apenas hash SHA-256 no banco; valor real em httpOnly cookie `Secure; SameSite=Strict`
- Stripe webhooks: `stripe.webhooks.constructEvent()` antes de processar
- Upload: validação de MIME type + tamanho máximo antes de enviar ao R2
- Prontuários: nunca DELETE em `medical_records` (apenas UPDATE com versionamento)
- `ENCRYPTION_KEY`, `JWT_PRIVATE_KEY`, `STRIPE_SECRET_KEY` nunca expostos ao frontend

## Estado atual

Fase: Planning | Dev: não iniciado
Última atualização: 2026-06-05
