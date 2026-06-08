# T-011 — Frontend Anamnese

**Épico**: [Épico 1 — Pacientes](../epics/epic-1-pacientes.md)
**Prioridade**: P2
**Complexidade**: S (< 1h)
**Status**: ⬜ Pendente

## O que fazer

Adicionar aba **Anamnese** na ficha do paciente (`T-009`). Formulário com campos: queixa principal, história clínica, medicamentos em uso, saúde geral, história familiar, objetivos terapêuticos. Campos personalizados configuráveis (adicionar/remover). Formulário salva via `PUT /patients/:id/anamnese`. Indicador visual que dados são protegidos/criptografados.

## Critérios de aceite

- [ ] Aba Anamnese aparece na ficha do paciente
- [ ] Formulário carrega dados existentes ou exibe campos vazios
- [ ] Salvar exibe loading e feedback de sucesso/erro
- [ ] "Adicionar campo personalizado" permite inserir label, tipo (texto/número/booleano) e valor
- [ ] Ícone de cadeado com tooltip "Dados criptografados e protegidos" visível no formulário

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/components/patients/anamnese-tab.tsx`, `hooks/use-anamnese.ts`
- **Arquivos a modificar**: `apps/web/src/app/(dashboard)/patients/[id]/page.tsx` — adicionar aba
- **shadcn/ui**: `Textarea`, `Form`, `Button`, `Badge`, `Tooltip`
- **React Query**: `useQuery(['anamnese', patientId])` + `useMutation` para PUT

## Dependências

- Requer: [T-009] — ficha do paciente com abas
- Requer: [T-010] — API de anamnese

## Progresso

- [ ] `anamnese-tab.tsx` — pendente
- [ ] `hooks/use-anamnese.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
