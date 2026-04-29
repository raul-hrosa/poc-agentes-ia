# Feature: Agenda de Consultas

**Slug:** `agenda-consultas`
**Prioridade:** must-have
**Fase:** 2 — Specs
**Criada em:** 2026-04-27
**Status:** aguardando aprovação

---

## Contexto

A agenda de consultas é o núcleo do PsiAgenda. Sem ela o produto não existe — o
psicólogo não consegue organizar seus atendimentos, controlar no-shows ou saber
o que acontece em cada dia de trabalho.

Esta feature cobre o ciclo completo de gerenciamento de consultas: criação,
edição, cancelamento e acompanhamento de status. A visualização semanal e diária
permite ao psicólogo ter uma visão clara de sua semana e de cada dia de trabalho.

**Por que esta feature resolve o problema central:**
Psicólogos autônomos iniciantes gerenciam sua agenda em papel, cadernos ou
aplicativos genéricos que não entendem o fluxo clínico. O PsiAgenda substitui
esse controle manual por uma agenda digital que acompanha o status de cada
consulta — de agendada até realizada ou não-comparecimento.

**Dependências desta feature:**
- `cadastro-pacientes` deve estar implementada — toda consulta é vinculada a um
  paciente existente. Não é possível criar consulta sem paciente cadastrado.

**Features que dependem desta:**
- `lembretes-consulta` — o lembrete é gerado a partir de um `appointment` existente
- `confirmacao-paciente` — a confirmação atualiza o `status` de um `appointment`
- `prontuario-sessao` — o prontuário é vinculado a um `appointment` com `status = completed`
- `controle-financeiro` — o registro de pagamento é vinculado a um `appointment`

---

## User Stories

### Fluxo principal — criação de consulta

**US-01**
Como psicólogo autenticado,
quero criar uma consulta informando paciente, data, hora e modalidade,
para ter esse atendimento registrado na minha agenda com status inicial "agendada".

**US-02**
Como psicólogo autenticado,
quero definir a duração de cada consulta ao criá-la,
para que a agenda bloqueie o tempo correto e não sobreponha atendimentos.

**US-03**
Como psicólogo autenticado,
quero informar um endereço ou link de videochamada ao criar uma consulta,
para ter esse dado disponível no dia do atendimento sem precisar procurar em outro lugar.

### Fluxo principal — visualização

**US-04**
Como psicólogo autenticado,
quero ver uma visualização semanal da minha agenda,
para ter uma visão geral de todos os atendimentos da semana e identificar horários livres.

**US-05**
Como psicólogo autenticado,
quero ver uma visualização diária de um dia específico,
para acompanhar os atendimentos daquele dia em ordem cronológica com todos os detalhes relevantes.

**US-06**
Como psicólogo autenticado,
quero navegar entre semanas e dias na agenda,
para consultar atendimentos passados e planejar semanas futuras.

### Fluxo principal — edição

**US-07**
Como psicólogo autenticado,
quero editar os dados de uma consulta já agendada,
para corrigir data, hora, paciente ou modalidade sem precisar cancelar e recriar.

### Fluxo principal — cancelamento

**US-08**
Como psicólogo autenticado,
quero cancelar uma consulta informando o motivo,
para manter o histórico da agenda com a razão do cancelamento registrada.

### Fluxo principal — mudança de status

**US-09**
Como psicólogo autenticado,
quero marcar uma consulta como "realizada" após o atendimento,
para registrar que a sessão aconteceu e liberar o acesso ao prontuário.

**US-10**
Como psicólogo autenticado,
quero marcar uma consulta como "no-show" quando o paciente não compareceu sem avisar,
para manter o controle de faltas sem aviso e distinguir de um cancelamento formal.

### Perfis alternativos

**US-11**
Como psicólogo autenticado com a agenda vazia na semana atual,
quero ver uma mensagem orientativa na visualização semanal,
para entender como criar minha primeira consulta sem precisar de suporte.

**US-12**
Como psicólogo autenticado,
quero filtrar a agenda por paciente específico,
para ver o histórico de todas as consultas de um paciente em ordem cronológica.

### Estado vazio

**US-13**
Como psicólogo que acaba de criar sua conta e não tem consultas cadastradas,
quero ver um estado vazio com call-to-action claro na visualização semanal,
para entender o que preciso fazer a seguir no fluxo de uso do produto.

### Erros esperados

**US-14**
Como psicólogo autenticado,
quero ser avisado se tento criar uma consulta em horário já ocupado por outra consulta,
para evitar conflito de agendamentos sem precisar verificar manualmente a agenda.

---

## Critérios de Aceite

### Visualização semanal

**AC-01**
WHEN o psicólogo autenticado acessa `/appointments`
THEN o sistema exibe a visualização semanal da semana atual, com colunas para cada
     dia (segunda a domingo), mostrando as consultas de cada dia ordenadas por horário.

**AC-02**
WHEN o psicólogo acessa a visualização semanal
THEN cada consulta exibe: horário de início, nome do paciente e badge de status
     com cor correspondente ao status (`scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`).

**AC-03**
WHEN não há consultas na semana visualizada
THEN o sistema exibe mensagem "Nenhuma consulta nesta semana" e botão
     "Agendar consulta" dentro da área de conteúdo da semana.

**AC-04**
WHEN o psicólogo clica em "Semana anterior" ou "Próxima semana"
THEN o sistema atualiza a visualização para a semana correspondente e exibe
     o intervalo de datas no header (ex: "21–27 abr 2026").

**AC-05**
WHEN o psicólogo clica em "Hoje"
THEN o sistema retorna para a semana que contém a data atual e destaca visualmente
     a coluna do dia atual.

**AC-06**
WHEN o psicólogo clica sobre um dia na visualização semanal
THEN o sistema navega para a visualização diária daquele dia.

### Visualização diária

**AC-07**
WHEN o psicólogo acessa a visualização diária de um dia com consultas
THEN o sistema exibe todas as consultas daquele dia em ordem cronológica, cada uma
     com: horário de início e término, nome do paciente, modalidade, local/link
     (se preenchido) e status com badge colorido.

**AC-08**
WHEN o psicólogo acessa a visualização diária de um dia sem consultas
THEN o sistema exibe mensagem "Nenhuma consulta neste dia" e botão "Agendar consulta".

**AC-09**
WHEN o psicólogo clica em "Dia anterior" ou "Próximo dia" na visualização diária
THEN o sistema atualiza para o dia correspondente.

**AC-10**
WHEN o psicólogo clica sobre uma consulta na visualização diária ou semanal
THEN o sistema exibe o painel de detalhes da consulta com todos os campos e ações disponíveis.

### Criação de consulta

**AC-11**
WHEN o psicólogo submete o formulário de criação com `patient_id`, `scheduled_at`
     (data e hora), `duration_minutes` e `modality` válidos
THEN o sistema cria o registro em `appointments` com `userId` do psicólogo autenticado,
     `status = scheduled` e exibe toast "Consulta agendada com sucesso".

**AC-12**
WHEN o psicólogo tenta submeter o formulário sem selecionar um paciente
THEN o sistema exibe "Selecione um paciente" abaixo do campo e não submete.

**AC-13**
WHEN o psicólogo tenta submeter o formulário sem preencher data
THEN o sistema exibe "Data é obrigatória" abaixo do campo e não submete.

**AC-14**
WHEN o psicólogo tenta submeter o formulário sem preencher hora
THEN o sistema exibe "Horário é obrigatório" abaixo do campo e não submete.

**AC-15**
WHEN o psicólogo seleciona `modality = online` e deixa o campo `location` vazio
THEN o sistema permite o submit sem bloquear — `location` é opcional mesmo para consultas online.

**AC-16**
WHEN o psicólogo seleciona `modality = in_person` e deixa o campo `location` vazio
THEN o sistema permite o submit sem bloquear — `location` é opcional para consultas presenciais.

**AC-17**
WHEN o psicólogo preenche data e hora que conflitam com outra consulta existente
     (o intervalo `[scheduled_at, scheduled_at + duration_minutes]` se sobrepõe a outro appointment
     do mesmo psicólogo com status diferente de `cancelled`)
THEN o sistema exibe "Horário conflita com a consulta de [nome do paciente] às [hora]"
     e não cria a consulta.

**AC-18**
WHEN o psicólogo preenche `duration_minutes` com valor menor que 1
THEN o sistema exibe "Duração deve ser de pelo menos 1 minuto" e não submete.

**AC-19**
WHILE o formulário está sendo submetido
THEN o sistema desabilita o botão de submit e exibe indicador de loading.

### Edição de consulta

**AC-20**
WHEN o psicólogo acessa a edição de uma consulta com status `scheduled` ou `confirmed`
THEN o sistema exibe o formulário pré-preenchido com os dados atuais da consulta.

**AC-21**
WHEN o psicólogo submete o formulário de edição com dados válidos
THEN o sistema atualiza o registro em `appointments`, atualiza `updated_at`
     e exibe toast "Consulta atualizada com sucesso".

**AC-22**
WHEN o psicólogo tenta editar uma consulta com status `completed`, `cancelled` ou `no_show`
THEN o sistema não exibe o formulário de edição e exibe mensagem
     "Consultas finalizadas não podem ser editadas."

**AC-23**
WHEN a edição altera `scheduled_at` ou `duration_minutes` e o novo intervalo conflita
     com outra consulta (excluindo a própria consulta editada)
THEN o sistema exibe "Horário conflita com a consulta de [nome do paciente] às [hora]"
     e não salva a edição.

### Cancelamento de consulta

**AC-24**
WHEN o psicólogo confirma o cancelamento de uma consulta e informa o motivo
THEN o sistema atualiza `status = cancelled`, preenche `cancellation_reason` com o
     motivo informado e exibe toast "Consulta cancelada".

**AC-25**
WHEN o psicólogo confirma o cancelamento sem informar motivo
THEN o sistema cancela a consulta sem `cancellation_reason` (motivo é opcional).

**AC-26**
WHEN o psicólogo tenta cancelar uma consulta já com status `completed`, `cancelled`
     ou `no_show`
THEN o sistema não exibe a opção de cancelamento para esses status.

### Mudança de status

**AC-27**
WHEN o psicólogo marca uma consulta como "realizada"
THEN o sistema atualiza `status = completed` e exibe toast "Consulta marcada como realizada".

**AC-28**
WHEN o psicólogo marca uma consulta como "no-show"
THEN o sistema atualiza `status = no_show` e exibe toast "Falta registrada".

**AC-29**
WHEN uma consulta tem `status = completed`
THEN o sistema exibe link "Registrar prontuário" que navega para a feature de prontuário
     (mesmo que o prontuário ainda não exista para essa consulta).

**AC-30**
WHEN o psicólogo tenta marcar como "realizada" ou "no-show" uma consulta com
     status `cancelled`
THEN o sistema não exibe essas opções de transição para consultas canceladas.

### Filtro por paciente

**AC-31**
WHEN o psicólogo acessa `/appointments?patient=[id]`
THEN o sistema exibe todas as consultas daquele paciente (não canceladas por padrão)
     em ordem cronológica decrescente, independente de visualização semanal ou diária.

**AC-32**
WHEN o psicólogo aplica o filtro por paciente na visualização semanal
THEN o sistema exibe apenas as consultas daquele paciente na semana visualizada.

### Autorização e isolamento

**AC-33**
WHEN o psicólogo autenticado acessa qualquer rota de `/appointments`
THEN o sistema retorna apenas registros onde `appointments.userId = id do psicólogo autenticado`.

**AC-34**
WHEN um usuário não autenticado tenta acessar qualquer rota de `/appointments`
THEN o sistema redireciona para `/login`.

**AC-35**
WHEN o psicólogo tenta acessar, editar ou cancelar uma consulta cujo `userId`
     não corresponde ao seu `id`
THEN o sistema retorna erro 404 (não expõe que a consulta existe e pertence a outro psicólogo).

---

## Wireframe Textual

### Tela 1 — Visualização Semanal (`/appointments`)

```
+------------------------------------------------------------------+
| PsiAgenda                                        [Avatar] [Menu] |
+------------------------------------------------------------------+
| Agenda                                    [+ Nova Consulta]      |
+------------------------------------------------------------------+
| [< Semana anterior]  21–27 abr 2026  [Próxima semana >]  [Hoje] |
+------------------------------------------------------------------+
|  SEG 21  |  TER 22  |  QUA 23  |  QUI 24  |  SEX 25  | SAB | DOM|
|----------|----------|----------|----------|----------|-----|-----|
|          | 09:00    |          | 09:00    |          |     |     |
|          | Ana B.   |          | Bruno M. |          |     |     |
|          |[agendada]|          |[confirm.]|          |     |     |
|          |          |          |          |          |     |     |
|          | 10:00    |          |          | 10:00    |     |     |
|          | Carlos D.|          |          | Carla F. |     |     |
|          |[realizada|          |          |[agendada]|     |     |
|          |          |          |          |          |     |     |
+------------------------------------------------------------------+
```

**Elementos:**
- Header com nome do app, avatar e menu de navegação
- Título "Agenda" com botão "Nova Consulta" fixo no canto superior direito
- Barra de navegação temporal: botões de semana anterior e próxima semana,
  intervalo de datas da semana atual e botão "Hoje" para retornar ao presente
- Grade semanal com 7 colunas (segunda a domingo), sem horários fixos na lateral
- Cada consulta exibe: horário de início, nome abreviado do paciente e badge de status
- Dia atual destacado visualmente (fundo diferenciado na coluna)
- Toque em qualquer dia da grade navega para a visualização diária daquele dia
- Toque em uma consulta abre o painel de detalhes

**Badge de status — cores:**
- `scheduled` → cinza (neutro)
- `confirmed` → azul
- `completed` → verde
- `cancelled` → vermelho com texto riscado
- `no_show` → laranja

**Estado vazio (semana sem consultas):**
```
+------------------------------------------------------------------+
|  SEG 21  |  TER 22  |  QUA 23  |  QUI 24  |  SEX 25  | SAB | DOM|
|----------------------------------------------------------------------------|
|                                                                  |
|             Nenhuma consulta nesta semana.                       |
|             [Agendar consulta]                                   |
|                                                                  |
+------------------------------------------------------------------+
```

---

### Tela 2 — Visualização Diária (`/appointments/day/[data]`)

```
+------------------------------------------------------------------+
| [< Dia anterior]  Quinta-feira, 24 abr 2026  [Próximo dia >]    |
+------------------------------------------------------------------+
| 09:00–09:50  Bruno Martins                                       |
|              Presencial · Rua das Flores, 100 — sala 3           |
|              [confirmada]                          [Ver detalhes]|
|------------------------------------------------------------------|
| 10:00–10:50  Débora Lima                                         |
|              Online · meet.google.com/abc-xyz                    |
|              [agendada]                            [Ver detalhes]|
|------------------------------------------------------------------|
| 14:00–14:50  Fernanda Costa                                      |
|              Presencial                                          |
|              [realizada]                           [Ver detalhes]|
+------------------------------------------------------------------+
| [+ Agendar neste dia]                                            |
+------------------------------------------------------------------+
```

**Elementos:**
- Header com navegação de dia (anterior / próximo), data por extenso
- Lista de consultas em ordem cronológica de horário de início
- Cada item exibe: horário de início e término, nome completo do paciente,
  modalidade, local/link (se preenchido) e badge de status
- Botão "Ver detalhes" em cada item abre o painel lateral de detalhes
- Botão "Agendar neste dia" no rodapé pré-preenche a data no formulário de criação

**Estado vazio:**
```
+------------------------------------------------------------------+
|                                                                  |
|             Nenhuma consulta nesta data.                         |
|             [Agendar consulta para este dia]                     |
|                                                                  |
+------------------------------------------------------------------+
```

---

### Tela 3 — Painel de Detalhes da Consulta

```
+------------------------------------------+
| Consulta                           [x]   |
|------------------------------------------|
| Bruno Martins                            |
| Qui, 24 abr 2026 · 09:00–09:50           |
| Presencial · Rua das Flores, 100         |
|                                          |
| Status: [confirmada]                     |
|                                          |
| ----------------------------------------|
| Ações:                                   |
| [Marcar como realizada]                  |
| [Marcar como no-show]                    |
| [Editar consulta]                        |
| [Cancelar consulta]                      |
+------------------------------------------+
```

**Elementos:**
- Nome do paciente em destaque (link para o perfil do paciente)
- Data, horário de início e término, modalidade e local/link
- Badge de status atual
- Seção de ações disponíveis de acordo com o status atual (ver regras de transição)
- Consultas com `status = completed` exibem link "Ver prontuário" ou "Registrar prontuário"
- Botão fechar (x) retorna à visualização anterior

---

### Tela 4 — Formulário de Criação / Edição

```
+--------------------------------------------------+
| [< Voltar]  Nova Consulta                        |
+--------------------------------------------------+
|                                                  |
| Paciente *                                       |
| [Selecione ou busque um paciente...    v]        |
|                                                  |
| Data *                                           |
| [  DD/MM/AAAA                          ]         |
|                                                  |
| Horário *                                        |
| [  HH:MM                               ]         |
|                                                  |
| Duração                                          |
| [50] minutos                                     |
|                                                  |
| Modalidade *                                     |
| ( ) Presencial   ( ) Online                      |
|                                                  |
| Local / Link de videochamada                     |
| [                                        ]       |
| Endereço (presencial) ou link de reunião (online)|
|                                                  |
|             [Cancelar]   [Salvar consulta]       |
+--------------------------------------------------+
```

**Elementos:**
- Dropdown de seleção de paciente com busca por nome
- Apenas pacientes com `is_active = true` e `deleted_at IS NULL` aparecem na lista
- Campo de data com máscara DD/MM/AAAA
- Campo de horário com máscara HH:MM (formato 24h)
- Campo de duração numérico com valor padrão 50 minutos
- Seleção de modalidade com dois radio buttons: "Presencial" e "Online"
- Campo de local/link (opcional, mesmo hint para ambas as modalidades)
- Botão Cancelar retorna sem salvar; Salvar faz o submit
- Em edição: título muda para "Editar Consulta" e formulário vem pré-preenchido
- Campos desabilitados para consultas em status `completed`, `cancelled`, `no_show`

**Banner de conflito de horário:**
```
+--------------------------------------------------+
| [!] Horário conflita com a consulta de           |
|     Ana Beatriz às 09:00 (50 min).               |
+--------------------------------------------------+
```

---

### Tela 5 — Dialog de Cancelamento

```
+------------------------------------------+
| Cancelar consulta?                       |
|                                          |
| Bruno Martins                            |
| Qui, 24 abr 2026 · 09:00                 |
|                                          |
| Motivo (opcional)                        |
| [                                        |
|                                  ]       |
|                                          |
| [Voltar]        [Confirmar cancelamento] |
+------------------------------------------+
```

**Elementos:**
- Nome do paciente e data/hora da consulta para contexto
- Campo de texto livre para o motivo (opcional)
- Botão "Voltar" fecha o dialog sem alterar a consulta
- Botão "Confirmar cancelamento" executa a ação
- Dialog exibido sobre a tela atual (modal)

---

## Regras de Negócio

**RN-01 — Duração padrão**
O campo `duration_minutes` tem valor padrão de 50 minutos. O psicólogo pode
alterar para qualquer valor inteiro maior que zero. Não há duração máxima definida.

**RN-02 — Detecção de conflito de horário**
Ao criar ou editar uma consulta, o sistema verifica se o intervalo
`[scheduled_at, scheduled_at + duration_minutes]` se sobrepõe a qualquer outra
consulta do mesmo psicólogo cujo status não seja `cancelled`.
Sobreposição ocorre quando: `novo_inicio < existente_fim AND novo_fim > existente_inicio`.
A verificação é feita na Server Action, não apenas no cliente.

**RN-03 — Transições de status válidas**

| Status atual | Pode ir para | Quem executa |
|---|---|---|
| `scheduled` | `confirmed`, `completed`, `no_show`, `cancelled` | psicólogo (completed, no_show, cancelled); sistema/paciente (confirmed) |
| `confirmed` | `completed`, `no_show`, `cancelled` | psicólogo (completed, no_show, cancelled) |
| `completed` | — (terminal) | nenhum |
| `cancelled` | — (terminal) | nenhum |
| `no_show` | — (terminal) | nenhum |

Transições não listadas são bloqueadas na Server Action.

**RN-04 — Status terminal**
Consultas com status `completed`, `cancelled` ou `no_show` não podem ser editadas
nem ter o status alterado. São registros permanentes do histórico clínico.

**RN-05 — Motivo de cancelamento**
O campo `cancellation_reason` é opcional. Quando não informado, é armazenado
como `null`. O campo só é gravado quando o status transiciona para `cancelled`.

**RN-06 — Isolamento por psicólogo**
Todo acesso à tabela `appointments` inclui obrigatoriamente `where: { userId: session.user.id }`.
Um psicólogo nunca enxerga consultas de outro psicólogo.

**RN-07 — Vínculo obrigatório com paciente**
Toda consulta deve estar vinculada a um `patient_id` existente, ativo
(`is_active = true`, `deleted_at IS NULL`) e pertencente ao mesmo psicólogo.
A seleção de paciente no formulário lista apenas pacientes que satisfazem essa condição.

**RN-08 — Soft delete de consultas canceladas**
Consultas canceladas não são excluídas do banco — o campo `deleted_at` não é
preenchido pelo cancelamento. O `deleted_at` é reservado para remoção administrativa.
Consultas canceladas aparecem na agenda com badge "cancelada" e permanecem no histórico.

**RN-09 — Modalidades disponíveis**
Os valores válidos para `modality` são `in_person` (presencial) e `online`.
Não há validação condicional de `location` com base na modalidade — o campo é
livre e opcional em ambos os casos.

**RN-10 — Exibição de horário de término**
O horário de término não é armazenado no banco. É calculado dinamicamente como
`scheduled_at + duration_minutes` no momento da renderização.

**RN-11 — Sem limite de consultas por plano**
No MVP, não há limite de número de consultas para planos free ou pro. O limite
do plano free afeta apenas a quantidade de pacientes ativos (ver `cadastro-pacientes`).

---

## Dados e API

### Entidades utilizadas

- `appointments` — criação, leitura, atualização de status e dados
- `patients` — leitura para popular o seletor de paciente e exibir nome nas visualizações
- `session_notes` — leitura para verificar se a consulta já possui prontuário (exibe link correto)

### Server Actions

| Ação | Arquivo sugerido | Descrição |
|---|---|---|
| `createAppointment` | `features/appointments/actions/createAppointment.ts` | Cria consulta. Valida conflito de horário antes de inserir. |
| `updateAppointment` | `features/appointments/actions/updateAppointment.ts` | Edita dados de consulta em status não-terminal. Valida conflito. |
| `cancelAppointment` | `features/appointments/actions/cancelAppointment.ts` | Transiciona para `cancelled`, salva `cancellation_reason`. |
| `completeAppointment` | `features/appointments/actions/completeAppointment.ts` | Transiciona para `completed`. Valida transição válida. |
| `markNoShow` | `features/appointments/actions/markNoShow.ts` | Transiciona para `no_show`. Valida transição válida. |

### Queries (Server Components)

| Query | Descrição |
|---|---|
| `getWeekAppointments(userId, weekStart)` | Consultas da semana `[weekStart, weekStart + 7 dias)`, `deleted_at IS NULL`, order by `scheduled_at ASC` |
| `getDayAppointments(userId, date)` | Consultas de um dia específico, `deleted_at IS NULL`, order by `scheduled_at ASC` |
| `getAppointmentById(userId, appointmentId)` | Busca por id com validação de `userId` |
| `getPatientAppointments(userId, patientId)` | Todas as consultas de um paciente, `deleted_at IS NULL`, order by `scheduled_at DESC` |
| `getConflictingAppointments(userId, scheduledAt, durationMinutes, excludeId?)` | Verifica conflitos de horário. `excludeId` exclui a própria consulta ao editar. |

### Schemas Zod

```typescript
// features/appointments/schema.ts

import { z } from "zod"

export const AppointmentFormSchema = z.object({
  patientId: z.string().uuid("Selecione um paciente"),
  scheduledAt: z.coerce.date({
    required_error: "Data e horário são obrigatórios",
  }),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duração deve ser de pelo menos 1 minuto")
    .default(50),
  modality: z.enum(["in_person", "online"], {
    required_error: "Selecione a modalidade",
  }),
  location: z.string().max(500).optional().nullable(),
})

export const CancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  cancellationReason: z.string().max(1000).optional().nullable(),
})

export const UpdateStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["completed", "no_show", "cancelled"]),
})
```

### Rotas Next.js (App Router)

| Rota | Tipo | Descrição |
|---|---|---|
| `/appointments` | Page (Server Component) | Visualização semanal da semana atual |
| `/appointments?week=[YYYY-MM-DD]` | Page (Server Component) | Visualização semanal de semana específica (início da semana) |
| `/appointments?patient=[id]` | Page (Server Component) | Todas as consultas de um paciente |
| `/appointments/day/[date]` | Page (Server Component) | Visualização diária de uma data (`YYYY-MM-DD`) |
| `/appointments/new` | Page (Server Component) | Formulário de criação |
| `/appointments/new?date=[YYYY-MM-DD]` | Page (Server Component) | Formulário pré-preenchido com data |
| `/appointments/[id]` | Page (Server Component) | Detalhes da consulta |
| `/appointments/[id]/edit` | Page (Server Component) | Formulário de edição pré-preenchido |

Todas as rotas ficam dentro do grupo `(auth)` protegido pelo middleware do NextAuth.

### Eventos disparados

Nenhum evento externo (webhook, e-mail, job) é disparado diretamente por esta feature.
A geração de token de lembrete é responsabilidade da feature `lembretes-consulta`,
que consome o `appointment_id` criado por esta feature.

---

## Fora do Escopo desta Feature

1. **Agenda recorrente** — criação automática de consultas semanais ou mensais
   para o mesmo paciente não está inclusa nesta feature. Cada consulta é criada
   individualmente. Ver backlog em `mvp-scope.md`.

2. **Integração com calendários externos** — sincronização com Google Calendar,
   Apple Calendar ou Outlook não está prevista nesta feature. Ver backlog em
   `mvp-scope.md`.

3. **Notificação em tempo real** — o status da consulta atualizado pelo paciente
   (via link de confirmação) não aciona push notification ou websocket ao psicólogo.
   O psicólogo vê o status atualizado ao recarregar a agenda.

4. **Envio de lembrete ao paciente** — o botão "Copiar link de lembrete" e a geração
   do token de confirmação são responsabilidade da feature `lembretes-consulta`,
   não desta feature.

5. **Prontuário de sessão** — o campo de notas clínicas de cada consulta é
   responsabilidade da feature `prontuario-sessao`. Esta feature apenas exibe o
   link de acesso ao prontuário em consultas com `status = completed`.

6. **Marcação de pagamento** — definir se a sessão foi paga ou pendente é
   responsabilidade da feature `controle-financeiro`, não desta feature.

---

## Dependências

**Pré-requisito obrigatório:**
- `cadastro-pacientes` — deve estar implementada. O formulário de criação de consulta
  requer ao menos um paciente ativo cadastrado pelo psicólogo.

**Features que dependem desta:**
- `lembretes-consulta` — consome `appointment.id` para gerar o token de lembrete
- `confirmacao-paciente` — atualiza `appointment.status` via token público
- `prontuario-sessao` — vincula `session_notes` a `appointment.id` com `status = completed`
- `controle-financeiro` — vincula `session_payments` a `appointment.id`
