# ADR — zod-version-4x

**Data:** 2026-04-30
**Status:** aceito

## Contexto

O tech-stack.md especifica `"zod": "3.23.x"`. Ao executar `pnpm add zod`, o pnpm resolveu a versão mais recente disponível: **Zod 4.3.6**.

O Zod v4 introduz mudanças de API relevantes em relação ao v3:
- O objeto `ZodError` não expõe `.errors` como array — a propriedade correta é `.issues`
- O formato de `safeParse` permanece o mesmo: `{ success: boolean, data?, error? }`
- A API de schemas (`.string()`, `.object()`, `.refine()`, etc.) é retrocompatível
- O parâmetro de mensagem de erro em construtores como `z.coerce.date()` e `z.enum()` usa `error` em vez de `required_error` (mudança de v3 para v4)

Descoberto durante a implementação dos testes de `PatientFormSchema` (TASK-01 de cadastro-pacientes), ao verificar que `result.error.errors` era `undefined` e `result.error.issues` continha os erros esperados.

## Decisão

Usar **Zod 4.3.6** (versão resolvida pelo pnpm) ao invés de fixar em 3.23.x.

Em todos os testes e código que inspecionam erros de validação Zod, usar `.issues` em vez de `.errors`.

## Alternativas descartadas

**Fixar em zod@3.23.x:** Exigiria adicionar `overrides` no package.json. A versão 4.x é a versão estável mais recente (2026) e mais adequada para um projeto novo.

## Consequências

- **Positivo:** Usa versão mais recente com melhorias de performance e API mais consistente
- **Negativo:** Testes precisam usar `.issues` em vez de `.errors` — diferença de API não óbvia para quem vem do Zod v3
- **Atenção:** Toda verificação de erros Zod em testes futuros deve usar `result.error.issues`, não `result.error.errors`
- **Atenção:** Parâmetros de erro em construtores Zod usam `{ error: "msg" }` em vez de `{ required_error: "msg" }` — descoberto na TASK-01 de agenda-consultas ao criar `AppointmentFormSchema`
- **Neutro:** Os schemas continuam com a mesma estrutura geral (`.object()`, `.string()`, `.refine()`, etc.)
