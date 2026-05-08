# Skill: Runtime Constraint Mapper

Você sabe mapear as restrições de runtime de um projeto Next.js e documentá-las
em `runtime-constraints.md` antes de qualquer feature ser implementada.

## Por que isso existe

Next.js executa código em múltiplos contextos com restrições radicalmente
diferentes. Um import inofensivo em uma Server Action pode quebrar toda a build
se importado no middleware. Documentar isso explicitamente evita que o impl-agent
tome decisões que parecem corretas mas são incompatíveis com o runtime do arquivo.

## Mapa de runtimes no Next.js

| Contexto | Runtime | Pode usar Prisma? | Pode usar Node? |
|---|---|---|---|
| `src/middleware.ts` | Edge | ❌ | ❌ |
| `src/app/api/` com `export const runtime = 'edge'` | Edge | ❌ | ❌ |
| `src/app/api/` (padrão) | Node.js | ✅ | ✅ |
| `src/app/**/page.tsx` (Server Component) | Node.js | ✅ | ✅ |
| `src/app/**/layout.tsx` | Node.js | ✅ | ✅ |
| `src/features/**/actions/` (Server Actions) | Node.js | ✅ | ✅ |
| `src/features/**/queries/` | Node.js | ✅ | ✅ |
| `"use client"` components | Browser | ❌ | ❌ |

## Imports proibidos em Edge Runtime

Nunca em `middleware.ts` ou qualquer arquivo com `export const runtime = 'edge'`:

- `@prisma/client` — usa módulos nativos Node.js (`fs`, `net`, `tls`)
- `bcryptjs` / `bcrypt` — usa bindings nativos
- `nodemailer` — usa módulos `net` e `tls`
- `crypto` do Node (use `globalThis.crypto` — Web Crypto API, disponível no Edge)
- Qualquer pacote que internamente use `fs`, `path`, `net`, `tls`, `os`, `child_process`

## Padrão obrigatório: auth split com NextAuth.js v5

NextAuth.js v5 exporta `auth()` que usa o Prisma Adapter internamente.
Isso torna `auth.ts` incompatível com Edge Runtime.

**Nunca importe `auth` diretamente no middleware:**
```typescript
// ❌ ERRADO — auth.ts importa Prisma, quebra no Edge
import { auth } from "@/shared/lib/auth"
export default auth  // Edge Runtime violation
```

**Solução obrigatória — separar em dois arquivos:**

```typescript
// src/shared/lib/auth.config.ts — Edge-safe
// Apenas providers e callbacks que NÃO usam Prisma
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig: NextAuthConfig = {
  providers: [Credentials({ ... })],
  callbacks: {
    authorized({ auth, request }) {
      return !!auth?.user  // só verifica se sessão existe
    },
  },
  pages: { signIn: "/login" },
}

// src/shared/lib/auth.ts — Node.js only
// Usa PrismaAdapter e callbacks completos
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { authConfig } from "./auth.config"

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  callbacks: {
    session({ session, token }) { ... },
    jwt({ token, user }) { ... },
  },
})

// src/middleware.ts — importa auth.config, não auth
import NextAuth from "next-auth"
import { authConfig } from "@/shared/lib/auth.config"

export const { auth: middleware } = NextAuth(authConfig)
export const config = { matcher: [...] }
```

## Como criar runtime-constraints.md

1. Leia `architecture.md` — identifique todos os arquivos em contexto Edge
   (middleware, edge routes)
2. Leia `tech-stack.md` — identifique bibliotecas e verifique se usam módulos
   nativos Node.js
3. Para cada caminho/pasta, determine o runtime com base no mapa acima
4. Se o projeto usa NextAuth com banco de dados: documente o padrão auth-split
   como obrigatório
5. Liste os imports proibidos por contexto
6. Se já há código no projeto: verifique se existem violações e liste-as

## Template de runtime-constraints.md

```markdown
# Runtime Constraints — [projeto]

> Gerado em: [data]
> Stack: [resumo da stack]

## Mapa de Runtime

| Arquivo / Pasta | Runtime | Pode usar Prisma? | Notas |
|---|---|---|---|
| src/middleware.ts | Edge | ❌ | Apenas auth check via JWT |
| src/app/api/auth/[...nextauth]/route.ts | Node.js | ✅ | NextAuth handler |
| src/app/**/page.tsx | Node.js | ✅ | Server Components |
| src/app/**/layout.tsx | Node.js | ✅ | |
| src/features/**/actions/ | Node.js | ✅ | Server Actions |
| src/features/**/queries/ | Node.js | ✅ | |
| "use client" components | Browser | ❌ | |

## Imports proibidos no middleware.ts

- `@prisma/client` ❌
- `bcryptjs` ❌
- Qualquer import de `next-auth` que usa PrismaAdapter ❌

## Padrão auth split obrigatório

[descreva o padrão específico do projeto com os caminhos reais]

## Violações conhecidas

[lista de violações encontradas no código existente, ou "nenhuma"]
```
