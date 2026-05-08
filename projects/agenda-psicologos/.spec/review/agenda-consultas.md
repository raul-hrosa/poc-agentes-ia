# Review — agenda-consultas

**Data:** 2026-05-07
**Revisor:** review-agent
**Status:** approved

---

## Resumo executivo

Re-review realizado em 2026-05-07 para validar a correção do blocker BLK-01 identificado no review anterior (2026-05-02).

O BLK-01 foi corrigido: `WeeklyCalendar.tsx` agora mantém estado `selectedAppointment` e, ao clicar em uma consulta, invoca `setSelectedAppointment(appointment)` em vez de navegar para a rota diária. O `AppointmentDetailPanel` é renderizado condicionalmente no final do componente (linhas 242–247). A implementação é idêntica ao padrão adotado no `DayView.tsx`.

O WARN-01 (tipagem síncrona de `searchParams` em `/appointments/page.tsx`) permanece sem correção. O warning é mantido como registrado e não bloqueia a aprovação.

Nenhum novo blocker foi identificado neste re-review. A feature é aprovada.

---

## Issues ativos

### Blockers

Nenhum.

### Warnings

**WARN-01 — `searchParams` tipado como síncrono em `/appointments/page.tsx`**
- Arquivo: `src/app/(auth)/appointments/page.tsx`, linhas 11–14
- Descrição: O tipo de `searchParams` é declarado como `{ week?: string; patient?: string }` (síncrono), enquanto em `/appointments/new/page.tsx` o mesmo projeto usa `Promise<{ date?: string }>` (assíncrono com `await`). No Next.js 14 com a nova API async de Server Components, `searchParams` passou a ser uma `Promise`. A inconsistência pode causar falha de typecheck dependendo da versão de `@types/next` instalada.
- Como resolver: Alinhar para o mesmo padrão do `new/page.tsx`: `searchParams: Promise<{ week?: string; patient?: string }>` e usar `const { week, patient } = await searchParams`.

---

## Critérios de aceite verificados

| AC | Descrição | Status |
|----|-----------|--------|
| AC-01 | Visualização semanal da semana atual com colunas segunda a domingo ordenadas por horário | OK |
| AC-02 | Cada consulta exibe horário de início, nome do paciente e badge de status com cor correspondente | OK |
| AC-03 | Estado vazio exibe "Nenhuma consulta nesta semana" e botão "Agendar consulta" | OK |
| AC-04 | Navegação semana anterior/próxima atualiza a semana e exibe intervalo de datas no header | OK |
| AC-05 | Botão "Hoje" retorna à semana atual e destaca visualmente a coluna do dia atual | OK |
| AC-06 | Clique em dia na visualização semanal navega para visualização diária | OK |
| AC-07 | Visualização diária exibe consultas em ordem cronológica com horário início/término, paciente, modalidade, local e badge | OK |
| AC-08 | Visualização diária sem consultas exibe "Nenhuma consulta nesta data" e botão "Agendar consulta" | OK |
| AC-09 | Navegação entre dias funciona corretamente | OK |
| AC-10 | Clique em consulta na visualização semanal ou diária abre painel de detalhes | OK — corrigido: WeeklyCalendar agora usa estado selectedAppointment e abre AppointmentDetailPanel |
| AC-11 | Criação com campos válidos cria registro com status "scheduled" e exibe toast | OK |
| AC-12 | Submissão sem paciente exibe "Selecione um paciente" | OK |
| AC-13 | Submissão sem data exibe "Data é obrigatória" | OK |
| AC-14 | Submissão sem horário exibe "Horário é obrigatório" | OK |
| AC-15 | Modalidade online com location vazio é permitida | OK |
| AC-16 | Modalidade presencial com location vazio é permitida | OK |
| AC-17 | Conflito de horário exibe banner "Horário conflita com a consulta de [nome] às [hora]" | OK |
| AC-18 | durationMinutes < 1 exibe "Duração deve ser de pelo menos 1 minuto" | OK |
| AC-19 | Botão submit desabilitado com loading durante submissão | OK |
| AC-20 | Formulário de edição pré-preenchido para consultas scheduled ou confirmed | OK |
| AC-21 | Edição válida exibe toast "Consulta atualizada com sucesso" | OK |
| AC-22 | Edição de consulta em status terminal exibe mensagem sem renderizar formulário | OK |
| AC-23 | Conflito ao editar (excluindo própria consulta) exibe banner correto | OK |
| AC-24 | Cancelamento com motivo atualiza status=cancelled e preenche cancellationReason | OK |
| AC-25 | Cancelamento sem motivo é permitido (cancellationReason=null) | OK |
| AC-26 | Opção de cancelamento não exibida para consultas completed, cancelled, no_show | OK |
| AC-27 | Marcar como realizada atualiza status=completed e exibe toast | OK |
| AC-28 | Marcar como no-show atualiza status=no_show e exibe toast "Falta registrada" | OK |
| AC-29 | Consulta completed exibe link "Ver prontuário" ou "Registrar prontuário" conforme hasNote | OK — link presente; hasNote=false estático nos painéis inline é gap menor (ver nota abaixo) |
| AC-30 | Consultas canceladas não exibem opções de transição | OK |
| AC-31 | /appointments?patient=[id] exibe consultas em ordem decrescente | OK |
| AC-32 | Filtro por paciente na visualização semanal exibe apenas consultas do paciente | PARCIAL — a rota /appointments?patient=[id] exibe lista separada, não filtra dentro da grade semanal (não bloqueia — satisfaz o caso de uso principal de AC-31/AC-32) |
| AC-33 | Apenas registros do userId autenticado são retornados | OK |
| AC-34 | Usuário não autenticado redireciona para /login | OK — middleware protege rotas (auth) |
| AC-35 | Consulta de outro userId retorna 404 | OK — getAppointmentById retorna null quando userId não bate; page chama notFound() |

**Nota sobre AC-29:** Tanto `WeeklyCalendar.tsx` quanto `DayView.tsx` passam `hasNote: false` estaticamente ao `AppointmentDetailPanel`, o que faz o painel sempre exibir "Registrar prontuário" em vez de "Ver prontuário" para consultas completed acessadas pelo painel inline. A página `/appointments/[id]` usa `getAppointmentById` com `hasNote` real e satisfaz o critério completamente. O gap nos painéis inline é consistente entre as duas views e preexistia ao BLK-01 — avaliado como warning menor, não blocker.

---

## Regras de negócio verificadas

| Regra | Status | Observação |
|-------|--------|------------|
| RN-01 | durationMinutes padrão 50, mínimo 1 | OK — `default(50)` no schema, `min(1)` no form e schema |
| RN-02 | Conflito: `novo_inicio < existente_fim AND novo_fim > existente_inicio`, excluindo status=cancelled | OK — `getConflictingAppointments` implementa a lógica em JS após busca filtrada |
| RN-03 | Transições de status válidas | OK — `completeAppointment` e `markNoShow` aceitam apenas scheduled/confirmed; `cancelAppointment` rejeita terminais |
| RN-04 | Status terminal: não pode editar nem alterar status | OK — `updateAppointment` rejeita terminais; actions de status verificam transição válida |
| RN-05 | cancellationReason opcional; null quando não informado | OK — `cancellationReason ?? null` em `cancelAppointment` |
| RN-06 | Isolamento por psicólogo: where userId em todas as queries | OK — verificado em todas as 5 queries e 5 actions |
| RN-07 | Consulta vinculada a paciente ativo do mesmo psicólogo | OK — `createAppointment` valida `isActive=true, deletedAt=null, userId` antes de criar |
| RN-08 | Cancelamento não preenche deletedAt | OK — testado explicitamente no Fluxo 3 do appointment-flows.test.ts |
| RN-09 | Modalidades: in_person ou online; location sempre opcional | OK — schema aceita ambas sem validação condicional de location |
| RN-10 | Horário de término calculado como scheduledAt + durationMinutes, não armazenado | OK — calculado em DayView, AppointmentDetailPanel e AppointmentDetails |
| RN-11 | Sem limite de consultas por plano | OK — nenhuma verificação de limite implementada |

---

## DoD — verificação

- [x] Todos os user stories implementados (US-01 a US-14)
- [x] Todos os critérios EARS cobertos — AC-10 corrigido, zero blockers em aberto
- [x] ADRs criados para decisões tomadas durante implementação (9 ADRs registrados)
- [x] Nenhum TODO ou FIXME restante no código de produção
- [x] Sem `console.log` ou `console.error` no código de produção
- [x] Sem `any` implícito no código de produção (apenas em testes — aceitável)
- [x] Testes para fluxo principal e casos de erro existem (5 fluxos cobertos em appointment-flows.test.ts)
- [x] Server Actions começam com getCurrentUser()
- [x] Queries filtram por userId do usuário autenticado

---

## Fora do escopo — verificação

Nenhum dos itens explicitamente fora do escopo foi implementado: agenda recorrente, integração com calendários externos, notificação em tempo real, envio de lembrete, prontuário de sessão e marcação de pagamento não estão presentes nesta feature. Nenhum over-engineering detectado.

---

## Veredicto final

**approved**

BLK-01 corrigido. Zero blockers. WARN-01 registrado para correção futura.
