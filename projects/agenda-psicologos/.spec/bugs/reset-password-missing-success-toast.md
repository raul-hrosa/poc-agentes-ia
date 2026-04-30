# Bug: reset-password-missing-success-toast

**Slug:** `reset-password-missing-success-toast`
**Prioridade:** high
**Status:** corrigido
**Reportado em:** 2026-04-30
**Feature relacionada:** autenticacao (AC-26)

---

## Descrição

Após redefinir a senha com sucesso, o usuário é redirecionado para `/dashboard` mas **não vê o toast "Senha redefinida com sucesso"** especificado no AC-26 da spec.

## Comportamento esperado

Após `resetPassword()` retornar `{ success: true }`:
1. Usuário é redirecionado para `/dashboard`
2. Toast de confirmação exibe: **"Senha redefinida com sucesso"**

## Comportamento atual

O redirecionamento para `/dashboard` acontece corretamente, mas nenhum toast é exibido. Nenhum mecanismo de toast (Sonner, react-hot-toast, shadcn/Toaster) está instalado no projeto.

## Como reproduzir

1. Acessar `/forgot-password` e solicitar reset para um e-mail válido
2. Clicar no link do e-mail → `/reset-password?token=...`
3. Preencher nova senha e confirmar
4. Observar: redirecionamento para `/dashboard` sem toast

## Arquivos suspeitos

- `projects/agenda-psicologos/src/features/auth/components/ResetPasswordForm.tsx` — linha ~37 (onde `router.push("/dashboard")` é chamado sem toast)
- `projects/agenda-psicologos/package.json` — Sonner não está instalado

## Causa raiz suspeita

Nenhuma biblioteca de toast instalada no projeto. O `ResetPasswordForm` só faz `router.push("/dashboard")` sem exibir feedback visual.

## Solução esperada

1. Instalar `sonner` (já referenciado na spec: "usar o componente Sonner ou similar disponível no projeto via shadcn/ui")
2. Adicionar `<Toaster />` do Sonner no `src/app/layout.tsx` ou `src/app/providers.tsx`
3. Chamar `toast.success("Senha redefinida com sucesso")` antes do `router.push("/dashboard")` em `ResetPasswordForm.tsx`

## Critério de aceite do fix

- [x] Após reset bem-sucedido, toast "Senha redefinida com sucesso" aparece em `/dashboard`
- [x] `pnpm typecheck` passa sem erros
- [ ] `pnpm build` passa sem erros

## Fix aplicado

- `sonner` instalado (v2.0.7)
- `<Toaster richColors position="top-right" />` adicionado em `src/app/providers.tsx`
- `toast.success("Senha redefinida com sucesso")` chamado em `ResetPasswordForm.tsx` antes do redirect
- Commit: fix(auth): exibir toast de sucesso após redefinição de senha (AC-26)
