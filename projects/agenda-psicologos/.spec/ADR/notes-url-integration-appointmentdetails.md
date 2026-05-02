# ADR — notes-url-integration-appointmentdetails

**Data:** 2026-05-02
**Status:** aceito

## Contexto

Durante a implementação de `agenda-consultas/TASK-08` (página `/appointments/[id]`), o componente `AppointmentDetails.tsx` foi criado com links para prontuário apontando para `/appointments/${appointment.id}/notes` — uma URL que não existe na spec e nunca foi implementada.

A spec da feature `prontuario-sessao/TASK-05` define que:
- Botão "Registrar prontuário" deve navegar para `/notes/new?appointment=[id]`
- Botão "Ver prontuário" deve navegar para `/notes/[note_id]`

Para exibir o link correto "Ver prontuário" é necessário conhecer o `note_id`, não apenas o `appointment_id`. O componente `AppointmentDetails.tsx` recebe `hasNote: boolean` mas não recebe `noteId`.

## Decisão

1. Atualizar `AppointmentDetails.tsx` para receber `noteId?: string` além de `hasNote`.
2. Atualizar `getAppointmentById` para retornar `noteId?: string` junto com `hasNote`.
3. Atualizar a interface `AppointmentWithNote` local no arquivo `getAppointmentById.ts`.
4. Corrigir os links: "Registrar prontuário" → `/notes/new?appointment=[id]`, "Ver prontuário" → `/notes/[noteId]`.

## Alternativas descartadas

**Manter URL `/appointments/[id]/notes` e criar rota redirecionadora:** Adiciona complexidade sem benefício. A spec é clara sobre as URLs — `/notes/new` e `/notes/[note_id]`.

**Buscar a nota no componente client-side:** Violaria a arquitetura Server Component → Client Component. A nota deve ser resolvida no Server Component da página.

## Consequências

- **Positivo:** URLs corretas conforme spec, sem rotas fantasma.
- **Negativo:** Requer modificar `getAppointmentById.ts` (fora do target_path de TASK-05) para retornar `noteId`. Justificado pois é uma correção de dados faltantes na query existente, não uma nova feature.
- **Neutro:** `hasNote` permanece como `boolean` para compatibilidade com outros componentes que o usam.
