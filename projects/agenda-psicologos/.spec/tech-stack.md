# Tech Stack — PsiAgenda

> Definido em: 2026-04-27
> Desenvolvedor: solo
> Perfil: Mobile-first SaaS, MVP, custo baixo, conformidade LGPD/CFP

---

## Visão geral da stack

| Camada | Escolha | Versão mínima |
|---|---|---|
| Framework full-stack | Next.js (App Router) | 14.2+ |
| Linguagem | TypeScript | 5.4+ |
| Banco de dados | MySQL via Docker | MySQL 8.0+ |
| Auth | NextAuth.js (Auth.js) | v5 (beta) |
| ORM | Prisma | 5.14+ |
| UI base | shadcn/ui + Tailwind CSS | Tailwind 3.4+ |
| Email transacional | Resend | — |
| Pagamentos | Stripe | — |
| Monitoramento | Sentry | — |
| Package manager | pnpm | 9+ |

---

## Decisões por camada

### Framework — Next.js 14+ com App Router

**Justificativa:** Resolve frontend e backend em um único repositório. Server Components eliminam
round-trips desnecessários, o que é crítico para mobile com conexão instável. API Routes e
Server Actions permitem lógica de backend sem infraestrutura separada. É o framework com maior
ecosistema e documentação ativa para SaaS solo em 2024-2026.

**Alternativa descartada:** Remix — excelente para forms e mutações, mas ecosistema menor,
menos componentes de UI disponíveis e Vercel (plataforma natural para Next.js) não oferece
vantagem de deploy para Remix.

### Linguagem — TypeScript

**Justificativa:** Type safety end-to-end reduz bugs em runtime, especialmente importante
para dados sensíveis de saúde. A integração com Prisma gera tipos do banco automaticamente,
garantindo consistência entre modelo de dados e código.

### Banco — MySQL 8 via Docker

**Justificativa:** MySQL 8 é estável, amplamente suportado e suficiente para o MVP. Docker
garante ambiente idêntico entre desenvolvimento e produção sem dependência de serviço externo.
O isolamento de dados entre psicólogos é feito na camada de aplicação (sempre filtrando por
`user_id` nas queries) — não requer Row Level Security.

**Setup local:** `docker-compose.yml` na raiz do projeto sobe o MySQL. Só o banco roda em
Docker — a aplicação Next.js roda diretamente (`pnpm dev`).

```yaml
# docker-compose.yml
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: psiagenda
      MYSQL_USER: psiagenda
      MYSQL_PASSWORD: psiagenda
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### ORM — Prisma

**Justificativa:** Migrations versionadas e geração automática de tipos TypeScript. O impl-agent
pode trabalhar com o esquema de forma segura sem escrever SQL raw. Prisma suporta MySQL
nativamente sem configuração especial.

**Alternativa descartada:** Drizzle — mais leve e mais próximo de SQL, mas tooling de migrations
ainda menos maduro e DX inferior para equipe solo sem DBA.

### UI — shadcn/ui + Tailwind CSS

**Justificativa:** shadcn/ui entrega componentes acessíveis (Radix UI por baixo) sem biblioteca
de estilos pesada. Tailwind permite customizar mobile-first com breakpoints explícitos. Componentes
são copiados para o projeto, não importados como dependência — sem lock-in. PsiAgenda precisa
de mobile-first real: shadcn/ui tem componentes como Sheet, Drawer e Calendar que funcionam
bem em toque.

**Alternativa descartada:** Chakra UI — maior bundle, menos controle sobre estilo, deprecação
ativa do v2.

### Auth — NextAuth.js v5 (Auth.js)

**Justificativa:** Solução de auth nativa para Next.js, sem serviço externo. Suporta
Credentials provider (email/senha com bcrypt) e Email provider (magic link para reset de
senha via Resend). Sessão gerenciada via cookies httpOnly assinados com `AUTH_SECRET`.

**Nota de segurança:** Prontuário é protegido por autenticação de sessão + filtro obrigatório
por `userId` em toda query de banco. Sem autenticação válida, nenhuma rota `/(auth)/` é acessível
(middleware NextAuth protege automaticamente).

### Email transacional — Resend

**Justificativa:** API REST simples, free tier de 3.000 e-mails/mês. Suporte a React Email
para templates com tipo-safe. Usado para: reset de senha, link de lembrete de consulta
(fallback quando psicólogo não tem plano pro), notificações de confirmação.

**Alternativa descartada:** SendGrid — free tier menor (100/dia), API mais verbosa, dashboard
mais complexo para developer solo.

### Pagamentos — Stripe

**Justificativa:** Padrão de mercado para SaaS. Suporte nativo a subscriptions recorrentes
(R$ 39/mês), webhook confiável para eventos de pagamento, documentação excelente.
Checkout hospedado elimina necessidade de PCI compliance no servidor do produto.

**Custo:** 2.5% + R$ 0.50 por transação bem-sucedida. Para R$ 39/mês, custo é ~R$ 1.48 por
assinante.

### Monitoramento — Sentry

**Justificativa:** Free tier de 5.000 erros/mês. Captura erros de frontend e backend com
stack traces completas. Alertas por e-mail para erros críticos. Essencial para produto em
produção com dados sensíveis de saúde.

---

## Versões de dependências principais

```json
{
  "next": "14.2.x",
  "react": "18.3.x",
  "typescript": "5.4.x",
  "@prisma/client": "5.14.x",
  "prisma": "5.14.x",
  "next-auth": "5.0.0-beta.x",
  "@auth/prisma-adapter": "2.x",
  "bcryptjs": "2.4.x",
  "tailwindcss": "3.4.x",
  "zod": "3.23.x",
  "date-fns": "3.6.x",
  "@sentry/nextjs": "8.x",
  "stripe": "15.x",
  "resend": "3.x"
}
```

---

## Comandos do projeto

| Operação | Comando |
|---|---|
| Instalar dependências | `pnpm install` |
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Start produção | `pnpm start` |
| Lint | `pnpm lint` |
| Type-check | `pnpm typecheck` |
| Testes unitários | `pnpm test` |
| Testes com watch | `pnpm test:watch` |
| Cobertura de testes | `pnpm test:coverage` |
| Criar migration | `pnpm db:migrate` |
| Aplicar migration (prod) | `pnpm db:migrate:deploy` |
| Abrir Prisma Studio | `pnpm db:studio` |
| Gerar client Prisma | `pnpm db:generate` |
| Reset banco (dev) | `pnpm db:reset` |
| Seed de dados | `pnpm db:seed` |

**Scripts em `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint && tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "db:reset": "prisma migrate reset",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

## Ferramentas de desenvolvimento

| Ferramenta | Pacote | Finalidade |
|---|---|---|
| Linter | ESLint + next/eslint-config | Padrões de código |
| Formatter | Prettier 3.x | Formatação automática |
| Test runner | Vitest 1.x | Testes unitários e de integração |
| Test mocks | @testing-library/react | Testes de componentes |
| Pre-commit | Husky + lint-staged | Lint antes do commit |
| Commit convention | Commitlint + conventional commits | Histórico legível |
| Env validation | @t3-oss/env-nextjs | Validação de variáveis de ambiente |
| Schema validation | Zod | Validação runtime de inputs |
| Date handling | date-fns | Manipulação de datas (sem dayjs/moment) |
| HTTP client (server) | fetch nativo (Node 18+) | Chamadas HTTP |

---

## Variáveis de ambiente

Arquivo `.env.local` (desenvolvimento).

```bash
# Banco (Prisma + MySQL)
DATABASE_URL="mysql://psiagenda:psiagenda@localhost:3306/psiagenda"

# Auth (NextAuth.js v5)
AUTH_SECRET=32-char-random-string-para-sessao   # openssl rand -base64 32

# Resend (e-mail transacional + reset de senha)
RESEND_API_KEY=re_[api-key]
RESEND_FROM_EMAIL=noreply@psiagenda.com.br

# Stripe
STRIPE_SECRET_KEY=sk_test_[chave-de-teste]
STRIPE_WEBHOOK_SECRET=whsec_[webhook-signing-secret]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[chave-publica-teste]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_SECRET=32-char-random-string-para-tokens-hmac

# Sentry
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project-id]
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project-id]
SENTRY_AUTH_TOKEN=[token-para-source-maps]
```

**`AUTH_SECRET`:** Assina cookies de sessão do NextAuth. Gerar com `openssl rand -base64 32`.
**`APP_SECRET`:** Assina tokens de confirmação de consulta (HMAC-SHA256). Variável separada do `AUTH_SECRET` por princípio de separação de responsabilidades. Nunca expor ao cliente.

---

## Padrão de commit

Formato: `<type>(<scope>): <description>`

| Tipo | Quando usar |
|---|---|
| `feat` | Nova feature ou comportamento |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição ou ajuste de testes |
| `chore` | Configuração, deps, scripts |
| `docs` | Documentação |
| `style` | Formatação, espaçamento (sem lógica) |

**Exemplos:**
```
feat(appointments): adicionar página de agendamento semanal
fix(tokens): corrigir expiração de token de confirmação
test(patients): adicionar testes unitários para validação de campos
chore(deps): atualizar prisma para 5.14
```

**Escopo (`scope`) segue os domínios do produto:**
`auth`, `patients`, `appointments`, `tokens`, `notes`, `payments`, `billing`, `reminders`

---

## Custo estimado de infra (MVP)

| Serviço | Tier | Custo mensal |
|---|---|---|
| MySQL (Docker local) | Auto-hospedado | R$ 0 (incluso no servidor) |
| Resend | Free (3k e-mails/mês) | R$ 0 |
| Stripe | Por transação (2.5% + R$0.50) | Variável |
| Sentry | Free (5k erros/mês) | R$ 0 |
| **Total fixo MVP** | | **R$ 0** |
