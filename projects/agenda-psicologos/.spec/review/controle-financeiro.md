# Review — controle-financeiro

**Data:** 2026-05-07
**Revisor:** review-agent

---

## Resumo

A implementação cobre todos os critérios de aceite e regras de negócio. O blocker BLK-01 (AC-19 — mensagem de erro para valor não numérico) foi corrigido após o review: o schema Zod foi separado em dois `.refine()` sequenciais e o teste atualizado.

**Status:** approved

---

## Issues por prioridade

### Blocker (impede aprovação)

**BLK-01 — Mensagem de erro para valor não numérico nunca exibida (AC-19)**

Critério: AC-19
Arquivo: `projects/agenda-psicologos/src/features/payments/schema.ts`, linha 8–9
Descrição: O campo `amountBRL` usa um único `.refine()` com a condição `!isNaN(val) && val > 0` e a mensagem "O valor deve ser maior que zero". Quando o usuário informa letras ou caracteres não numéricos (ex: "abc"), `parseFloat("abc")` retorna `NaN`; a condição é `false`; a mensagem exibida é "O valor deve ser maior que zero" — nunca "Informe um valor válido em reais". A spec exige explicitamente a mensagem "Informe um valor válido em reais" para o caso não numérico, distinta da mensagem de valor zero/negativo.
Como resolver: Separar o `.refine()` em dois passos. Primeiro verificar se o valor é NaN (não numérico) e retornar "Informe um valor válido em reais". Segundo verificar se `val > 0` e retornar "O valor deve ser maior que zero". Exemplo:

```typescript
amountBRL: z
  .string()
  .min(1, "O valor da sessão é obrigatório")
  .transform((val) => parseFloat(val.replace(",", ".")))
  .refine((val) => !isNaN(val), "Informe um valor válido em reais")
  .refine((val) => val > 0, "O valor deve ser maior que zero"),
```

O mesmo ajuste deve ser aplicado em `UpdateSessionPaymentSchema`. Os testes de schema (`schema.test.ts`) também precisam ser atualizados: o caso "amountBRL não numérico" deve verificar a mensagem "Informe um valor válido em reais", não "O valor deve ser maior que zero".

---

### Major (degradação significativa, não bloqueia se isolado)

Nenhum.

---

### Minor (melhoria, não bloqueia)

**MIN-01 — Filtro de status não atualiza o resumo de totais (AC-07 — interpretação ambígua)**

AC-07 diz "atualizando a contagem exibida acima da listagem" ao aplicar o filtro "Pendentes". A implementação do `FinancialDashboard` chama `getFinancialDataForPeriod` que sempre recalcula o summary sem o filtro de status, portanto os cards "Recebido", "Pendente" e "Sessões" permanecem com os totais do período inteiro ao filtrar. Dado que o wireframe posiciona os cards acima do filtro e não define uma contagem separada acima da listagem, o comportamento atual é defensável. Registrado como minor por ambiguidade — não bloqueia.

---

## Cobertura de critérios de aceite

| Critério | Status | Observação |
|---|---|---|
| AC-01 — Plano free exibe tela de upgrade com botão "Assinar plano pro" | passou | `UpgradeGate` exibido quando `plan !== "pro"`; botão presente com texto correto |
| AC-02 — Plano pro exibe resumo do mês atual | passou | `FinancialDashboard` renderizado com mês/ano correntes |
| AC-03 — Resumo exibe totalPaidCents, totalPendingCents, sessionCount, pendingCount formatados | passou | Três cards presentes; `formatCurrency` usado para valores monetários |
| AC-04 — Seletor de período recarrega dados sem page reload | passou | `handlePrevMonth`/`handleNextMonth` chamam `fetchData` via Server Action |
| AC-05 — Estado vazio exibe totais zerados e mensagem "Nenhuma sessão..." | passou | Mensagem exibida quando `payments.length === 0`; totais calculados pela query retornam zeros |
| AC-06 — Listagem exibe nome, data, valor, forma de pagamento e badge por item | passou | Todos os campos exibidos; "-" para forma de pagamento null |
| AC-07 — Filtro "Pendentes" exibe só `status = pending` | passou parcial | Listagem filtrada corretamente; contagem nos cards do resumo não é atualizada (MIN-01) |
| AC-08 — Filtro "Pagas" exibe só `status = paid` | passou parcial | Idem AC-07 |
| AC-09 — Filtro "Todas" exibe todos os registros | passou | `statusFilter === "all"` remove o filtro de status da query |
| AC-10 — Clique em item da listagem navega para `/appointments/[id]` | passou | `router.push("/appointments/" + payment.appointmentId)` |
| AC-11 — Consulta realizada sem pagamento: exibe "Nenhum pagamento registrado." e botão "Registrar pagamento" | passou | `AppointmentPaymentSectionClient` exibe estado correto quando `payment === null` |
| AC-12 — Consulta realizada com pagamento: exibe badge, valor, forma e botão "Editar pagamento" | passou | Todos os campos exibidos; botão "Editar pagamento" presente |
| AC-13 — Consulta com status != completed não exibe seção de pagamento | passou | `AppointmentPaymentSection` retorna `null` quando `appointmentStatus !== "completed"` |
| AC-14 — Formulário exibe campos: Valor, Forma de pagamento, Status, Observações e botão Salvar | passou | Todos os campos presentes; Status implementado como segmented buttons |
| AC-15 — Criar com status paid: `amountCents`, `paidAt = now()`, toast "Pagamento registrado" | passou | `paidAt = new Date()` quando `status === "paid"`; toast exibido |
| AC-16 — Criar com status pending: `paidAt = null` | passou | Verificado no código e nos testes |
| AC-17 — Valor vazio: "O valor da sessão é obrigatório" | passou | Mensagem correta via `z.string().min(1, ...)` |
| AC-18 — Valor zero ou negativo: "O valor deve ser maior que zero" | passou | Mensagem correta via `.refine()` |
| AC-19 — Valor não numérico: "Informe um valor válido em reais" | falhou | Schema unifica a mensagem — exibe "O valor deve ser maior que zero" para NaN (BLK-01) |
| AC-20 — Botão Salvar desabilitado com indicador de loading durante submissão | passou | `disabled={submitting}` e texto "Salvando..." |
| AC-21 — "Editar pagamento" abre formulário pré-preenchido | passou | `existingPayment` passado para `PaymentSheet`; campos inicializados com valores atuais |
| AC-22 — Alterar de pending para paid: `status = paid`, `paidAt = now()`, toast "Pagamento atualizado" | passou | Lógica correta em `updateSessionPayment`; toast exibido |
| AC-23 — Alterar de paid para pending: `status = pending`, `paidAt = null`, toast "Pagamento atualizado" | passou | `paidAt = null` quando `status === "pending"` |
| AC-24 — Alterar apenas o valor: `amountCents` atualizado | passou | Atualização cobre todos os campos incluindo `amountCents` |
| AC-25 — Todo acesso a `session_payments` inclui `where: { userId }` | passou | Todas as queries e actions verificadas |
| AC-26 — Usuário não autenticado redirecionado para `/login` | passou | Middleware do NextAuth protege o grupo `(auth)`; `getCurrentUser()` lança erro se sem sessão |
| AC-27 — Registro/edição de pagamento para consulta de outro usuário retorna erro 404 | passou | `createSessionPayment` verifica `userId` na busca da appointment; `updateSessionPayment` verifica `userId` na busca do payment |

---

## Cobertura de regras de negócio

| Regra | Status | Observação |
|---|---|---|
| RN-01 — Disponível apenas no plano pro | passou | Ambas as Server Actions verificam `dbUser.plan !== "pro"` e retornam `{ error: "plan_required" }`; `FinanceiroPage` renderiza `UpgradeGate` para plano free |
| RN-02 — Pagamento só para consultas com `status = completed` | passou | `createSessionPayment` verifica `appointment.status !== "completed"` e retorna `invalid_status`; `AppointmentPaymentSection` retorna null para outros status |
| RN-03 — Unicidade de pagamento por consulta | passou | `createSessionPayment` verifica existência via `findUnique({ where: { appointmentId } })` antes de criar |
| RN-04 — Valor armazenado em centavos | passou | `amountCents = Math.round(amountBRL * 100)` em ambas as actions |
| RN-05 — `paidAt` condicional ao status | passou | `paidAt = new Date()` para paid; `paidAt = null` para pending — em ambas as actions |
| RN-06 — Forma de pagamento é opcional | passou | Campo `paymentMethod` opcional no schema; listagem exibe "-" quando null |
| RN-07 — Resumo calculado por `appointments.scheduled_at` | passou | `getFinancialSummary` filtra por `appointment.scheduledAt`, não por `paidAt` |
| RN-08 — Período padrão é o mês atual; navegação por período não altera URL | passou | Estado local com `useState`; `initialYear`/`initialMonth` calculados com `new Date()` |
| RN-09 — Isolamento por psicólogo | passou | `userId` obrigatório em todas as queries |
| RN-10 — Sem exclusão de registro de pagamento | passou | Nenhuma funcionalidade de delete implementada |

---

## Definition of Done

| Item | Status | Observação |
|---|---|---|
| Todos os user stories implementados | passou | US-01 a US-10 têm fluxo implementado |
| Todos os critérios EARS cobertos e verificáveis | falhou parcial | AC-19 não implementado corretamente (BLK-01) |
| Nenhum blocker em aberto de tasks anteriores | passou | STATUS.md não lista blockers ativos |
| ADRs criados para decisões tomadas durante implementação | passou | ADR `session-payments-schema-missing.md` registrado; `user-id-denormalizacao-rls.md` registrado |
| Testes para o fluxo principal | passou | `createSessionPayment.test.ts`, `updateSessionPayment.test.ts`, `getFinancialSummary.test.ts`, `queries.test.ts`, `schema.test.ts` |
| Testes para casos de erro | passou parcial | Casos de erro de actions cobertos; teste de schema para não numérico verifica mensagem errada (reflexo do BLK-01) |
| Nenhum TODO ou FIXME no código | passou | Nenhum encontrado |
| Nenhum `console.log` no código de produção | passou | Nenhum encontrado |
| Inputs validados com Zod antes de operação de banco | passou | Ambas as actions validam com `safeParse` antes de qualquer query |
| Server Actions começam com `getCurrentUser()` | passou | Todas as Server Actions verificadas |
| Queries filtram por `userId` | passou | Verificado em todas as queries |

---

## Veredicto final

**needs-fix**

Um blocker impede a aprovação: AC-19 não é atendido porque o Zod schema unifica as mensagens de "valor zero/negativo" e "valor não numérico" em uma única mensagem, nunca exibindo "Informe um valor válido em reais". A correção requer separar o `.refine()` em dois passos no `SessionPaymentFormSchema` e no `UpdateSessionPaymentSchema`, e atualizar o teste correspondente em `schema.test.ts`.
