# ADR: buscar plano do usuário diretamente no banco nas Patient Actions

**Data:** 2026-04-30
**Status:** aceito

---

## Contexto

As Server Actions `createPatient` e `restorePatient` precisam verificar `user.plan === "free"` para aplicar o limite de `MAX_FREE_PATIENTS`. Contudo, o tipo `AuthUser` retornado por `getCurrentUser()` só expõe `id`, `name` e `email` — o campo `plan` não está incluído na sessão JWT nem no tipo.

Alterar `getCurrentUser()` para incluir `plan` implicaria modificar o contrato da feature `autenticacao` (já concluída e revisada), bem como o tipo `AuthUser` e o callback `jwt` do NextAuth — mudanças que estão fora do escopo da TASK-03.

---

## Decisão

Nas actions que precisam do `plan` (`createPatient` e `restorePatient`), fazer uma query direta ao Prisma logo após `getCurrentUser()` para buscar apenas o campo `plan`:

```typescript
const dbUser = await prisma.user.findUnique({
  where: { id: user.id },
  select: { plan: true },
})
```

Se `dbUser` for `null` (situação que não deveria ocorrer para usuário autenticado), tratar como plano `"free"` por segurança (fallback conservador).

---

## Alternativas descartadas

**1. Incluir `plan` em `AuthUser` e no callback JWT do NextAuth**
- Exige modificar `src/features/auth/types.ts`, `src/shared/lib/auth.ts` (callback `jwt` e `session`) e `getCurrentUser.ts`
- Altera o contrato da feature `autenticacao` já aprovada em review
- Requer propagar o `plan` no token JWT, que pode ficar desatualizado após upgrade de plano sem re-login
- Fora do escopo da TASK-03

**2. Passar `plan` como parâmetro explícito para as actions**
- Transfere a responsabilidade de obter o `plan` para o chamador (page ou formulário)
- Expõe dado de negócio no cliente; fácil de manipular via chamada direta à Server Action
- Quebra o princípio de que as actions são a única fonte de verdade para regras de negócio

---

## Consequências

**Positivas:**
- Sem alteração de contrato de código existente
- `plan` sempre fresco do banco, nunca desatualizado por cache de sessão
- Escopo da TASK-03 preservado

**Negativas:**
- Uma query extra ao banco por chamada de `createPatient` e `restorePatient`
- Acoplamento direto ao `prisma` nas actions (já existe via `prisma.patient.*`)

**Observações:**
- Quando a feature `billing` for implementada e atualizar o JWT com `plan`, esta query extra poderá ser removida sem alterar a interface pública das actions
