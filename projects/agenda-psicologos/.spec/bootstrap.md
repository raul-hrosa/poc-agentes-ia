# Bootstrap Spec — PsiAgenda

> Criado em: 2026-05-07
> Fase: 1.5 — Bootstrap retroativo
> Contexto: MVP implementado mas projeto não funciona no primeiro run.
> Esta spec define o que o bootstrap-agent deve criar para corrigir isso.

## Situação atual

O MVP das 7 features foi implementado e revisado, mas falha ao rodar
pela primeira vez. Os problemas identificados:

1. Middleware com Prisma no Edge Runtime (incompatível)
2. Migrations sem schema base consolidado
3. Homepage é o template padrão do create-next-app
4. Layout autenticado sem menu de navegação
5. Dashboard é um stub vazio
6. `prisma/seed.ts` não existia
7. Seed não carrega `.env.local`
8. Design das telas sem identidade visual

## O que o bootstrap-agent deve criar

### 1. Corrigir o app shell

#### Homepage (`src/app/page.tsx`)

Substituir o template padrão por uma landing page mínima do PsiAgenda:

- Header: logo "PsiAgenda" + botão "Entrar" (link para /login)
- Hero: headline + subheadline + CTA para cadastro
  - Headline: "A agenda mais simples para psicólogos que estão começando"
  - Subheadline: "Sem burocracia. Sem custo alto. Confirmação automática de consultas."
  - CTA primário: "Começar grátis" → `/register`
  - CTA secundário: "Já tenho conta" → `/login`
- 3 cards de benefício: confirmação automática, prontuário simples, controle financeiro
- Footer simples: "PsiAgenda © 2026"

Usar design-tokens.md: fonte Inter, primary azul-teal, layout centralizado.

#### Layout autenticado (`src/app/(auth)/layout.tsx`)

Criar layout com navegação lateral completa:

**Links de navegação (ler mvp-scope.md para confirmar):**
- Dashboard → `/dashboard`
- Pacientes → `/patients`
- Agenda → `/appointments`
- Financeiro → `/financeiro`

**Mobile:** Header com logo + hambúrguer → Sheet lateral com os links
**Desktop (`md:`):** Sidebar fixo `w-56` com links + logout no rodapé

Logout: chamar `signOut` do `src/shared/lib/auth.ts`

#### Dashboard (`src/app/(auth)/dashboard/page.tsx`)

Substituir o stub por dashboard real com Server Components:

**Cards de resumo (linha superior):**
- "Consultas hoje": buscar com `getWeekAppointments` filtrando pela data atual
- "Pacientes ativos": buscar com `countActivePatients` de `features/patients/queries`
- "Pagamentos pendentes": buscar com `getFinancialSummary` do mês atual

**Seção principal:**
- Lista das próximas 5 consultas da semana
- Link "Ver agenda completa" → `/appointments`

**Estado vazio (zero consultas hoje):**
- Mensagem: "Nenhuma consulta hoje"
- CTA: "Agendar consulta" → `/appointments/new`

Importar queries das features existentes — não criar queries novas.

### 2. Consolidar migration base

Verificar `prisma/migrations/`. Se existem migrations parciais deletadas
(como no histórico git), garantir que existe uma migration `init` funcional
que cria todo o schema do zero.

Rodar `pnpm db:reset` apenas se necessário para consolidar.
O objetivo: `pnpm db:migrate:deploy` funciona em ambiente limpo.

### 3. Criar `prisma/seed.ts`

Criar seed com dados de desenvolvimento realistas:

**Credenciais do usuário de dev (documentar no topo do arquivo):**
- Email: `dev@psiagenda.com`
- Senha: `Dev@12345`

**Dados a criar:**
- 1 usuário psicólogo (acima)
- 5 pacientes com nomes, emails e telefones plausíveis
- 10 consultas distribuídas:
  - 2 hoje (1 scheduled, 1 confirmed)
  - 3 nos próximos 7 dias (scheduled)
  - 3 na semana passada (2 completed, 1 no_show)
  - 2 canceladas no passado
- 1 session note para uma consulta completed
- 1 session payment para uma consulta completed (status: paid)

**Estrutura obrigatória do seed:**
```typescript
import { PrismaClient } from "@prisma/client"
import { config } from "dotenv"
import { resolve } from "path"
import bcrypt from "bcryptjs"

// OBRIGATÓRIO: carregar .env.local explicitamente
config({ path: resolve(__dirname, "../.env.local") })

const prisma = new PrismaClient()

async function main() {
  console.log("Limpando dados existentes...")
  // deletar na ordem correta (respeitar foreign keys)

  console.log("Criando usuário de desenvolvimento...")
  // DEV: dev@psiagenda.com / Dev@12345

  console.log("Criando pacientes...")
  // 5 pacientes

  console.log("Criando consultas...")
  // 10 consultas com status variados

  console.log("Seed concluído.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

### 4. Criar `.env.example`

Baseado em `tech-stack.md` seção "Variáveis de ambiente":

```bash
# PsiAgenda — Variáveis de Ambiente
# Copie este arquivo para .env.local e preencha os valores

# ============================================================
# BANCO DE DADOS (Prisma + MySQL)
# ============================================================
DATABASE_URL="mysql://psiagenda:psiagenda@localhost:3306/psiagenda"

# ============================================================
# AUTENTICAÇÃO (NextAuth.js v5)
# Gere com: openssl rand -base64 32
# ============================================================
AUTH_SECRET="seu-secret-aqui-32-caracteres-minimo"

# ============================================================
# EMAIL (Resend)
# Crie conta em resend.com — free tier: 3.000 emails/mês
# ============================================================
RESEND_API_KEY="re_SeuApiKeyAqui"
RESEND_FROM_EMAIL="noreply@seudominio.com.br"

# ============================================================
# PAGAMENTOS (Stripe)
# Use chaves de teste durante desenvolvimento
# ============================================================
STRIPE_SECRET_KEY="sk_test_SuaChaveSecretaAqui"
STRIPE_WEBHOOK_SECRET="whsec_SeuWebhookSecretAqui"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_SuaChavePublicaAqui"

# ============================================================
# APLICAÇÃO
# ============================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Tokens de confirmação de consulta (HMAC-SHA256)
# Gere com: openssl rand -base64 32
APP_SECRET="seu-app-secret-aqui-32-caracteres"

# ============================================================
# MONITORAMENTO (Sentry) — opcional em desenvolvimento
# ============================================================
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
```

### 5. Corrigir violação de runtime (middleware)

Verificar e executar o split auth conforme `runtime-constraints.md`:

**Ação:**
1. Verificar conteúdo atual de `src/shared/lib/auth.config.ts` (já existe não-rastreado)
2. Garantir que `auth.config.ts` não importa Prisma nem bcrypt
3. Garantir que `src/middleware.ts` importa de `auth.config.ts`, não de `auth.ts`
4. Se o split ainda não estiver correto, criar `bugs/runtime-violation-middleware.md`
   e registrar como blocker (correção via debug-agent)

## Gate de saída

Após criar o app shell, seed e .env.example, executar:

```
pnpm install
pnpm db:generate
pnpm typecheck
pnpm build
pnpm test
```

Todos devem passar antes de marcar o bootstrap como concluído.
Se `pnpm build` falhar com Edge Runtime error → documentar em bugs/
e informar o usuário que a violação de middleware precisa ser corrigida.

## Definition of Done do Bootstrap

- [ ] Homepage com branding PsiAgenda (não template padrão)
- [ ] Layout autenticado com navegação para 4 features
- [ ] Dashboard com dados reais (não stub)
- [ ] `prisma/seed.ts` carrega `.env.local` e cria dados de dev
- [ ] `.env.example` com todas as variáveis documentadas
- [ ] `pnpm build` passa sem erros
- [ ] `pnpm test` passa
- [ ] Violações de runtime documentadas (corrigidas ou em bugs/)
