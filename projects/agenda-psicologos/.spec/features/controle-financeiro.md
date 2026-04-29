# Feature: Controle Financeiro Básico de Sessões

**Slug:** `controle-financeiro`
**Prioridade:** should-have
**Fase:** 2 — Specs
**Criada em:** 2026-04-27
**Status:** aprovada

---

## Contexto

Psicólogos autônomos precisam controlar quais sessões foram pagas, quais estão
pendentes e quanto receberam em cada mês. Sem esse controle, eles alternam entre
o PsiAgenda e planilhas ou cadernos para rastrear o financeiro, o que fragmenta
o fluxo de trabalho e aumenta o risco de esquecer cobranças.

Esta feature cobre o ciclo completo de controle financeiro por sessão: registrar
ou atualizar o pagamento vinculado a uma consulta realizada, registrar valor e
forma de pagamento, e visualizar um resumo financeiro mensal com totais recebidos,
pendentes e número de sessões.

**Por que esta feature pertence ao MVP:**
O controle financeiro é o diferencial que justifica o plano pago do PsiAgenda.
Um psicólogo no plano free que começa a usar a agenda logo percebe que precisa
também controlar o financeiro — e a ausência dessa funcionalidade empurra o
usuário de volta a soluções externas. Com o controle financeiro integrado, a
proposta de valor do plano profissional se sustenta.

**Escopo no MVP:**
Por consulta: marcar como pago ou pendente, registrar o valor e a forma de pagamento.
Resumo mensal: total recebido, total pendente e número de sessões. Filtro por período
e por status de pagamento.

**Restrição de plano:**
No MVP, o controle financeiro está disponível apenas no plano pro. Usuários no plano
free veem a seção financeira com uma tela de upgrade. Essa restrição incentiva a
conversão e é o principal gatilho de upsell.

**Multi-tenancy:**
Cada registro de `session_payments` pertence exclusivamente ao psicólogo autenticado.
O campo `user_id` é denormalizado diretamente em `session_payments` (ver ADR
`user-id-denormalizacao-rls.md`) — toda query inclui obrigatoriamente
`where: { userId: session.user.id }`.

**Dependências desta feature:**
- `autenticacao` — acesso ao financeiro requer sessão autenticada
- `agenda-consultas` — pagamento é vinculado a uma consulta existente
- `cadastro-pacientes` — usado para exibir o nome do paciente no resumo financeiro

---

## User Stories

### Fluxo principal — registro de pagamento

**US-01**
Como psicólogo autenticado no plano pro,
quero registrar o pagamento de uma sessão realizada informando valor e forma de pagamento,
para ter o controle financeiro integrado à minha agenda sem precisar de planilha separada.

**US-02**
Como psicólogo autenticado no plano pro,
quero marcar uma sessão como paga diretamente da visualização da consulta,
para registrar o recebimento no momento exato em que o paciente paga, sem interromper o fluxo.

**US-03**
Como psicólogo autenticado no plano pro,
quero alterar o status de um pagamento já registrado de pendente para pago (ou vice-versa),
para corrigir registros quando o pagamento chega depois ou quando houve erro ao marcar.

**US-04**
Como psicólogo autenticado no plano pro,
quero editar o valor ou a forma de pagamento de uma sessão já registrada,
para corrigir informações inseridas incorretamente sem precisar excluir e recriar.

### Fluxo principal — resumo financeiro

**US-05**
Como psicólogo autenticado no plano pro,
quero ver o total recebido, o total pendente e o número de sessões do mês atual,
para saber rapidamente quanto faturei e quanto ainda tenho a receber sem precisar somar manualmente.

**US-06**
Como psicólogo autenticado no plano pro,
quero filtrar o resumo financeiro por período (mês e ano),
para consultar o histórico de meses anteriores e comparar a evolução do faturamento.

**US-07**
Como psicólogo autenticado no plano pro,
quero filtrar a listagem de sessões por status de pagamento (todas, pagas, pendentes),
para focar nas sessões pendentes ao fazer a cobrança dos pacientes.

### Perfis alternativos — plano free

**US-08**
Como psicólogo autenticado no plano free,
quero ver a seção de controle financeiro com informação sobre o plano pro,
para entender o que ganho ao fazer upgrade sem precisar buscar essa informação em outro lugar.

### Estado vazio

**US-09**
Como psicólogo autenticado no plano pro visualizando o financeiro do mês sem nenhuma sessão registrada,
quero ver uma mensagem indicando que não há dados para o período selecionado,
para entender que o resumo será preenchido conforme as consultas forem realizadas e os pagamentos registrados.

### Erros esperados

**US-10**
Como psicólogo autenticado no plano pro,
quero receber uma mensagem de erro clara se tentar salvar um pagamento com valor inválido,
para corrigir o dado antes que o registro errado contamine meu resumo financeiro.

---

## Critérios de Aceite

### Acesso restrito por plano

**AC-01**
WHEN o psicólogo autenticado no plano `free` acessa `/financeiro`
THEN o sistema exibe uma tela de upgrade informando que o controle financeiro
     está disponível no plano pro, com botão "Assinar plano pro" que navega para
     a página de assinatura.

**AC-02**
WHEN o psicólogo autenticado no plano `pro` acessa `/financeiro`
THEN o sistema exibe o resumo financeiro do mês atual com os totais e a listagem
     de sessões do período.

### Resumo financeiro

**AC-03**
WHEN o psicólogo acessa `/financeiro` (plano pro)
THEN o sistema exibe, para o mês atual:
     - total recebido (soma de `amount_cents` onde `status = paid`), formatado em R$
     - total pendente (soma de `amount_cents` onde `status = pending`), formatado em R$
     - número de sessões com pagamento registrado (total de `session_payments` do período)
     - número de sessões pendentes (contagem onde `status = pending`)

**AC-04**
WHEN o psicólogo seleciona um mês e ano diferentes no seletor de período
THEN o sistema recarrega o resumo e a listagem exibindo apenas os dados do período
     selecionado, sem recarregar a página inteira.

**AC-05**
WHEN não há registros de `session_payments` para o período selecionado
THEN o sistema exibe os totais zerados (R$ 0,00) e a mensagem "Nenhuma sessão
     com pagamento registrado neste período." na área da listagem.

### Listagem de sessões com pagamento

**AC-06**
WHEN o psicólogo visualiza a listagem de sessões na tela financeira
THEN o sistema exibe, para cada item: nome do paciente, data da sessão, valor
     formatado em R$, forma de pagamento (se preenchida) e badge de status
     (Pago / Pendente).

**AC-07**
WHEN o psicólogo aplica o filtro "Pendentes"
THEN o sistema exibe apenas os registros com `status = pending`, atualizando
     a contagem exibida acima da listagem.

**AC-08**
WHEN o psicólogo aplica o filtro "Pagas"
THEN o sistema exibe apenas os registros com `status = paid`, atualizando
     a contagem exibida acima da listagem.

**AC-09**
WHEN o psicólogo aplica o filtro "Todas"
THEN o sistema exibe todos os registros do período sem filtro de status.

**AC-10**
WHEN o psicólogo clica em um item da listagem
THEN o sistema navega para os detalhes da consulta correspondente
     em `/appointments/[appointment_id]`.

### Registro de pagamento a partir da consulta

**AC-11**
WHEN o psicólogo visualiza os detalhes de uma consulta com `status = completed`
     E ainda não existe `session_payments` para esse `appointment_id`
THEN o sistema exibe o botão "Registrar pagamento" que abre o formulário de
     registro de pagamento inline ou em sheet lateral.

**AC-12**
WHEN o psicólogo visualiza os detalhes de uma consulta com `status = completed`
     E já existe `session_payments` para esse `appointment_id`
THEN o sistema exibe o badge de status do pagamento (Pago / Pendente), o valor
     formatado e a forma de pagamento (se preenchida), com botão "Editar pagamento".

**AC-13**
WHEN o psicólogo visualiza os detalhes de uma consulta com `status` diferente
     de `completed` (scheduled, confirmed, cancelled, no_show)
THEN o sistema não exibe nenhuma seção de pagamento para essa consulta.

### Formulário de registro de pagamento

**AC-14**
WHEN o psicólogo abre o formulário de registro de pagamento
THEN o sistema exibe os campos:
     - Valor (R$) — obrigatório, numérico
     - Forma de pagamento — seleção opcional entre: PIX, Dinheiro, Cartão, Transferência
     - Status — seleção obrigatória: Pendente (padrão) / Pago
     - Observações — texto livre opcional
     E o botão "Salvar".

**AC-15**
WHEN o psicólogo submete o formulário com todos os campos válidos e `status = paid`
THEN o sistema cria o registro em `session_payments` com `userId` do psicólogo
     autenticado, `appointmentId` da consulta, `amountCents` convertido de R$ para
     centavos, `status = paid`, `paidAt = now()`, `paymentMethod` e `notes`
     preenchidos, e exibe toast "Pagamento registrado".

**AC-16**
WHEN o psicólogo submete o formulário com `status = pending`
THEN o sistema cria o registro com `status = pending` e `paidAt = null`,
     independentemente de outros campos preenchidos.

**AC-17**
WHEN o psicólogo submete o formulário sem preencher o campo Valor
THEN o sistema exibe "O valor da sessão é obrigatório" abaixo do campo
     e não submete.

**AC-18**
WHEN o psicólogo submete o formulário com valor igual a zero ou negativo
     (ex: R$ 0,00 ou -50,00)
THEN o sistema exibe "O valor deve ser maior que zero" abaixo do campo
     e não submete.

**AC-19**
WHEN o psicólogo submete o formulário com valor não numérico
     (ex: letras ou caracteres especiais após formatação)
THEN o sistema exibe "Informe um valor válido em reais" abaixo do campo
     e não submete.

**AC-20**
WHILE o formulário de pagamento está sendo submetido
THEN o sistema desabilita o botão "Salvar" e exibe indicador de loading.

### Edição de pagamento existente

**AC-21**
WHEN o psicólogo clica em "Editar pagamento" nos detalhes da consulta
THEN o sistema exibe o formulário preenchido com os valores atuais do
     `session_payments` correspondente.

**AC-22**
WHEN o psicólogo altera o status de `pending` para `paid` e salva
THEN o sistema atualiza `status = paid` e `paidAt = now()` no registro
     e exibe toast "Pagamento atualizado".

**AC-23**
WHEN o psicólogo altera o status de `paid` para `pending` e salva
THEN o sistema atualiza `status = pending` e `paidAt = null` no registro
     e exibe toast "Pagamento atualizado".

**AC-24**
WHEN o psicólogo altera apenas o valor e salva
THEN o sistema atualiza `amountCents` com o novo valor convertido para centavos
     e exibe toast "Pagamento atualizado".

### Autorização e isolamento

**AC-25**
THE SYSTEM SHALL incluir `where: { userId: session.user.id }` em toda query
     que acesse ou modifique `session_payments`, sem exceção.

**AC-26**
WHEN um usuário não autenticado tenta acessar `/financeiro`
THEN o sistema redireciona para `/login`.

**AC-27**
WHEN o psicólogo autenticado tenta registrar ou editar pagamento para uma
     consulta cujo `userId` não corresponde ao seu `id`
THEN o sistema retorna erro 404 sem criar ou modificar nenhum registro.

---

## Wireframe Textual

### Tela 1 — Tela de upgrade (plano free) (`/financeiro`)

```
+--------------------------------------------------+
| [< Dashboard]              Financeiro            |
+--------------------------------------------------+
|                                                  |
|      [ícone cadeado]                             |
|                                                  |
|      Controle financeiro                         |
|      disponível no plano Pro                     |
|                                                  |
|  Saiba exatamente quanto você faturou,           |
|  quais sessões estão pagas e quais               |
|  ainda estão pendentes.                          |
|                                                  |
|         [ Assinar plano pro — R$ 39/mês ]        |
|                                                  |
|  Já assinou? Verifique sua assinatura            |
+--------------------------------------------------+
```

**Elementos:**
- Ícone de cadeado ou bloqueio para sinalizar conteúdo premium
- Título e subtítulo explicando o valor da feature
- Botão CTA de assinatura, destaque visual
- Link secundário para verificar assinatura existente

---

### Tela 2 — Resumo financeiro (plano pro) (`/financeiro`)

```
+--------------------------------------------------+
| [< Dashboard]              Financeiro            |
+--------------------------------------------------+
|                                                  |
| [ < ]  Abril 2026  [ > ]                         |
|                                                  |
+----------------+----------------+----------------+
| Recebido       | Pendente       | Sessões        |
| R$ 1.950,00    | R$ 300,00      | 15             |
+----------------+----------------+----------------+
|                                                  |
| Filtrar:  [Todas]  [Pagas]  [Pendentes]          |
|                                                  |
|--------------------------------------------------|
| Ana Beatriz Costa           24 abr · 09:00       |
| R$ 150,00  PIX              [Pago    ]           |
|--------------------------------------------------|
| Carlos Mendes               23 abr · 14:00       |
| R$ 150,00  —                [Pendente]           |
|--------------------------------------------------|
| Fernanda Rocha              22 abr · 10:00       |
| R$ 200,00  Cartão           [Pago    ]           |
|--------------------------------------------------|
|                                                  |
+--------------------------------------------------+
```

**Elementos:**
- Seletor de período: mês e ano com navegação por setas (anterior/próximo)
- Três cards de resumo: Recebido, Pendente, Sessões — em linha
- Filtro de status por segmento de botões: Todas / Pagas / Pendentes
- Lista de sessões com pagamento: nome do paciente, data e horário, valor, forma de pagamento
  (exibida se preenchida, "-" se ausente) e badge de status
- Toque em um item da lista navega para os detalhes da consulta

**Estado vazio:**
```
+--------------------------------------------------+
| [ < ]  Março 2026  [ > ]                         |
|                                                  |
+----------------+----------------+----------------+
| Recebido       | Pendente       | Sessões        |
| R$ 0,00        | R$ 0,00        | 0              |
+----------------+----------------+----------------+
|                                                  |
|    Nenhuma sessão com pagamento registrado       |
|    neste período.                                |
|                                                  |
+--------------------------------------------------+
```

---

### Tela 3 — Seção de pagamento nos detalhes da consulta (`/appointments/[id]`)

**Estado: consulta realizada sem pagamento registrado**
```
+--------------------------------------------------+
| ...detalhes da consulta acima...                 |
|--------------------------------------------------|
| Pagamento                                        |
|                                                  |
|  Nenhum pagamento registrado.                    |
|                                                  |
|  [ Registrar pagamento ]                         |
+--------------------------------------------------+
```

**Estado: consulta realizada com pagamento registrado**
```
+--------------------------------------------------+
| ...detalhes da consulta acima...                 |
|--------------------------------------------------|
| Pagamento                        [Editar]        |
|                                                  |
|  R$ 150,00  ·  PIX               [Pago    ]      |
|  Recebido em 24/04/2026                          |
|  (observações se preenchidas)                    |
+--------------------------------------------------+
```

---

### Tela 4 — Formulário de registro/edição de pagamento (sheet lateral ou inline)

```
+------------------------------------------+
| Registrar pagamento                  [x]  |
|                                           |
| Ana Beatriz Costa                         |
| 24 abr 2026 · 09:00–09:50                |
|                                           |
| Valor (R$) *                              |
| [  150,00                        ]        |
|                                           |
| Forma de pagamento                        |
| [ PIX      ▼ ]                            |
| (opções: PIX / Dinheiro / Cartão /        |
|  Transferência / Não informar)            |
|                                           |
| Status *                                  |
| ( ) Pendente   (•) Pago                   |
|                                           |
| Observações                               |
| [                                ]        |
|                                           |
|   [Cancelar]          [Salvar]            |
+------------------------------------------+
```

**Elementos:**
- Título indica se é registro novo ou edição
- Contexto da consulta: nome do paciente, data e horário (somente leitura)
- Campo Valor: numérico, formatado como moeda (R$), obrigatório
- Seletor de forma de pagamento: PIX, Dinheiro, Cartão, Transferência — opcional
- Seletor de status: Pendente / Pago — obrigatório, padrão Pendente
- Campo Observações: texto livre, opcional
- Botão Cancelar fecha sem salvar
- Botão Salvar desabilitado durante submissão com spinner

---

## Regras de Negócio

**RN-01 — Disponibilidade exclusiva no plano pro**
O controle financeiro está disponível apenas para psicólogos com `users.plan = pro`.
Usuários com `plan = free` veem a tela de upgrade ao acessar `/financeiro` e não
têm acesso ao formulário de registro de pagamento, mesmo que acessem os detalhes
de uma consulta. A verificação é feita na Server Action e no Server Component.

**RN-02 — Vínculo obrigatório com consulta realizada**
Registro de pagamento só pode ser criado para consultas com `status = completed`.
Consultas com outro status (`scheduled`, `confirmed`, `cancelled`, `no_show`) não
exibem a seção de pagamento e não aceitam registro via Server Action.

**RN-03 — Unicidade de pagamento por consulta**
Cada consulta pode ter no máximo um registro de pagamento. A constraint
`UNIQUE (appointment_id)` em `session_payments` garante isso no banco. Em código,
a Server Action verifica existência antes de criar, redirecionando para edição
se já houver registro.

**RN-04 — Valor armazenado em centavos**
O campo `amount_cents` armazena o valor em centavos (inteiro) para evitar problemas
de arredondamento. R$ 150,00 = 15000 centavos. A conversão de R$ para centavos é
feita na Server Action (`valor * 100` após parse numérico). A exibição converte
centavos para R$ (`valor / 100`, formatado com `Intl.NumberFormat`).

**RN-05 — Preenchimento de `paidAt` condicional ao status**
Quando `status = paid`, o campo `paidAt` é preenchido com `new Date()` no momento
do registro ou da atualização. Quando `status = pending`, `paidAt` é sempre `null`.
Ao alterar status de `paid` para `pending`, o campo `paidAt` deve ser zerado.

**RN-06 — Forma de pagamento é opcional**
O campo `paymentMethod` não é obrigatório. O psicólogo pode registrar o pagamento
sem informar a forma. A listagem exibe "-" quando o campo está vazio.

**RN-07 — Resumo calculado por período**
O resumo mensal é calculado com base no campo `appointments.scheduled_at` da consulta
vinculada, não em `session_payments.paid_at`. Isso garante que a sessão aparece no
mês em que ocorreu, independentemente de quando foi registrado o pagamento.

**RN-08 — Período padrão é o mês atual**
Ao acessar `/financeiro`, o período selecionado por padrão é o mês e ano correntes.
A navegação por período não altera a URL — é estado local do componente cliente.

**RN-09 — Isolamento por psicólogo**
Todo acesso à tabela `session_payments` inclui obrigatoriamente
`where: { userId: session.user.id }`. O campo `user_id` é denormalizado em
`session_payments` para RLS eficiente (ver ADR `user-id-denormalizacao-rls.md`).

**RN-10 — Sem exclusão de registro de pagamento**
No MVP, não há funcionalidade de excluir um registro de pagamento. O psicólogo
pode editar status, valor e forma de pagamento, mas não remover o registro. Se a
consulta for excluída (soft delete), o `session_payments` vinculado é removido
em cascata pelo banco (`ON DELETE CASCADE`).

---

## Casos de Erro

**CE-01 — Acesso ao financeiro sem plano pro**
Psicólogo com `plan = free` acessa `/financeiro`: exibe tela de upgrade.
Mesmo comportamento se tentar acessar via URL direta — não há erro 403, apenas
tela de upgrade informativa.

**CE-02 — Consulta não encontrada ou sem permissão ao registrar pagamento**
Server Action chamada com `appointmentId` inexistente ou pertencente a outro
psicólogo: retorna erro `{ error: "not_found" }`, o cliente exibe toast
"Consulta não encontrada." e fecha o formulário.

**CE-03 — Consulta com status inválido para pagamento**
Server Action chamada para consulta com `status != completed`: retorna
`{ error: "invalid_status" }`, o cliente exibe toast "Pagamento só pode ser
registrado para sessões realizadas." e fecha o formulário.

**CE-04 — Valor inválido no formulário**
Valor vazio, zero ou negativo: mensagem inline abaixo do campo.
Valor não numérico após formatação: mensagem inline "Informe um valor válido em reais".
Nenhum desses casos submete o formulário.

**CE-05 — Erro de servidor ao salvar pagamento**
Se a Server Action falhar (ex: banco indisponível): exibe toast "Não foi possível
salvar o pagamento. Tente novamente." sem fechar o formulário, preservando os dados
preenchidos. O erro é registrado no Sentry.

**CE-06 — Plano pro expirado durante a sessão**
Se `users.plan_expires_at` expirou enquanto o psicólogo estava autenticado:
na próxima requisição autenticada ao financeiro, o sistema detecta `plan != pro`
e exibe a tela de upgrade. Não há mensagem específica de expiração — apenas a
tela de upgrade padrão.

---

## Dados e API

### Entidades utilizadas

- `session_payments` — criação, leitura e atualização
- `appointments` — leitura para validar `status = completed`, exibir contexto
  da sessão (data, horário) e como base para cálculo do período (por `scheduled_at`)
- `patients` — leitura para exibir nome do paciente na listagem e no formulário
- `users` — leitura do campo `plan` para verificação de acesso (plano pro/free)

### Server Actions

| Ação | Arquivo sugerido | Descrição |
|---|---|---|
| `createSessionPayment` | `features/payments/actions/createSessionPayment.ts` | Verifica plano pro, valida que `appointment.status = completed` e que pertence ao psicólogo autenticado, converte valor para centavos, cria registro em `session_payments`. |
| `updateSessionPayment` | `features/payments/actions/updateSessionPayment.ts` | Verifica plano pro, valida `userId` do registro existente, atualiza `amountCents`, `status`, `paidAt` (condicional), `paymentMethod` e `notes`. |

### Queries (Server Components)

| Query | Descrição |
|---|---|
| `getFinancialSummary(userId, year, month)` | Agrega `session_payments` com join em `appointments` filtrando por `scheduled_at` no intervalo do mês. Retorna `totalPaidCents`, `totalPendingCents`, `sessionCount`, `pendingCount`. |
| `getSessionPaymentsByPeriod(userId, year, month, statusFilter?)` | Lista `session_payments` com join em `appointments` e `patients` para o período e filtro de status. Ordena por `appointments.scheduled_at DESC`. |
| `getSessionPaymentByAppointment(userId, appointmentId)` | Busca `session_payments` pelo `appointment_id` com validação de `userId`. Retorna `null` se não existir. |

### Schemas Zod

```typescript
// features/payments/schema.ts

import { z } from "zod"

export const SessionPaymentFormSchema = z.object({
  appointmentId: z.string().uuid("ID da consulta inválido"),
  amountBRL: z
    .string()
    .min(1, "O valor da sessão é obrigatório")
    .transform((val) => parseFloat(val.replace(",", ".")))
    .refine((val) => !isNaN(val) && val > 0, "O valor deve ser maior que zero"),
  status: z.enum(["pending", "paid"], {
    required_error: "Selecione o status do pagamento",
  }),
  paymentMethod: z
    .enum(["pix", "cash", "card", "transfer"])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})

export const UpdateSessionPaymentSchema = z.object({
  paymentId: z.string().uuid("ID do pagamento inválido"),
  amountBRL: z
    .string()
    .min(1, "O valor da sessão é obrigatório")
    .transform((val) => parseFloat(val.replace(",", ".")))
    .refine((val) => !isNaN(val) && val > 0, "O valor deve ser maior que zero"),
  status: z.enum(["pending", "paid"], {
    required_error: "Selecione o status do pagamento",
  }),
  paymentMethod: z
    .enum(["pix", "cash", "card", "transfer"])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})
```

### Rotas Next.js (App Router)

| Rota | Tipo | Descrição |
|---|---|---|
| `/financeiro` | Page (Server Component) | Resumo financeiro do período. Verifica plano — exibe upgrade se free, resumo se pro. |
| `/appointments/[id]` | Page existente | Detalhes da consulta, inclui seção de pagamento se `status = completed` (feature já existente em `agenda-consultas`). |

Todas as rotas ficam dentro do grupo `(auth)` protegido pelo middleware do NextAuth.

### Eventos disparados

Nenhum evento externo (webhook, e-mail, job) é disparado por esta feature.
O registro e a atualização de pagamentos são operações síncronas e locais.

---

## Fora do Escopo desta Feature

1. **Emissão de notas fiscais** — geração de NF-e, NFS-e ou recibos formais não
   está incluída no MVP. A emissão de nota fiscal exige integração com prefeituras
   ou sistemas contábeis e está explicitamente excluída do escopo do produto.

2. **Integração com meios de pagamento online** — links de pagamento, cobranças via
   PIX API, cartão de crédito online ou qualquer integração com gateways de
   pagamento (Stripe Checkout, Mercado Pago, PagBank) não fazem parte desta feature.
   O psicólogo registra pagamentos recebidos fora do sistema.

3. **Relatórios financeiros avançados** — gráficos de evolução mensal, DRE,
   comparativos por paciente ou por período longo, exportação para CSV/Excel não
   estão incluídos. O MVP oferece apenas o resumo mensal com totais.

4. **Histórico de edições de pagamento** — alterações em `amount_cents`, `status`
   ou `payment_method` sobrescrevem o valor anterior sem registro de histórico.
   Não há auditoria de mudanças nos campos financeiros.

5. **Controle financeiro para plano free** — usuários no plano free não têm acesso
   a nenhuma funcionalidade de controle financeiro, nem em modo de leitura. A
   restrição é intencional como mecanismo de upsell.

6. **Múltiplos pagamentos por consulta** — cada consulta tem exatamente um registro
   de pagamento (`UNIQUE appointment_id`). Pagamentos parcelados ou múltiplos
   recebimentos por sessão não são suportados no MVP. O campo `notes` pode ser
   usado para registrar observações sobre parcelamentos informais.

---

## Dependências

**Pré-requisitos obrigatórios:**
- `autenticacao` — todas as rotas de financeiro estão dentro do grupo `(auth)`
  e requerem sessão autenticada via NextAuth. A verificação de plano lê `session.user.id`
  para consultar `users.plan`.
- `agenda-consultas` — o pagamento é vinculado a uma consulta com `status = completed`.
  A feature de agenda é responsável pela transição de status das consultas.
- `cadastro-pacientes` — o nome do paciente é exibido na listagem financeira e no
  formulário de pagamento, via join com `patients`.

**Features que dependem desta:**
- Nenhuma outra feature do MVP depende de `session_payments`.
