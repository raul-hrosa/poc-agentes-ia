# Review — confirmacao-paciente

**Status:** approved
**Data:** 2026-05-04
**Revisor:** review-agent

---

## Resumo

A feature `confirmacao-paciente` foi implementada de forma sólida e coerente com a spec. As 5 tasks estão completas e cobrem corretamente as três lacunas especificadas: indicadores visuais de status na agenda, cancelamento direto pelo psicólogo com diálogo de confirmação, e invalidação atômica de token quando o psicólogo cancela com token ativo.

A lógica de `cancellationOrigin` foi implementada corretamente em `computeCancellationOrigin`, exportada de `getAppointmentsForWeek.ts` e reutilizada em `getAppointmentById.ts` e `getDayAppointments.ts`, sem duplicação. A Server Action `cancelAppointment` executa a transação atômica (RN-02), valida status terminal (RN-05), e garante isolamento de dados por `userId` (AC-16). O `getCurrentUser()` lança erro quando não autenticado, satisfazendo AC-17 sem necessidade de checagem explícita de null na action.

Todos os critérios EARS verificados passaram. Nenhum blocker identificado.

---

## Issues encontrados

### Warnings (problema real, não bloqueia aprovação)

**WARN-01 — `hasNote` sempre `false` nos painéis abertos a partir da agenda semanal e diária**
- Localização: `WeeklyCalendar.tsx:244` e `DayView.tsx:231`
- Descrição: Ambos os componentes abrem o `AppointmentDetailPanel` com `hasNote: false` hardcoded. Para consultas `completed` exibidas no painel lateral (aberto ao clicar em um bloco da agenda), o link de prontuário sempre aparece como "Registrar prontuário" mesmo que a nota já exista.
- Observação: Este comportamento foi introduzido em `agenda-consultas` e está fora do escopo desta feature. A spec `confirmacao-paciente` não define o comportamento de `hasNote` nesses painéis. Registrado aqui apenas para rastreabilidade.
- Correção sugerida: Passar `hasNote` e `noteId` reais ao `AppointmentDetailPanel`, buscando a informação junto com os dados do bloco (requer join com `sessionNote` nas queries de semana/dia). A ser tratado em tarefa separada.

**WARN-02 — Link de prontuário em `AppointmentDetailPanel` usa rota incorreta**
- Localização: `AppointmentDetailPanel.tsx:263` e `AppointmentDetailPanel.tsx:269`
- Descrição: O painel lateral linka para `/appointments/${appointment.id}/notes` tanto para "Ver prontuário" quanto para "Registrar prontuário". A rota correta para visualização é `/notes/${noteId}` e para criação é `/notes/new?appointment=${appointment.id}`, conforme ADR `notes-url-integration-appointmentdetails.md` já registrado. O componente `AppointmentDetails.tsx` (página de detalhes) usa as URLs corretas — apenas o `AppointmentDetailPanel` (sheet lateral) usa URLs erradas.
- Observação: Este bug foi herdado de `agenda-consultas` e está fora do escopo desta feature. Registrado para rastreabilidade.
- Correção sugerida: Atualizar `AppointmentDetailPanel.tsx` para usar `/notes/${appointment.noteId}` e `/notes/new?appointment=${appointment.id}`, espelhando o comportamento correto de `AppointmentDetails.tsx`.

---

## Critérios EARS verificados

| Critério | Status | Observação |
|----------|--------|------------|
| AC-01 | passou | `AppointmentStatusBadge` renderiza indicador correto para todos os status; `AppointmentCard` e `DayView` exibem o badge; `scheduled` retorna null (sem badge) |
| AC-02 | passou | `status = confirmed` exibe "Confirmada pelo paciente" — única origem de `confirmed` no MVP é o token (RN-06) |
| AC-03 | passou | `cancellationOrigin = 'patient'` → "Cancelada pelo paciente"; `'psychologist'` → "Cancelada pelo psicólogo"; lógica em `computeCancellationOrigin` |
| AC-04 | passou | `getAppointmentsForWeek` carrega `appointmentTokens` via `include` com `take: 1`; `getDayAppointments` idem — sem N+1 |
| AC-05 | passou | Botão "Cancelar consulta" renderizado apenas quando `isActive` (`scheduled` ou `confirmed`) em `AppointmentDetails` e `AppointmentDetailPanel` |
| AC-06 | passou | Diálogo exibe nome do paciente, data/hora formatada, `<textarea>` com `maxLength={500}` e contador de caracteres restantes |
| AC-07 | passou | `cancelAppointment` executa `prisma.$transaction` com `appointment.update` + `appointmentToken.updateMany`; toast "Consulta cancelada" emitido em `CancelDialog.tsx:49` |
| AC-08 | passou | Botão "Voltar" chama `onClose()` sem executar nenhuma operação |
| AC-09 | passou | Botão não renderizado para `completed`, `cancelled`, `no_show` — condição `isActive` garante isso |
| AC-10 | passou | `isPending` desabilita o botão "Confirmar cancelamento" e altera texto para "Cancelando..." durante a operação |
| AC-11 | passou | `prisma.appointmentToken.updateMany` com `usedAt: null` e `expiresAt: { gt: new Date() }` invalida token ativo na mesma transação |
| AC-12 | passou | Critério de integração com `lembretes-consulta` — coberto por AC-20 daquela spec; fora do escopo desta implementação |
| AC-13 | passou | Toast exibe apenas "Consulta cancelada" sem menção ao token |
| AC-14 | passou | Campo "Motivo:" renderizado em `AppointmentDetails` e `AppointmentDetailPanel` quando `cancellationReason != null` |
| AC-15 | passou | Campo "Motivo:" omitido quando `cancellationReason === null` |
| AC-16 | passou | `cancelAppointment` busca com `findUnique` e compara `appointment.userId !== user.id`; retorna "Consulta não encontrada" sem revelar existência; queries filtram por `userId` |
| AC-17 | passou | `getCurrentUser()` lança `Error("Não autenticado")` quando sessão ausente; erro propaga antes de qualquer acesso ao banco |

---

## Regras de negócio verificadas

| Regra | Status | Observação |
|-------|--------|------------|
| RN-01 | passou | `cancellationReason` preenchido apenas quando psicólogo cancela via action; cancelamento pelo paciente via token não preenche o campo |
| RN-02 | passou | Transação Prisma com array de duas operações: `appointment.update` e `appointmentToken.updateMany` |
| RN-03 | passou | `updateMany` não gera erro quando não há token ativo — `count: 0` é válido; testado explicitamente |
| RN-04 | passou | Nenhuma notificação ao paciente implementada no cancelamento pelo psicólogo |
| RN-05 | passou | Botão "Cancelar consulta" ausente para status terminal; server action rejeita status terminal com erro |
| RN-06 | passou | Badge "Confirmada pelo paciente" exibido para `status = confirmed`; no MVP só token gera este status |
| RN-07 | passou | `CancelAppointmentSchema` valida `max(500)` em `cancellationReason`; `textarea` tem `maxLength={500}` |

---

## Verificação de DoD

| Item | Status | Observação |
|------|--------|------------|
| Todos os user stories implementados | passou | US-01 a US-07 cobertos |
| Critérios EARS cobertos | passou | AC-01 a AC-17 verificados |
| Testes para fluxo principal e casos de erro | passou | `queries-token-status.test.ts` cobre 9 cenários de query; `actions-status.test.ts` cobre 11 cenários de cancelamento incluindo erros |
| ADRs para decisões tomadas | passou | ADR `token-confirmacao.md` já registrado; nenhuma nova decisão não-documentada identificada |
| Nenhum TODO ou placeholder restante | passou | Código examinado sem TODO/FIXME |
| Nenhum `console.log` no código de produção | passou | Não encontrado |
| Server Action começa com `getCurrentUser()` | passou | `cancelAppointment.ts:13` |
| Queries filtram por `userId` | passou | `getAppointmentsForWeek`, `getDayAppointments`, `getAppointmentById` — todos filtram por `userId` |
| Lógica de negócio fora de componentes React | passou | `computeCancellationOrigin` em arquivo de query; componentes apenas apresentam dados |
| Inputs validados com Zod | passou | `CancelAppointmentSchema.parse(input)` antes de acessar o banco |

---

## Conclusão

Feature aprovada. Zero blockers. Dois warnings herdados de `agenda-consultas` registrados para rastreabilidade — nenhum deles foi introduzido por esta feature e nenhum viola critérios desta spec.
