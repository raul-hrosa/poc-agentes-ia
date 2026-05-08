# Skill: Build Validator

Você sabe executar e interpretar o resultado dos comandos de validação de
um projeto Next.js com Prisma, e sabe o que fazer quando cada tipo de erro
aparece.

## Sequência de validação

Execute sempre nesta ordem. Uma falha em qualquer etapa não impede executar
as seguintes — execute todas e documente cada falha separadamente.

```
1. pnpm typecheck   → erros de tipo TypeScript (tsc --noEmit)
2. pnpm build       → compilação Next.js completa + Edge Runtime checks
3. pnpm test        → testes unitários e de integração
```

Os comandos exatos estão em `.spec/tech-stack.md` seção "Comandos do projeto".
Se um comando não existir em tech-stack.md, use o padrão acima.

## Pré-condição: Prisma client

Antes de executar qualquer comando, verifique se o Prisma client está gerado:
- Se `prisma/schema.prisma` existe e não há `node_modules/.prisma/`, rode
  `pnpm db:generate` primeiro
- Um build que falha por "Cannot find module '@prisma/client'" é erro de setup,
  não de código — documente separadamente

## Interpretação de erros por categoria

### Categoria 1 — Edge Runtime violation (pnpm build)

**Padrões de erro:**
```
Error: PrismaClient is not configured to run in Cloudflare Workers
Error: The edge runtime does not support Node.js 'fs' module
[package-name] cannot be loaded in edge runtime
Dynamic Code Evaluation not allowed in Edge Runtime
```

**Causa:** Módulo Node.js (Prisma, bcrypt, etc.) importado em arquivo que
roda no Edge Runtime (tipicamente `src/middleware.ts`).

**Solução padrão para NextAuth v5 + Prisma:**
- Criar `auth.config.ts` Edge-safe separado de `auth.ts`
- Middleware deve importar apenas `auth.config.ts`, nunca `auth.ts`

**No bug report:** tipo = `edge-runtime-violation`, arquivo = [arquivo problemático]

---

### Categoria 2 — Missing environment variable

**Padrões de erro:**
```
Error: Environment variable not found: DATABASE_URL
Error: Missing required environment variable: AUTH_SECRET
```

**Causa:** `.env.local` não existe, variável não definida, ou seed não
carrega `.env.local` explicitamente.

**No bug report:** tipo = `missing-env`, listar variáveis em falta

---

### Categoria 3 — Prisma client não gerado

**Padrões de erro:**
```
Error: Cannot find module '@prisma/client'
@prisma/client did not initialize yet. Please run "prisma generate"
```

**Causa:** Schema Prisma foi modificado mas `pnpm db:generate` não rodou.

**Ação imediata:** Rode `pnpm db:generate` e re-execute o build antes de
documentar como bug — este não é um bug de código.

---

### Categoria 4 — Import path quebrado

**Padrões de erro:**
```
Module not found: Can't resolve '@/features/...'
Module not found: Can't resolve '../[arquivo]'
```

**Causa:** Arquivo criado em path errado, import usa alias incorreto ou
arquivo foi renomeado/movido.

**No bug report:** tipo = `broken-import`, arquivo fonte e arquivo alvo

---

### Categoria 5 — Type error após mudança de schema

**Padrões de erro:**
```
Property 'X' does not exist on type 'Y'
Type 'Z' is not assignable to type 'W'
```

Quando ocorre logo após mudança de schema Prisma:
**Causa:** Tipos gerados estão desatualizados. Rode `pnpm db:generate`.

Quando não relacionado a schema:
**No bug report:** tipo = `type-error`, arquivo e linha exatos

---

### Categoria 6 — Falha em testes

**Padrões:**
```
FAIL src/features/auth/__tests__/schema.test.ts
  ● [nome do teste] › [nome do caso]
    [mensagem de erro]
```

**No bug report:** tipo = `test-failure`, listar cada suite e caso falhando
com a mensagem exata de erro.

## Resultado esperado para gate passar

```
pnpm typecheck: exit 0 (sem output de erro)

pnpm build:
  ✓ Compiled successfully
  ✓ Linting and checking validity of types
  Route (app): [lista de rotas]

pnpm test:
  Test Files: N passed (N)
  Tests:      N passed (N)
  Duration:   Xs
```

## Estrutura mínima do bug report de build

```markdown
# Bug: [typecheck|build|test] falhou — [feature]

## Tipo
[edge-runtime-violation | missing-env | broken-import | type-error | test-failure]

## Comando
[comando exato que falhou]

## Saída completa
[output completo — não truncar, não sumarizar]

## Causa provável
[análise baseada nos padrões acima]

## Impacto
[o que está bloqueado]
```
