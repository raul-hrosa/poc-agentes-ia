# Runtime Constraints — PsiAgenda

> Gerado em: 2026-05-07 (retroativo — Fase 1.5)
> Stack: Next.js 14 + NextAuth.js v5 + Prisma + MySQL

## Mapa de Runtime

| Arquivo / Pasta | Runtime | Pode usar Prisma? | Notas |
|---|---|---|---|
| `src/middleware.ts` | Edge | ❌ | Apenas auth check via JWT. Nunca importar Prisma ou bcrypt. |
| `src/app/api/auth/[...nextauth]/route.ts` | Node.js | ✅ | NextAuth handler — usa auth.ts completo |
| `src/app/api/webhooks/stripe/route.ts` | Node.js | ✅ | Webhook Stripe |
| `src/app/confirm/[token]/page.tsx` | Node.js | ✅ | Página pública de confirmação |
| `src/app/(auth)/**/page.tsx` | Node.js | ✅ | Server Components autenticados |
| `src/app/(auth)/**/layout.tsx` | Node.js | ✅ | Layouts autenticados |
| `src/app/(public)/**/page.tsx` | Node.js | ✅ | Páginas públicas |
| `src/features/**/actions/` | Node.js | ✅ | Server Actions |
| `src/features/**/queries/` | Node.js | ✅ | Data fetching |
| `src/shared/lib/auth.ts` | Node.js | ✅ | Configuração completa NextAuth + PrismaAdapter |
| `src/shared/lib/auth.config.ts` | Edge | ❌ | Apenas providers e callbacks sem Prisma — usado pelo middleware |

## Imports proibidos em `src/middleware.ts`

- `@prisma/client` ❌ — usa módulos nativos Node.js
- `bcryptjs` ❌ — usa bindings nativos
- `next-auth` com PrismaAdapter ❌ — use apenas `auth.config.ts`
- `src/shared/lib/auth` ❌ — este arquivo usa PrismaAdapter (Node.js only)
- `src/shared/lib/prisma` ❌ — Prisma Client usa módulos nativos Node

## Padrão obrigatório: auth split (NextAuth v5 + Prisma)

O middleware DEVE importar apenas `auth.config.ts`, nunca `auth.ts`.

```typescript
// src/shared/lib/auth.config.ts  ← Edge-safe
// Contém: providers (Credentials), callbacks de autorização via JWT
// NÃO contém: PrismaAdapter, bcrypt.compare, queries de banco
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async () => null, // authorize real fica em auth.ts
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
  },
  pages: { signIn: "/login" },
}

// src/shared/lib/auth.ts  ← Node.js only
// Contém: PrismaAdapter, bcrypt.compare, callbacks completos com DB
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  // callbacks completos que usam Prisma ficam aqui
})

// src/middleware.ts  ← Edge Runtime
import NextAuth from "next-auth"
import { authConfig } from "@/shared/lib/auth.config"

export const { auth: middleware } = NextAuth(authConfig)
export const config = {
  matcher: ["/(auth)/:path*"],
}
```

## Violações conhecidas (encontradas no primeiro run — 2026-05-07)

| Arquivo | Violação | Status |
|---|---|---|
| `src/middleware.ts` | Importa `auth` de `src/shared/lib/auth` (que usa PrismaAdapter) | ❌ pendente correção |
| `src/shared/lib/auth.ts` | Arquivo único sem split Edge/Node — PrismaAdapter importado em contexto que o middleware referencia | ❌ pendente correção |

**Correção necessária:**
1. Criar `src/shared/lib/auth.config.ts` com providers e callbacks Edge-safe
2. Refatorar `src/shared/lib/auth.ts` para usar o `auth.config.ts`
3. Atualizar `src/middleware.ts` para importar de `auth.config.ts`

O arquivo `src/shared/lib/auth.config.ts` já existe como arquivo não-rastreado
no git — verificar se o conteúdo está correto e fazer o split completo.
