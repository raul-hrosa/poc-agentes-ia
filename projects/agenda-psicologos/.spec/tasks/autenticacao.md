# Tasks — autenticacao

**Feature:** Autenticação e Acesso Seguro
**Slug:** `autenticacao`
**Criado em:** 2026-04-27
**Status:** aguardando aprovação

---

## Resumo

10 tasks cobrindo as camadas: schema/config, tipos, queries, Server Actions, UI e middleware.
A feature é a fundação do sistema — todas as outras features dependem dela.

---

## Tasks

### TASK-01: configurar NextAuth.js v5 com Credentials Provider e Prisma Adapter

- **Status:** todo
- **Dependências:** nenhuma
- **target_path:** projects/agenda-psicologos/src/shared/lib/auth.ts
- **Estimativa:** M

**O que fazer:**

Instalar e configurar NextAuth.js v5 (`next-auth@beta`) com:

1. Instalar dependências: `next-auth@beta`, `@auth/prisma-adapter`, `bcryptjs`, `@types/bcryptjs`

2. Criar `src/shared/lib/auth.ts` com a configuração central do NextAuth:
   - `CredentialsProvider` que recebe `email` e `password`, busca o usuário no banco via Prisma (`prisma.user.findUnique({ where: { email } })`), compara a senha com `bcrypt.compare(password, user.password)` usando fator de custo 12, e retorna o objeto `{ id, name, email }` se válido ou `null` se inválido
   - `PrismaAdapter` configurado com o singleton de `shared/lib/prisma.ts`
   - Callback `jwt` que persiste `token.id = user.id` ao criar o token
   - Callback `session` que copia `session.user.id = token.id` para que o `session.user.id` contenha o UUID do psicólogo
   - `session.strategy: "jwt"` com `maxAge: 30 * 24 * 60 * 60` (30 dias — RN-03)
   - Páginas customizadas: `signIn: "/login"`, `error: "/login"`

3. Criar `src/app/api/auth/[...nextauth]/route.ts` exportando os handlers `GET` e `POST` do NextAuth

4. Adicionar variáveis no `.env.example`:
   ```
   AUTH_SECRET=          # openssl rand -base64 32
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=noreply@psiagenda.com.br
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. Criar `src/features/auth/types.ts` com:
   ```typescript
   export type AuthUser = {
     id: string
     name: string
     email: string
   }
   ```

**Nota:** O Email Provider do NextAuth (para reset de senha via Resend) NÃO é configurado aqui — o reset de senha será implementado via token customizado (TASK-02 e TASK-08). O NextAuth gerencia apenas Credentials Provider nesta task.

**Critérios de aceite desta task:**
- [ ] `next-auth`, `@auth/prisma-adapter`, `bcryptjs` instalados no `package.json`
- [ ] `src/shared/lib/auth.ts` exporta `{ handlers, auth, signIn, signOut }`
- [ ] `src/app/api/auth/[...nextauth]/route.ts` exporta `{ GET, POST }` dos handlers
- [ ] `auth()` pode ser importado e chamado em Server Components sem erro de tipo
- [ ] `session.user.id` é tipado como `string` (não `string | undefined`)
- [ ] `.env.example` contém todas as variáveis necessárias para a feature
- [ ] `pnpm typecheck` passa sem erros
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

### TASK-02: criar tabela de tokens de reset de senha no schema Prisma

- **Status:** todo
- **Dependências:** TASK-01
- **target_path:** projects/agenda-psicologos/prisma/schema.prisma
- **Estimativa:** P

**O que fazer:**

Adicionar ao `prisma/schema.prisma` o modelo `PasswordResetToken` para armazenar tokens de redefinição de senha:

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid()) @db.VarChar(36)
  createdAt DateTime @default(now()) @map("created_at")

  email     String   @db.VarChar(255)
  token     String   @unique @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  usedAt    DateTime? @map("used_at")

  @@index([email])
  @@map("password_reset_tokens")
}
```

**Regras de negócio do token (RN-04):**
- Token válido por 1 hora (`expiresAt = now() + 1 hora`)
- Token de uso único: ao ser usado, `usedAt` é preenchido com `now()`
- Se o psicólogo solicitar novo token, o anterior é invalidado (ao gerar novo token para o mesmo e-mail, marcar todos os tokens anteriores não expirados como usados)
- Token não contém o `userId` diretamente — é buscado pelo `email`

Após editar o schema, rodar: `pnpm db:migrate` para criar a migration com nome `add_password_reset_tokens`

**Critérios de aceite desta task:**
- [ ] Modelo `PasswordResetToken` adicionado ao `prisma/schema.prisma` com todos os campos especificados
- [ ] Migration gerada com `pnpm db:migrate` com nome descritivo `add_password_reset_tokens`
- [ ] `pnpm db:generate` executado — Prisma Client atualizado
- [ ] `prisma.passwordResetToken` acessível sem erro de tipo após regenerar o client
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

### TASK-03: criar schemas Zod e query getCurrentUser

- **Status:** todo
- **Dependências:** TASK-01
- **target_path:** projects/agenda-psicologos/src/features/auth/
- **Estimativa:** P

**O que fazer:**

1. Criar `src/features/auth/schema.ts` com os quatro schemas Zod conforme a spec:

```typescript
// src/features/auth/schema.ts
import { z } from "zod"

export const RegisterSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Informe um e-mail válido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })

export const LoginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
})

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })
```

2. Criar `src/features/auth/queries/getCurrentUser.ts`:
   - Importa `auth` de `@/shared/lib/auth`
   - Chama `auth()` para obter a sessão
   - Se `session?.user?.id` não existir, lança `new Error("Não autenticado")`
   - Retorna `{ id: session.user.id, name: session.user.name, email: session.user.email }` tipado como `AuthUser`
   - Esta função é importada no início de toda Server Action protegida

3. Criar `src/features/auth/queries/getUserByEmail.ts`:
   - Recebe `email: string`
   - Usa `prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, password: true } })`
   - Retorna o registro ou `null` se não encontrado
   - Usado em `registerUser` para verificar unicidade de e-mail (RN-01)

**Critérios de aceite desta task:**
- [ ] `src/features/auth/schema.ts` exporta `RegisterSchema`, `LoginSchema`, `ForgotPasswordSchema`, `ResetPasswordSchema`
- [ ] `getCurrentUser()` lança erro se sessão inválida ou ausente
- [ ] `getCurrentUser()` retorna objeto com `id`, `name`, `email` tipados corretamente
- [ ] `getUserByEmail()` retorna `null` quando e-mail não existe no banco
- [ ] Todos os schemas Zod produzem as mensagens de erro exatas definidas nos critérios de aceite da spec
- [ ] `pnpm typecheck` passa sem erros
- [ ] Testes unitários para `getCurrentUser` (com sessão válida, sem sessão) e `getUserByEmail` (encontrado, não encontrado)

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

### TASK-04: criar Server Action registerUser

- **Status:** todo
- **Dependências:** TASK-02, TASK-03
- **target_path:** projects/agenda-psicologos/src/features/auth/actions/registerUser.ts
- **Estimativa:** M

**O que fazer:**

Criar `src/features/auth/actions/registerUser.ts`:

```typescript
"use server"
// Recebe: { name, email, password, confirmPassword }
// 1. Valida com RegisterSchema (Zod) — retorna erros de validação se inválido
// 2. Verifica unicidade de e-mail chamando getUserByEmail(email)
//    - Se existir: retorna erro "Este e-mail já está cadastrado. Tente fazer login." (AC-07, CE-01)
// 3. Gera hash bcrypt: bcrypt.hash(password, 12) — fator de custo 12 (RN-02)
// 4. Cria registro em users: prisma.user.create({ data: { name, email, password: hash } })
// 5. Autentica a sessão automaticamente: signIn("credentials", { email, password, redirect: false })
//    — após criar a conta, o psicólogo já entra autenticado (AC-02)
// 6. Retorna { success: true } ou lança erro
```

**Comportamento de erros:**
- Validação Zod falha: retornar `{ error: { field: "...", message: "..." } }` para cada campo inválido
- E-mail duplicado: retornar `{ error: { field: "email", message: "Este e-mail já está cadastrado. Tente fazer login." } }`
- Falha no banco ou no signIn: lançar erro genérico (capturado pelo Sentry via CE-05)

**Retorno tipado:**
```typescript
type RegisterResult =
  | { success: true }
  | { error: string }
  | { fieldErrors: Record<string, string[]> }
```

**Critérios de aceite desta task:**
- [ ] `registerUser` está em arquivo com `"use server"` no topo
- [ ] Input é validado com `RegisterSchema` antes de qualquer operação
- [ ] Senha é armazenada como hash bcrypt (fator 12) — nunca em texto puro
- [ ] Verificação de e-mail duplicado ocorre antes do `prisma.user.create`
- [ ] Após criação bem-sucedida, `signIn("credentials", ...)` é chamado para autenticar a sessão
- [ ] Mensagem de erro de e-mail duplicado é exatamente: "Este e-mail já está cadastrado. Tente fazer login."
- [ ] Testes unitários cobrem: cadastro válido, e-mail duplicado, senha muito curta, senhas não conferem
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

### TASK-05: criar Server Actions forgotPassword e resetPassword

- **Status:** todo
- **Dependências:** TASK-02, TASK-03
- **target_path:** projects/agenda-psicologos/src/features/auth/actions/
- **Estimativa:** M

**O que fazer:**

Criar dois arquivos de Server Action para o fluxo de recuperação de senha:

**1. `src/features/auth/actions/forgotPassword.ts`:**
```typescript
"use server"
// Recebe: { email }
// 1. Valida com ForgotPasswordSchema (Zod)
// 2. Busca o usuário por e-mail: getUserByEmail(email)
//    - Se NÃO existir: retorna { success: true } SEM enviar e-mail (RN-05 — resposta genérica OWASP)
//    - Se existir: continua
// 3. Invalida tokens anteriores: prisma.passwordResetToken.updateMany({
//      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
//      data: { usedAt: new Date() }
//    })
// 4. Gera token único: crypto.randomBytes(32).toString('hex')
// 5. Salva no banco: prisma.passwordResetToken.create({
//      data: { email, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
//    })  — expiração de 1 hora (RN-04)
// 6. Envia e-mail via Resend (shared/lib/resend.ts) com link:
//    `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
//    - Subject: "Redefinição de senha — PsiAgenda"
//    - Body: HTML simples com o link
// 7. Se Resend falhar: registrar no Sentry, retornar { success: true } mesmo assim (CE-06)
// 8. Retorna sempre { success: true } — nunca revelar se e-mail existe (RN-05)
```

**2. `src/features/auth/actions/resetPassword.ts`:**
```typescript
"use server"
// Recebe: { token, password, confirmPassword }
// 1. Valida com ResetPasswordSchema (Zod)
// 2. Busca token no banco: prisma.passwordResetToken.findUnique({ where: { token } })
//    - Se não encontrado: retorna { error: "Token inválido" }
//    - Se expirado (expiresAt < now()): retorna { error: "Token expirado" }
//    - Se já usado (usedAt != null): retorna { error: "Token já utilizado" }
// 3. Gera novo hash bcrypt: bcrypt.hash(password, 12)
// 4. Em transação atômica (prisma.$transaction):
//    a. Atualiza senha: prisma.user.update({ where: { email: tokenRecord.email }, data: { password: hash } })
//    b. Invalida token: prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } })
// 5. Autentica sessão: signIn("credentials", { email: tokenRecord.email, password, redirect: false })
// 6. Retorna { success: true } — o componente de UI redireciona para /dashboard com toast (AC-26)
```

**Critérios de aceite desta task:**
- [ ] `forgotPassword` retorna `{ success: true }` para e-mail existente E inexistente (resposta idêntica — RN-05)
- [ ] Token expirado após 1 hora é gerado com `Date.now() + 60 * 60 * 1000`
- [ ] Tokens anteriores são invalidados ao gerar novo token para o mesmo e-mail (RN-04)
- [ ] `resetPassword` usa `prisma.$transaction` para garantir atomicidade (atualiza senha + invalida token juntos)
- [ ] `resetPassword` retorna erro específico para token expirado e token já utilizado (AC-27)
- [ ] Após reset bem-sucedido, `signIn("credentials", ...)` é chamado para autenticar a sessão (AC-26)
- [ ] Testes cobrem: e-mail inexistente, token válido, token expirado, token já usado, senha inválida

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

### TASK-06: criar middleware de proteção de rotas

- **Status:** todo
- **Dependências:** TASK-01
- **target_path:** projects/agenda-psicologos/src/middleware.ts
- **Estimativa:** P

**O que fazer:**

Criar `src/middleware.ts` na raiz do diretório `src/` que protege todas as rotas do grupo `(auth)`:

```typescript
// src/middleware.ts
export { auth as middleware } from "@/shared/lib/auth"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
```

O middleware do NextAuth v5 verifica automaticamente a sessão:
- Rotas dentro de `(auth)` (ex: `/dashboard`, `/patients`, `/appointments`, `/notes`, `/payments`, `/settings`): redireciona para `/login?callbackUrl=[url-original]` se não autenticado (AC-20, AC-29)
- Rotas dentro de `(public)` (ex: `/login`, `/register`, `/forgot-password`, `/reset-password`): se o psicólogo JÁ estiver autenticado ao acessar `/login` ou `/register`, redireciona para `/dashboard` (AC-16, AC-09)

Para implementar o redirecionamento de autenticados em rotas públicas, adicionar lógica na configuração do NextAuth em `shared/lib/auth.ts` no callback `authorized`:
```typescript
callbacks: {
  authorized({ auth, request: { nextUrl } }) {
    const isLoggedIn = !!auth?.user
    const isAuthRoute = nextUrl.pathname.startsWith("/(auth)") ||
      ["/dashboard", "/patients", "/appointments", "/notes", "/payments", "/settings"].some(
        p => nextUrl.pathname.startsWith(p)
      )
    const isPublicAuthPage = ["/login", "/register"].includes(nextUrl.pathname)

    if (isAuthRoute && !isLoggedIn) {
      return Response.redirect(new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl))
    }
    if (isPublicAuthPage && isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl))
    }
    return true
  }
}
```

**Critérios de aceite desta task:**
- [ ] `src/middleware.ts` exporta o `auth` do NextAuth como middleware
- [ ] Acessar `/dashboard` sem sessão redireciona para `/login?callbackUrl=/dashboard`
- [ ] Acessar `/login` com sessão ativa redireciona para `/dashboard`
- [ ] Acessar `/register` com sessão ativa redireciona para `/dashboard`
- [ ] Acessar `/forgot-password` e `/reset-password` sem sessão funciona normalmente (sem redirecionamento)
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

### TASK-07: criar página e formulário de cadastro (/register)

- **Status:** todo
- **Dependências:** TASK-04
- **target_path:** projects/agenda-psicologos/src/app/(public)/register/
- **Estimativa:** M

**O que fazer:**

Criar a página de cadastro conforme wireframe da spec (Tela 1):

**1. `src/app/(public)/register/page.tsx`** — Server Component:
- Título `<h1>Crie sua conta</h1>` com logo/nome do produto no topo
- Renderiza o `<RegisterForm />` client component
- Link "Já tem conta? Fazer login" que navega para `/login`

**2. `src/features/auth/components/RegisterForm.tsx`** — Client Component (`"use client"`):
- Formulário com campos: nome completo, e-mail, senha, confirmação de senha
- Campo senha com botão de visibilidade (mostrar/ocultar — `type="password"` / `type="text"`)
- Campo confirmação de senha com botão de visibilidade
- Texto auxiliar "Mínimo 8 caracteres" abaixo do campo senha
- Validação client-side com `LoginSchema` (react-hook-form + zodResolver) para feedback imediato
- Ao submeter: chama `registerUser(formData)` (Server Action da TASK-04)
- Durante submissão: desabilita botão "Criar conta" e exibe indicador de loading (AC-08)
- Exibe erros inline abaixo de cada campo com as mensagens exatas da spec
- Após sucesso (`{ success: true }`): redireciona para `/dashboard` usando `router.push("/dashboard")`
- Campos usam `type="email"` para e-mail e `type="password"` para senha (mobile-first)
- Labels associados via `htmlFor` e `id` (acessibilidade)
- Erros anunciados via `aria-describedby` no campo correspondente

**Mensagens de erro exatas (dos critérios de aceite):**
- Nome vazio: "Nome é obrigatório" (AC-03)
- E-mail inválido: "Informe um e-mail válido" (AC-04)
- Senha curta: "A senha deve ter pelo menos 8 caracteres" (AC-05)
- Senhas não conferem: "As senhas não conferem" (AC-06)
- E-mail já cadastrado: "Este e-mail já está cadastrado. Tente fazer login." (AC-07)

**Critérios de aceite desta task:**
- [ ] Todos os campos do wireframe estão presentes: nome, e-mail, senha, confirmação de senha
- [ ] Botões de visibilidade funcionam nos campos de senha
- [ ] Texto auxiliar "Mínimo 8 caracteres" visível abaixo do campo senha
- [ ] Botão "Criar conta" desabilitado e com loading durante submissão
- [ ] Erros inline exibidos com as mensagens exatas da spec
- [ ] Redirecionamento para `/dashboard` após cadastro bem-sucedido
- [ ] Formulário funciona em viewport 375px sem scroll horizontal
- [ ] Campos de senha usam `type="password"` por padrão
- [ ] Link "Fazer login" navega para `/login`

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

### TASK-08: criar página e formulário de login (/login)

- **Status:** todo
- **Dependências:** TASK-01, TASK-06
- **target_path:** projects/agenda-psicologos/src/app/(public)/login/
- **Estimativa:** M

**O que fazer:**

Criar a página de login conforme wireframe da spec (Tela 2):

**1. `src/app/(public)/login/page.tsx`** — Server Component:
- Título `<h1>Bem-vindo de volta</h1>` com logo/nome do produto no topo
- Renderiza o `<LoginForm />` client component
- Link "Não tem conta? Criar conta grátis" que navega para `/register`

**2. `src/features/auth/components/LoginForm.tsx`** — Client Component (`"use client"`):
- Formulário com campos: e-mail e senha
- Campo senha com botão de visibilidade
- Link "Esqueci minha senha" alinhado à direita abaixo do campo senha, navega para `/forgot-password`
- Ao submeter: chama `signIn("credentials", { email, password, redirect: false })` do NextAuth
- Durante submissão: desabilita botão "Entrar" e exibe loading (AC-15)
- Erro de credenciais: exibe **banner** acima dos campos (não inline) com a mensagem "E-mail ou senha incorretos" (AC-11, AC-12, RN-06) — não indicar qual campo está errado por segurança
- Erros de campo vazio: exibe inline abaixo do campo (AC-13, AC-14)
- Após login bem-sucedido: redireciona para `callbackUrl` se presente na query string, caso contrário para `/dashboard` (AC-10, RN-07)
- Validação de campos vazios antes de submeter: `LoginSchema` via react-hook-form

**Lógica de callbackUrl (RN-07):**
```typescript
const callbackUrl = searchParams.get("callbackUrl")
// Validar que callbackUrl é relativa (começa com "/") para evitar open redirect
const redirectTo = callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard"
router.push(redirectTo)
```

**Critérios de aceite desta task:**
- [ ] Campos e-mail e senha presentes com labels e tipos corretos
- [ ] Botão de visibilidade no campo senha
- [ ] Link "Esqueci minha senha" alinhado à direita abaixo do campo senha
- [ ] Erro de credenciais exibido como banner acima dos campos (não inline)
- [ ] Mensagem de erro é exatamente: "E-mail ou senha incorretos" (sem indicar qual campo)
- [ ] Erros de campo vazio exibidos inline abaixo do campo
- [ ] Botão "Entrar" desabilitado com loading durante submissão
- [ ] Redirecionamento para `callbackUrl` relativa após login, ou `/dashboard` como padrão
- [ ] `callbackUrl` externo (absoluto) é ignorado — redireciona para `/dashboard`
- [ ] Formulário funciona em viewport 375px sem scroll horizontal

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

### TASK-09: criar páginas de recuperação e redefinição de senha

- **Status:** todo
- **Dependências:** TASK-05
- **target_path:** projects/agenda-psicologos/src/app/(public)/
- **Estimativa:** M

**O que fazer:**

Criar as páginas de recuperação e redefinição de senha conforme wireframes (Telas 3 e 4):

**1. `src/app/(public)/forgot-password/page.tsx`** — Server Component que renderiza `<ForgotPasswordForm />`

**2. `src/features/auth/components/ForgotPasswordForm.tsx`** — Client Component:
- Campo de e-mail com label "E-mail *" e `type="email"`
- Botão "Enviar instruções" (largura total, desabilitado durante submissão)
- Link "< Voltar para login" no topo que navega para `/login`
- Ao submeter: chama `forgotPassword({ email })` (Server Action da TASK-05)
- Após resposta (sucesso ou não — sempre): muda para **estado de confirmação** sem revelar se e-mail existe:
  - Exibe: "Verifique seu e-mail" + "Enviamos as instruções de redefinição de senha para o e-mail informado."
  - Nota: "Não recebeu? Verifique a pasta de spam ou tente novamente."
  - Botão "Tentar novamente" que volta para o formulário (AC-23, AC-24)
  - Link "Voltar para login" que navega para `/login`

**3. `src/app/(public)/reset-password/page.tsx`** — Server Component:
- Lê `token` da query string: `searchParams.token`
- Se `token` ausente: exibe estado de erro com "Link inválido"
- Renderiza `<ResetPasswordForm token={token} />`

**4. `src/features/auth/components/ResetPasswordForm.tsx`** — Client Component:
- Recebe `token: string` como prop
- Estado com token válido (AC-25): campos de nova senha e confirmação com botões de visibilidade, botão "Redefinir senha"
- Estado com token inválido/expirado (AC-27): exibe "Este link de redefinição é inválido ou expirou. Solicite um novo link." com botão "Solicitar novo link" que navega para `/forgot-password`
- Ao submeter: chama `resetPassword({ token, password, confirmPassword })`
- Erros de validação: exibidos inline (senha curta, senhas não conferem — AC-28)
- Após sucesso: redireciona para `/dashboard` com toast "Senha redefinida com sucesso" (AC-26)
  - Para o toast usar o componente Sonner ou similar disponível no projeto via shadcn/ui

**Critérios de aceite desta task:**
- [ ] Formulário de recuperação exibe sempre a mesma mensagem de confirmação independente de o e-mail existir
- [ ] Estado de confirmação do forgot-password não revela se o e-mail existe
- [ ] Página de reset-password valida o token (expirado/inválido) e exibe estado de erro específico
- [ ] Estado de erro exibe exatamente: "Este link de redefinição é inválido ou expirou. Solicite um novo link."
- [ ] Botão "Solicitar novo link" navega para `/forgot-password`
- [ ] Após reset bem-sucedido: redireciona para `/dashboard` com toast "Senha redefinida com sucesso"
- [ ] Ambos os formulários funcionam em viewport 375px sem scroll horizontal

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

### TASK-10: criar componente UserMenu com logout no header

- **Status:** todo
- **Dependências:** TASK-01, TASK-06
- **target_path:** projects/agenda-psicologos/src/features/auth/components/UserMenu.tsx
- **Estimativa:** P

**O que fazer:**

Criar o componente de menu do perfil no header conforme wireframe (seção "Menu do perfil"):

**1. `src/features/auth/components/UserMenu.tsx`** — Client Component (`"use client"`):
- Exibe avatar (inicial do nome em círculo colorido) ou `avatarUrl` se disponível, e o nome do psicólogo
- Dropdown com as opções:
  - "Meu perfil" (navega para `/settings`)
  - "Configurações" (navega para `/settings`)
  - Separador visual
  - "Sair" — ao clicar chama `signOut({ redirectTo: "/login" })` do NextAuth (AC-19)
- Dropdown acessível via teclado (usar componente `DropdownMenu` do shadcn/ui)
- Ao clicar "Sair": invalida a sessão no servidor, remove cookie e redireciona para `/login`

**2. Integrar `<UserMenu />` no layout de rotas autenticadas:**
- Editar ou criar `src/app/(auth)/layout.tsx` para incluir um header com o `<UserMenu />`
- O layout deve carregar os dados do usuário autenticado via `auth()` e passar para o `<UserMenu />`

**Dados necessários do usuário:**
- `session.user.name` — nome do psicólogo
- `session.user.email` — e-mail
- `session.user.id` — ID (para eventual link para perfil)

**Critérios de aceite desta task:**
- [ ] Avatar com inicial do nome exibido quando não há `avatarUrl`
- [ ] Nome do psicólogo visível no header
- [ ] Dropdown abre ao clicar no avatar/nome
- [ ] Opção "Sair" chama `signOut()` e redireciona para `/login`
- [ ] Após logout: cookie de sessão removido e acesso a rotas protegidas redireciona para `/login`
- [ ] `UserMenu` presente no layout de todas as rotas protegidas `(auth)`
- [ ] Componente funciona em viewport 375px — target de toque mínimo 44x44px no avatar

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
TASK-01 (NextAuth config + API route)
  ├── TASK-02 (schema PasswordResetToken) [sequencial após TASK-01]
  │     └── TASK-05 (Server Actions forgotPassword + resetPassword) [sequencial após TASK-02]
  │           └── TASK-09 (páginas /forgot-password e /reset-password) [sequencial após TASK-05]
  │
  ├── TASK-03 (schemas Zod + getCurrentUser + getUserByEmail) [paralelo com TASK-02]
  │     └── TASK-04 (Server Action registerUser) [sequencial após TASK-02 E TASK-03]
  │           └── TASK-07 (página /register) [sequencial após TASK-04]
  │
  └── TASK-06 (middleware de proteção de rotas) [paralelo com TASK-02 e TASK-03]
        ├── TASK-08 (página /login) [sequencial após TASK-06, pode rodar paralelo com TASK-07]
        └── TASK-10 (UserMenu + logout) [sequencial após TASK-06, pode rodar paralelo com TASK-07 e TASK-08]
```

**Paralelismo disponível:**
- TASK-02 e TASK-03 e TASK-06 podem rodar em paralelo (operam em arquivos completamente diferentes)
- TASK-07, TASK-08 e TASK-10 podem rodar em paralelo após suas dependências estarem concluídas
- TASK-05 depende de TASK-02 E TASK-03 — aguarda ambas

**Ordem crítica:**
- TASK-01 primeiro (base de tudo — configura NextAuth)
- TASK-04 exige TASK-02 (schema) E TASK-03 (queries)
- TASK-09 exige TASK-05 (Server Actions de reset)
```
