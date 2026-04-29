# Feature: Confirmação de Consulta pelo Paciente

**Slug:** `confirmacao-paciente`
**Prioridade:** must-have
**Fase:** 2 — Specs
**Criada em:** 2026-04-27
**Status:** aguardando aprovação

---

## Contexto

A feature `lembretes-consulta` cobre toda a geração de tokens, a página pública
`/confirm/[token]` e o processamento da resposta do paciente (confirmação ou
cancelamento via link). Esta spec não duplica esses fluxos — ela foca em três
lacunas complementares que precisam de especificação própria:

1. **Experiência do psicólogo após o paciente responder** — o psicólogo precisa
   perceber, de forma clara e rápida, que o paciente confirmou ou cancelou. A spec
   de `lembretes-consulta` define que o status atualizado é visível ao recarregar
   o painel de detalhes, mas a agenda semanal/diária e o indicador visual em lista
   de consultas precisam ser especificados.

2. **Cancelamento direto pelo psicólogo via agenda** — o psicólogo deve poder
   cancelar uma consulta diretamente pela interface, informando um motivo opcional.
   Este fluxo é distinto do cancelamento pelo paciente via token e precisa de
   critérios próprios.

3. **Tratamento de conflito entre cancelamento do psicólogo e token ativo do
   paciente** — se o psicólogo cancela uma consulta enquanto o token do paciente
   ainda é válido, o sistema precisa invalidar o token para evitar que o paciente
   confirme uma consulta já cancelada.

**Atores:**
- **Psicólogo autenticado** — cancela consultas pela agenda, visualiza status após
  resposta do paciente
- **Paciente** (sem conta) — já coberto por `lembretes-consulta`; referenciado aqui
  apenas para descrever o conflito com o fluxo do psicólogo

**Dependências desta feature:**
- `lembretes-consulta` — aprovada. Define token, página pública e transições de
  `appointment.status` após ação do paciente. Esta spec consome essas definições.
- `agenda-consultas` — aprovada. Define a visualização semanal/diária onde os
  indicadores de status desta spec precisam aparecer.

---

## User Stories

### Fluxo principal — psicólogo percebe resposta do paciente

**US-01**
Como psicólogo autenticado visualizando a agenda semanal ou diária,
quero ver claramente quais consultas foram confirmadas ou canceladas pelo paciente,
para priorizar meu dia sem precisar abrir cada consulta individualmente.

**US-02**
Como psicólogo autenticado que abriu o painel de detalhes de uma consulta,
quero ver o status de confirmação do paciente (confirmada, cancelada, aguardando),
para saber se preciso entrar em contato antes da sessão.

### Fluxo alternativo — cancelamento direto pelo psicólogo

**US-03**
Como psicólogo autenticado,
quero cancelar uma consulta diretamente pela agenda informando um motivo opcional,
para registrar o cancelamento sem precisar aguardar o paciente responder ao link.

**US-04**
Como psicólogo autenticado que cancelou uma consulta por engano,
quero ser solicitado a confirmar o cancelamento antes de ele ser efetivado,
para evitar ações acidentais em consultas da semana.

### Fluxo alternativo — conflito de cancelamento

**US-05**
Como paciente que acessa um link de confirmação de uma consulta já cancelada
pelo psicólogo,
quero ver uma mensagem clara informando que a consulta não está mais disponível,
para entender o que aconteceu sem confusão.

### Estado vazio

**US-06**
Como psicólogo autenticado visualizando a agenda em uma semana sem consultas,
quero ver um estado vazio informativo,
para saber que a agenda está carregada e não há erro de exibição.

### Erros esperados

**US-07**
Como psicólogo autenticado que tenta cancelar uma consulta já em status terminal
(`completed`, `cancelled`, `no_show`),
quero ser informado de que a ação não é mais possível,
para entender por que o botão de cancelamento não está disponível.

---

## Critérios de Aceite

### Indicadores visuais de status na agenda

**AC-01**
WHEN o psicólogo visualiza a agenda semanal ou diária
THEN cada bloco de consulta exibe um indicador de status visível sem abrir o painel
     de detalhes, seguindo esta correspondência:
     - `scheduled` → sem indicador de resposta (somente ícone de calendário)
     - `confirmed` → indicador verde com texto "Confirmada"
     - `cancelled` → bloco com aparência esmaecida e texto "Cancelada"
     - `completed` → indicador com texto "Realizada"
     - `no_show` → indicador com texto "Falta"

**AC-02**
WHEN a consulta tem `status = confirmed` e o token foi acionado pelo paciente
     (`appointment_tokens.action = confirmed`)
THEN o bloco na agenda exibe o indicador "Confirmada pelo paciente" distinto de
     uma futura confirmação manual pelo psicólogo.

**AC-03**
WHEN a consulta tem `status = cancelled` e o token foi acionado pelo paciente
     (`appointment_tokens.action = cancelled`)
THEN o bloco na agenda exibe "Cancelada pelo paciente", distinto de "Cancelada
     pelo psicólogo" quando o cancelamento foi feito diretamente pela agenda.

**AC-04**
WHEN o psicólogo carrega a agenda semanal ou diária
THEN os dados de status de todas as consultas do intervalo visível são carregados
     junto com as consultas em uma única query, sem requisição adicional por consulta.

### Cancelamento direto pelo psicólogo

**AC-05**
WHEN o psicólogo autenticado abre o painel de detalhes de uma consulta com
     `status = scheduled` ou `status = confirmed`
THEN o sistema exibe o botão "Cancelar consulta" na seção de ações do painel.

**AC-06**
WHEN o psicólogo clica em "Cancelar consulta"
THEN o sistema exibe um diálogo de confirmação contendo: dados da consulta (paciente,
     data e hora), campo de texto opcional "Motivo do cancelamento" (máx. 500 caracteres)
     e botões "Voltar" e "Confirmar cancelamento".

**AC-07**
WHEN o psicólogo confirma o cancelamento no diálogo
THEN o sistema executa atomicamente:
     - `appointment.status = cancelled`
     - `appointment.cancellation_reason = motivo informado` (ou null se não informado)
     - Invalida o token ativo mais recente da consulta, se existir, atualizando
       `appointment_tokens.expires_at = now()`
     e fecha o diálogo exibindo toast "Consulta cancelada".

**AC-08**
WHEN o psicólogo clica em "Voltar" no diálogo de cancelamento
THEN o sistema fecha o diálogo sem alterar nenhum dado e retorna ao painel de detalhes.

**AC-09**
WHEN o psicólogo tenta cancelar uma consulta com `status = completed`,
     `cancelled` ou `no_show`
THEN o botão "Cancelar consulta" não está visível no painel de detalhes para esses status.

**AC-10**
WHILE o cancelamento está sendo processado após confirmar no diálogo
THEN o botão "Confirmar cancelamento" fica desabilitado e exibe indicador de loading
     até a operação concluir ou retornar erro.

### Tratamento de conflito — psicólogo cancela com token ativo

**AC-11**
WHEN o psicólogo confirma o cancelamento de uma consulta que possui token ativo
     (não expirado e não usado em `appointment_tokens`)
THEN o sistema invalida o token ativo atualizando `expires_at = now()` na mesma
     transação de banco que altera o status da consulta, garantindo atomicidade.

**AC-12**
WHEN o paciente acessa `/confirm/[token]` de uma consulta cujo status é `cancelled`
     porque o psicólogo cancelou
THEN o sistema exibe a página informativa "Esta consulta não está mais disponível
     para confirmação." sem exibir botões de ação.
     (Este comportamento é coberto por AC-20 de `lembretes-consulta` e é listado
     aqui como critério de integração entre as duas features.)

**AC-13**
WHEN o psicólogo cancela uma consulta e o token é invalidado com sucesso
THEN o toast de confirmação exibe apenas "Consulta cancelada" — sem mensagem
     separada sobre o token, pois essa invalidação é um detalhe de implementação
     não visível ao usuário.

### Visualização de motivo de cancelamento pelo psicólogo

**AC-14**
WHEN a consulta tem `status = cancelled` e `cancellation_reason` está preenchido
THEN o painel de detalhes da consulta exibe o campo "Motivo:" com o texto registrado
     pelo psicólogo na seção de informações da consulta.

**AC-15**
WHEN a consulta tem `status = cancelled` e `cancellation_reason` é null
     (cancelamento pelo paciente via link, que não possui campo de motivo)
THEN o painel de detalhes não exibe o campo "Motivo:" — omite silenciosamente.

### Autorização

**AC-16**
WHEN um usuário autenticado tenta cancelar uma consulta cujo `userId` não corresponde
     ao seu `id` de sessão
THEN o sistema retorna erro 404 sem expor que a consulta existe.

**AC-17**
WHEN um usuário não autenticado tenta acessar a Server Action de cancelamento
THEN o sistema retorna erro 401 sem executar a ação.

---

## Wireframe Textual

### Bloco de consulta na agenda semanal — variações de status

```
+-------------------------+     +-------------------------+
| 09:00 Ana Beatriz       |     | 09:00 Ana Beatriz       |
| Presencial              |     | Presencial              |
| [agendada]              |     | [Confirmada pelo pac.]  |
+-------------------------+     +-------------------------+

+-------------------------+     +-------------------------+
| 09:00 Ana Beatriz       |     | 09:00 Ana Beatriz       |
| Presencial              |     | Presencial              |
| [Cancelada pelo pac.]   |     | [Cancelada pelo psic.]  |
+-------------------------+     +-------------------------+
```

Consultas com status `cancelled` têm opacidade reduzida no bloco. Consultas com
`confirmed` têm borda ou fundo destacado (verde sutil). Sem especificação de cor
exata — apenas estrutura e lógica de variação visual.

### Painel de detalhes — seção de status após resposta do paciente

Após confirmação pelo paciente:
```
+------------------------------------------+
| Consulta                           [x]   |
|------------------------------------------|
| Ana Beatriz                              |
| Sex, 08 mai 2026 · 09:00–09:50           |
| Presencial · Rua das Flores, 100         |
|                                          |
| Status: [Confirmada pelo paciente]       |
|                                          |
|------------------------------------------|
| Lembrete                                 |
|  Paciente confirmou presença             |
|  em 06 mai 2026 às 10:15                 |
|  [Gerar novo lembrete]                   |
|------------------------------------------|
| Ações:                                   |
| [Marcar como realizada]                  |
| [Marcar como no-show]                    |
| [Editar consulta]                        |
| [Cancelar consulta]                      |
+------------------------------------------+
```

Após cancelamento pelo paciente:
```
+------------------------------------------+
| Consulta                           [x]   |
|------------------------------------------|
| Ana Beatriz                              |
| Sex, 08 mai 2026 · 09:00–09:50           |
| Presencial · Rua das Flores, 100         |
|                                          |
| Status: [Cancelada pelo paciente]        |
|                                          |
|------------------------------------------|
| Lembrete                                 |
|  Paciente cancelou via link              |
|  em 06 mai 2026 às 08:40                 |
|------------------------------------------|
| Ações:                                   |
|  (nenhuma ação disponível)               |
+------------------------------------------+
```

### Diálogo de cancelamento pelo psicólogo

```
+----------------------------------------------+
|  Cancelar consulta                      [x]  |
|----------------------------------------------|
|  Tem certeza que deseja cancelar?            |
|                                              |
|  Ana Beatriz                                 |
|  Sexta-feira, 08 mai 2026 · 09:00            |
|                                              |
|  Motivo do cancelamento (opcional):          |
|  [                                       ]   |
|  [                                       ]   |
|  (máx. 500 caracteres)                       |
|                                              |
|  [Voltar]     [Confirmar cancelamento]       |
+----------------------------------------------+
```

Estado de loading após confirmar:
```
|  [Voltar]     [Cancelando...          ]      |
```

### Painel de detalhes — consulta cancelada pelo psicólogo com motivo

```
+------------------------------------------+
| Consulta                           [x]   |
|------------------------------------------|
| Ana Beatriz                              |
| Sex, 08 mai 2026 · 09:00–09:50           |
| Presencial · Rua das Flores, 100         |
|                                          |
| Status: [Cancelada pelo psicólogo]       |
| Motivo: Psicólogo em viagem.             |
|                                          |
|------------------------------------------|
| Lembrete                                 |
|  (exibe histórico de lembrete se houver, |
|   sem botão de ação)                     |
|------------------------------------------|
| Ações:                                   |
|  (nenhuma ação disponível)               |
+------------------------------------------+
```

### Estado vazio da agenda

```
+------------------------------------------+
|  Semana de 05 a 11 mai 2026              |
|  < Semana anterior   Próxima semana >    |
|------------------------------------------|
|                                          |
|  Nenhuma consulta agendada               |
|  para esta semana.                       |
|                                          |
|  [Agendar consulta]                      |
|                                          |
+------------------------------------------+
```

---

## Regras de Negócio

**RN-01 — Origem do cancelamento**
O campo `appointments.cancellation_reason` é preenchido somente quando o
cancelamento é feito pelo psicólogo via agenda (fluxo desta feature). Quando o
cancelamento é feito pelo paciente via token (fluxo de `lembretes-consulta`),
`cancellation_reason` permanece null — o link de token não solicita motivo.

A distinção entre "cancelado pelo paciente" e "cancelado pelo psicólogo" é inferida
a partir de `appointment_tokens`:
- Se existe token com `action = cancelled` e `used_at IS NOT NULL`: cancelado pelo
  paciente via link.
- Se `status = cancelled` e nenhum token tem `action = cancelled`: cancelado pelo
  psicólogo diretamente.

Esta lógica é aplicada nas queries do painel de detalhes e dos blocos da agenda.

**RN-02 — Atomicidade do cancelamento com invalidação de token**
O cancelamento pelo psicólogo deve executar em uma única transação Prisma:
1. `UPDATE appointments SET status = 'cancelled', cancellation_reason = ? WHERE id = ?`
2. `UPDATE appointment_tokens SET expires_at = now() WHERE appointment_id = ? AND used_at IS NULL AND expires_at > now()`

Se qualquer parte da transação falhar, nenhuma alteração é persistida.

**RN-03 — Token inválido não bloqueia cancelamento**
Se a consulta não possui token ativo no momento do cancelamento pelo psicólogo,
o sistema executa apenas a atualização de `appointments.status` sem erro. A
ausência de token ativo é um estado válido.

**RN-04 — Cancelamento não gera notificação ao paciente no MVP**
Quando o psicólogo cancela uma consulta, o paciente não recebe e-mail, SMS ou
push notification automaticamente. O psicólogo é responsável por comunicar
o cancelamento ao paciente por fora do sistema (WhatsApp, telefone).
Notificação automática ao paciente em cancelamentos do psicólogo está no backlog.

**RN-05 — Status terminal impede novas ações**
Consultas com `status = completed`, `cancelled` ou `no_show` não exibem o botão
"Cancelar consulta". O painel de detalhes exibe apenas informações históricas
e o histórico de lembrete (se houver), sem botões de ação.

**RN-06 — Exibição de origem na agenda**
A agenda semanal/diária deve distinguir visualmente consultas confirmadas pelo
paciente (via token) de consultas em status `scheduled`. No MVP, não há
confirmação manual pelo psicólogo — o único caminho para `status = confirmed`
é via token do paciente (definido em `lembretes-consulta`). Esta distinção
não requer lógica adicional além do campo `status`.

**RN-07 — Comprimento do motivo de cancelamento**
O campo `cancellation_reason` aceita texto livre até 500 caracteres. Validação
aplicada no schema Zod antes de persistir. O banco armazena como `TEXT` sem
limite explícito — o limite é aplicado em código.

---

## Dados e API

### Entidades utilizadas

- `appointments` — leitura de `status`, `cancellation_reason`, `scheduled_at`,
  `patient_id`; atualização de `status` e `cancellation_reason` no cancelamento
  pelo psicólogo
- `appointment_tokens` — leitura de `action`, `used_at`, `expires_at` para inferir
  origem do cancelamento e exibir status de lembrete; atualização de `expires_at`
  ao cancelar via agenda (invalidação do token ativo)
- `patients` — leitura do nome para exibição no diálogo de cancelamento e blocos
  da agenda
- `users` — não usada diretamente por esta feature; já disponível via sessão NextAuth

### Server Actions (psicólogo autenticado)

| Ação | Arquivo sugerido | Descrição |
|---|---|---|
| `cancelAppointment` | `features/appointments/actions/cancelAppointment.ts` | Valida que `userId` da sessão corresponde ao `userId` da consulta. Valida que `status` é `scheduled` ou `confirmed`. Executa transação: atualiza `status` e `cancellation_reason` em `appointments`; invalida token ativo em `appointment_tokens` se existir. |

### Queries (Server Components)

| Query | Arquivo sugerido | Descrição |
|---|---|---|
| `getAppointmentsForWeek(userId, weekStart, weekEnd)` | `features/appointments/queries/getAppointmentsForWeek.ts` | Retorna todas as consultas do intervalo com `status`, `cancellation_reason` e o token mais recente (`action`, `used_at`) via join. Dados suficientes para renderizar os blocos da agenda com indicadores de status e origem. |
| `getAppointmentDetails(appointmentId, userId)` | `features/appointments/queries/getAppointmentDetails.ts` | Retorna dados completos da consulta, incluindo o token mais recente. Já existe implicitamente em `agenda-consultas`; esta feature adiciona o join com `appointment_tokens` se ainda não incluído. |

### Schema Zod

```typescript
// features/appointments/schema.ts (adição ao schema existente)

import { z } from "zod"

export const CancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
  cancellationReason: z
    .string()
    .max(500, "Motivo deve ter no máximo 500 caracteres")
    .optional(),
})
```

### Rotas Next.js (App Router)

Esta feature não cria novas rotas. As interações ocorrem nas rotas existentes:

| Rota | Tipo | Auth | Uso por esta feature |
|---|---|---|---|
| `/appointments` | Page (Server Component) | Protegida | Agenda semanal/diária — exibe indicadores de status |
| `/appointments/[id]` | Page (Server Component) | Protegida | Painel de detalhes — botão cancelar, status pós-resposta |

A Server Action `cancelAppointment` é acionada a partir de `/appointments/[id]`
(painel de detalhes) ou, opcionalmente, do bloco de consulta na agenda, mas o
diálogo de confirmação sempre deve ser exibido antes de executar a ação.

---

## Fora do Escopo desta Feature

1. **Fluxo do paciente via página pública `/confirm/[token]`** — completamente
   especificado em `lembretes-consulta` (AC-13 a AC-20 daquela spec). Esta feature
   não reescreve nem complementa esses critérios.

2. **Notificação automática ao paciente quando o psicólogo cancela** — no MVP,
   o sistema não envia e-mail, SMS ou push ao paciente após cancelamento pelo
   psicólogo. Comunicação do cancelamento é responsabilidade do psicólogo por
   canal externo.

3. **Reativação de consulta cancelada** — não há fluxo de "desfazer cancelamento"
   ou reabrir uma consulta cancelada. Se necessário, o psicólogo deve criar uma
   nova consulta.

4. **Auditoria de histórico de status** — o sistema não mantém log de todas as
   transições de status de uma consulta. Apenas o estado atual (`status`,
   `cancellation_reason`) e o token mais recente são armazenados e exibidos.

5. **Motivo de cancelamento pelo paciente** — quando o paciente cancela via link,
   nenhum campo de motivo é coletado. Isso está declarado em `lembretes-consulta`
   (RN-08) e reafirmado aqui para evitar ambiguidade.

6. **Cancelamento em lote** — o psicólogo não pode cancelar múltiplas consultas
   de uma vez. O cancelamento é sempre individual, consulta por consulta.

---

## Dependências

**Pré-requisitos obrigatórios:**
- `lembretes-consulta` — aprovada. Esta feature consome as definições de token,
  transições de status e os critérios AC-13 a AC-20 daquela spec sem duplicá-los.
  A implementação de `confirmacao-paciente` só começa após `lembretes-consulta`
  estar implementada.
- `agenda-consultas` — aprovada. Os indicadores de status desta feature são
  exibidos nos blocos de consulta da agenda definida naquela spec.

**Features que dependem desta:**
- Nenhuma feature do MVP depende de `confirmacao-paciente`. É um nó folha no
  grafo de dependências.
