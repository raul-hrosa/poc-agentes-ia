# ADR — patients-dynamic-segment-consistency

**Data:** 2026-05-02
**Status:** aceito

## Contexto

A spec de `prontuario-sessao/TASK-06` define a rota como `/patients/[patient_id]/notes`, usando o segmento dinâmico `[patient_id]`.

Porém, as rotas existentes de `cadastro-pacientes` já usam `[id]`:
- `/patients/[id]/page.tsx`
- `/patients/[id]/edit/page.tsx`

O Next.js 14 (App Router) exige que todos os segmentos dinâmicos no mesmo nível do roteador usem o mesmo nome. Ao adicionar `patients/[patient_id]/notes/page.tsx`, o build falhou com:

> `Error: You cannot use different slug names for the same dynamic path ('id' !== 'patient_id').`

## Decisão

Usar `[id]` em vez de `[patient_id]` para a pasta da rota `/patients/[id]/notes/page.tsx`, mantendo consistência com as rotas existentes do módulo patients.

Internamente, o parâmetro continua sendo chamado `patient_id` na interface Props para deixar o código semântico:
```typescript
const { id: patient_id } = await params
```

## Alternativas descartadas

**Renomear `[id]` para `[patient_id]` em todas as rotas de patients:** Exigiria modificar arquivos de outras features (fora do target_path desta task) e é uma mudança desnecessariamente ampla.

**Criar pasta separada fora de `patients/`:** Não faz sentido semântico para uma rota que pertence ao contexto do paciente.

## Consequências

- **Positivo:** Build funciona, sem conflito de slug.
- **Negativo:** O nome do parâmetro na pasta é `[id]` mas semanticamente representa um `patient_id` — resolvido com desestruturação renomeada: `const { id: patient_id } = await params`.
- **Neutro:** Consistente com o restante do módulo patients.
