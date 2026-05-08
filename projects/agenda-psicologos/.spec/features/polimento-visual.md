# Feature: Polimento Visual

**Slug:** `polimento-visual`
**Prioridade:** should-have
**Fase:** 2 — Specs (pós-MVP)
**Criada em:** 2026-05-07
**Status:** aguardando aprovação

---

## Contexto

O MVP do PsiAgenda está funcional e com todas as features entregues. A interface,
no entanto, usa a paleta padrão do shadcn/ui (azul-teal genérico) e não tem
feedback visual consistente nas ações críticas. Para um psicólogo solo que mostra
o sistema a pacientes e colegas, a aparência profissional e acolhedora é parte da
proposta de valor — impacta percepção de qualidade e conversão freemium.

Esta feature não altera o data model nem adiciona novas entidades ou endpoints.
É integralmente front-end: paleta, composição de dashboard, estados de loading e
feedback de ações.

**Referências visuais:** Headspace, Calm, Cerebral — verde-sálvia/índigo suave
que transmitem calma, cuidado e segurança.

**Dependências desta feature:**
- Todas as 7 features do MVP devem estar implementadas — esta feature sobrescreve
  estilos e componentes existentes.

**Features afetadas por esta:**
- `autenticacao` — páginas de login, registro e reset de senha recebem nova paleta
- `cadastro-pacientes` — lista de pacientes recebe skeleton loader e toast de ações
- `agenda-consultas` — agenda semanal, diária e detalhe recebem skeleton e toasts
- `prontuario-sessao` — lista de prontuários e formulário recebem skeleton e toast
- `controle-financeiro` — dashboard financeiro recebe skeleton e toast
- `lembretes-consulta` — ação de envio de lembrete recebe toast
- `confirmacao-paciente` — cancelamento recebe toast; dashboard mostra pendentes

---

## User Stories

### Paleta de cores

**US-01**
Como psicólogo autenticado,
quero ver uma interface com cores verdes-sálvia e índigo suaves em vez de azul-teal,
para que o sistema transmita calma e cuidado — valores alinhados com minha prática clínica.

### Dashboard redesenhado

**US-02**
Como psicólogo autenticado,
quero ver na tela inicial minha agenda do dia, consultas pendentes de confirmação e
resumo semanal de atendimentos,
para ter uma visão operacional completa ao abrir o sistema pela manhã.

**US-03**
Como psicólogo autenticado com agenda vazia no dia atual,
quero ver um estado vazio informativo na seção de agenda do dia,
para entender que não há consultas hoje sem confundir com erro de carregamento.

### Skeleton loaders

**US-04**
Como psicólogo autenticado,
quero ver skeleton loaders animados enquanto listas e dados carregam,
para ter feedback visual imediato de que o sistema está funcionando — sem tela
em branco ou spinner genérico.

### Micro-interações e toasts

**US-05**
Como psicólogo autenticado,
quero receber confirmação visual imediata após agendar, cancelar, confirmar,
salvar prontuário ou registrar pagamento,
para saber que minha ação foi executada sem precisar verificar manualmente.

**US-06**
Como psicólogo autenticado,
quero ver uma mensagem de erro clara via toast quando uma ação crítica falha,
para entender o que aconteceu e saber se preciso tentar novamente.

---

## Critérios de Aceite

### Paleta warm-sage

**AC-01:** THE SYSTEM SHALL definir as seguintes CSS variables em `src/app/globals.css`
para o modo claro:
```
--primary: 152 38% 35%
--primary-foreground: 0 0% 98%
--accent: 240 20% 60%
--accent-foreground: 0 0% 98%
```
Resultado: botões de ação principal e links ativos exibem verde-sálvia
(hsl(152, 38%, 35%)) em vez do azul-teal anterior.

**AC-02:** THE SYSTEM SHALL manter o token `--destructive: 0 72% 51%` inalterado
para preservar o vermelho suave já definido no design-tokens.md.

**AC-03:** WHEN qualquer página do sistema é renderizada
THEN links de navegação ativos no sidebar/header exibem
`bg-primary/10 text-primary font-medium` com a nova cor primary.

**AC-04:** WHEN o usuário acessa as páginas de autenticação (/login, /register,
/forgot-password, /reset-password)
THEN o botão de submit principal exibe a nova cor primary (verde-sálvia).

**AC-05:** THE SYSTEM SHALL atualizar o arquivo `projects/agenda-psicologos/.spec/design-tokens.md`
substituindo o bloco de CSS variables da paleta pelo novo valor warm-sage documentado em AC-01.

### Dashboard redesenhado

**AC-06:** WHEN o psicólogo autenticado acessa `/dashboard`
THEN a página exibe três seções distintas:
1. "Agenda de hoje" — lista das consultas do dia atual com horário, nome do
   paciente e AppointmentStatusBadge
2. "Aguardando confirmação" — badge numérico com a contagem de consultas com
   status `scheduled` nos próximos 7 dias sem confirmação do paciente
3. "Resumo da semana" — três métricas: total de consultas na semana corrente,
   confirmadas e canceladas

**AC-07:** WHEN há consultas agendadas para o dia atual
THEN cada item da seção "Agenda de hoje" exibe horário de início, nome do paciente
e AppointmentStatusBadge, e o item inteiro é clicável navegando para `/appointments/[id]`.

**AC-08:** WHEN não há consultas agendadas para o dia atual
THEN a seção "Agenda de hoje" exibe o estado vazio com o texto:
"Sem consultas hoje" e link "Ver agenda da semana" apontando para `/appointments`.

**AC-09:** WHEN a seção "Aguardando confirmação" tem contagem maior que zero
THEN o badge exibe o número em destaque com a cor `bg-amber-100 text-amber-800`,
e o badge inteiro é clicável navegando para `/appointments`.

**AC-10:** WHEN a seção "Aguardando confirmação" tem contagem igual a zero
THEN o badge exibe "0" com cor neutra (`bg-gray-100 text-gray-600`) sem destaque.

**AC-11:** WHEN o psicólogo acessa o dashboard e ainda não tem nenhuma consulta
cadastrada na semana
THEN as métricas do "Resumo da semana" exibem "0" para total, confirmadas e
canceladas — sem ocultar a seção.

### Skeleton loaders

**AC-12:** WHEN a seção "Agenda de hoje" do dashboard está carregando
THEN exibe 3 linhas de skeleton (`<Skeleton>` do shadcn/ui) com altura `h-12`
e largura total, animadas com `animate-pulse`.

**AC-13:** WHEN a seção "Resumo da semana" do dashboard está carregando
THEN exibe 3 cards de skeleton com altura `h-24` e largura proporcional ao grid.

**AC-14:** WHEN a página `/patients` está carregando a lista de pacientes
THEN exibe 5 linhas de skeleton com altura `h-14` separadas por `divide-y`.

**AC-15:** WHEN a página `/appointments` (agenda semanal) está carregando
THEN exibe skeleton na área do calendário semanal com altura `h-48` e largura total.

**AC-16:** WHEN a visualização diária `/appointments/day/[date]` está carregando
THEN exibe 3 linhas de skeleton com altura `h-16` representando blocos de consulta.

**AC-17:** WHEN a página `/patients/[id]/notes` está carregando a lista de prontuários
THEN exibe 3 blocos de skeleton com altura `h-20` e largura total.

**AC-18:** WHEN a página `/financeiro` está carregando o FinancialDashboard
THEN exibe 3 cards de skeleton com altura `h-24` seguidos de 5 linhas de skeleton
`h-12` representando a listagem de pagamentos.

**AC-19:** WHILE qualquer skeleton loader está visível
WHEN os dados terminam de carregar
THEN o skeleton desaparece e o conteúdo real é exibido sem flash de layout
(sem mudança abrupta de altura).

### Micro-interações e toasts

**AC-20:** WHEN o psicólogo agenda uma consulta com sucesso via `/appointments/new`
THEN um toast de sucesso é exibido via `sonner` com a mensagem:
"Consulta agendada com sucesso" e o sistema redireciona para `/appointments`.

**AC-21:** WHEN o psicólogo cancela uma consulta com sucesso
THEN um toast de sucesso é exibido via `sonner` com a mensagem:
"Consulta cancelada".

**AC-22:** WHEN o psicólogo confirma manualmente uma consulta (muda status para `confirmed`)
THEN um toast de sucesso é exibido via `sonner` com a mensagem:
"Consulta confirmada".

**AC-23:** WHEN o psicólogo salva um prontuário (cria ou atualiza) com sucesso
THEN um toast de sucesso é exibido via `sonner` com a mensagem:
"Prontuário salvo".

**AC-24:** WHEN o psicólogo registra ou atualiza um pagamento com sucesso
THEN um toast de sucesso é exibido via `sonner` com a mensagem:
"Pagamento registrado".

**AC-25:** WHEN o psicólogo envia o link de lembrete via WhatsApp
THEN um toast de sucesso é exibido via `sonner` com a mensagem:
"Link de lembrete copiado" (se a ação for copiar link) ou
"Link de lembrete aberto no WhatsApp" (se a ação abrir o WhatsApp).

**AC-26:** WHEN qualquer ação crítica falha por erro de servidor ou de rede
THEN um toast de erro é exibido via `sonner` com variante `error` e a mensagem
genérica: "Algo deu errado. Tente novamente." sem expor detalhes técnicos.

**AC-27:** THE SYSTEM SHALL configurar o `<Toaster>` do sonner no layout raiz
(`src/app/(auth)/layout.tsx`) com `position="bottom-right"` e `richColors={true}`.

**AC-28:** WHEN o usuário navega entre páginas do sistema
THEN as transições de rota aplicam `transition-all duration-200` via classe Tailwind
no container principal da página, evitando cortes abruptos.

---

## Wireframe Textual

### Dashboard (tela inicial — `/dashboard`)

```
[ Header / Sidebar — inalterado ]

Página: Dashboard

Boa tarde, [Nome do psicólogo]        ← saudação dinâmica por horário

┌─────────────────────────────────────────────────────────┐
│ Agenda de hoje — [dia da semana], [data por extenso]    │
│─────────────────────────────────────────────────────────│
│  09:00  João Silva              [agendada]               │
│  10:30  Maria Oliveira          [confirmada]             │
│  14:00  Pedro Costa             [agendada]               │
│─────────────────────────────────────────────────────────│
│ [Estado vazio: "Sem consultas hoje — Ver agenda"]        │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│ Aguardando confirmação       │
│  ╔═══╗                       │
│  ║ 3 ║  consultas sem        │
│  ╚═══╝  confirmação         │
│  nos próximos 7 dias         │
│  [Ver agenda →]              │
└──────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Esta semana  │ │ Confirmadas  │ │ Canceladas   │
│    12        │ │     8        │ │     1        │
│  consultas   │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Estado de loading do dashboard:**
- "Agenda de hoje": 3 linhas skeleton `h-12 w-full animate-pulse rounded-md`
- Cards de resumo: 3 cards skeleton `h-24 animate-pulse rounded-md`
- Badge de confirmação: skeleton `h-16 w-48 animate-pulse rounded-md`

**Estado vazio de "Agenda de hoje":**
```
[ Ícone de calendário — muted ]
Sem consultas hoje
Ver agenda da semana  →
```

### Lista de pacientes (`/patients`) — estado de loading

```
[ Skeleton linha 1 — h-14, w-full ]
[ Skeleton linha 2 — h-14, w-full ]
[ Skeleton linha 3 — h-14, w-full ]
[ Skeleton linha 4 — h-14, w-full ]
[ Skeleton linha 5 — h-14, w-full ]
```
Cada linha imita o layout real: bloco de nome `w-48` + bloco de telefone `w-32`
alinhados à esquerda, bloco de ação `w-8` à direita.

### Agenda semanal (`/appointments`) — estado de loading

```
[ Skeleton cabeçalho de semana — h-10, w-full ]
[ Skeleton grid semanal — h-48, w-full ]
```

### Agenda diária (`/appointments/day/[date]`) — estado de loading

```
[ Skeleton bloco consulta 1 — h-16, w-full ]
[ Skeleton bloco consulta 2 — h-16, w-full ]
[ Skeleton bloco consulta 3 — h-16, w-full ]
```

### Lista de prontuários (`/patients/[id]/notes`) — estado de loading

```
[ Skeleton bloco nota 1 — h-20, w-full ]
[ Skeleton bloco nota 2 — h-20, w-full ]
[ Skeleton bloco nota 3 — h-20, w-full ]
```

### Dashboard financeiro (`/financeiro`) — estado de loading

```
[ Skeleton card 1 — h-24 ]  [ Skeleton card 2 — h-24 ]  [ Skeleton card 3 — h-24 ]

[ Skeleton linha pagamento 1 — h-12, w-full ]
[ Skeleton linha pagamento 2 — h-12, w-full ]
[ Skeleton linha pagamento 3 — h-12, w-full ]
[ Skeleton linha pagamento 4 — h-12, w-full ]
[ Skeleton linha pagamento 5 — h-12, w-full ]
```

### Toast de sucesso (exemplo — agendar consulta)

```
╔══════════════════════════════════════╗
║ ✓  Consulta agendada com sucesso     ║
╚══════════════════════════════════════╝
        (canto inferior direito, desaparece em 4s)
```

### Toast de erro

```
╔══════════════════════════════════════╗
║ ✕  Algo deu errado. Tente novamente. ║
╚══════════════════════════════════════╝
        (canto inferior direito, persiste até fechar)
```

---

## Regras de Negócio

### Tokens de cor (warm-sage)

Os valores abaixo substituem integralmente o bloco `--primary` e `--accent` do
arquivo `src/app/globals.css` e devem ser espelhados no `design-tokens.md`:

| Token CSS | Valor HSL | Uso |
|---|---|---|
| `--primary` | `152 38% 35%` | Botões principais, links ativos, foco |
| `--primary-foreground` | `0 0% 98%` | Texto sobre primary |
| `--accent` | `240 20% 60%` | Elementos secundários, hover states |
| `--accent-foreground` | `0 0% 98%` | Texto sobre accent |
| `--destructive` | `0 72% 51%` | Inalterado |
| `--destructive-foreground` | `0 0% 98%` | Inalterado |

Todos os demais tokens do shadcn/ui (`--background`, `--foreground`, `--muted`,
`--border`, `--ring`, etc.) permanecem com os valores padrão gerados na instalação.

### Componentes que recebem skeleton loader

| Componente / página | Componente de loading |
|---|---|
| `/dashboard` — seção "Agenda de hoje" | `DashboardTodaySkeleton` |
| `/dashboard` — cards de resumo semanal | `DashboardSummarySkeleton` |
| `/dashboard` — badge de pendentes | `DashboardPendingSkeleton` |
| `/patients` — lista de pacientes | `PatientListSkeleton` |
| `/appointments` — grade semanal | `WeeklyCalendarSkeleton` |
| `/appointments/day/[date]` — lista diária | `DayViewSkeleton` |
| `/patients/[id]/notes` — lista de prontuários | `NoteListSkeleton` |
| `/financeiro` — dashboard financeiro | `FinancialDashboardSkeleton` |

Cada componente de skeleton deve ser um componente React isolado em
`src/features/[feature]/components/[NomeSkeleton].tsx` e usar
`<Skeleton>` do shadcn/ui (`@/components/ui/skeleton`).

### Ações que recebem toast via sonner

| Ação | Mensagem de sucesso | Variante |
|---|---|---|
| Agendar consulta | "Consulta agendada com sucesso" | `success` |
| Editar consulta | "Consulta atualizada" | `success` |
| Cancelar consulta | "Consulta cancelada" | `success` |
| Confirmar consulta (manual) | "Consulta confirmada" | `success` |
| Marcar como realizada | "Consulta marcada como realizada" | `success` |
| Marcar como no-show | "Marcado como não compareceu" | `success` |
| Salvar prontuário (criar) | "Prontuário salvo" | `success` |
| Salvar prontuário (editar) | "Prontuário atualizado" | `success` |
| Registrar pagamento | "Pagamento registrado" | `success` |
| Atualizar pagamento | "Pagamento atualizado" | `success` |
| Copiar link de lembrete | "Link de lembrete copiado" | `success` |
| Abrir lembrete no WhatsApp | "Link de lembrete aberto no WhatsApp" | `success` |
| Qualquer ação — erro | "Algo deu errado. Tente novamente." | `error` |

**Duração dos toasts:**
- Sucesso: 4 segundos (auto-dismiss)
- Erro: permanece até o usuário fechar (sem auto-dismiss)

### Dashboard — lógica de dados

- "Agenda de hoje": query `getDayAppointments(today, userId)` já existente —
  reutilizar sem nova query.
- "Aguardando confirmação": query nova `getPendingConfirmationCount(userId)` —
  retorna `count` de appointments com `status = 'scheduled'` nos próximos 7 dias
  onde não existe `appointment_token` com `confirmed_at` preenchido.
- "Resumo da semana": query nova `getWeeklySummary(userId)` — retorna `{ total, confirmed, cancelled }`
  para a semana corrente (segunda a domingo).

### Saudação dinâmica no dashboard

| Horário | Saudação |
|---|---|
| 05:00 – 11:59 | "Bom dia" |
| 12:00 – 17:59 | "Boa tarde" |
| 18:00 – 04:59 | "Boa noite" |

O nome exibido é o `name` do usuário autenticado (NextAuth session).

### Transições de página

Aplicar `transition-all duration-200 ease-in-out` no container principal
(`<main>`) do layout autenticado. Não utilizar bibliotecas de animação externas —
apenas classes Tailwind nativas.

---

## Dados e API

### Entidades utilizadas (sem alterações de schema)

- `Appointment` — lida somente para dashboard e lista de pendentes
- `Patient` — lida somente para nomes na agenda do dia
- `AppointmentToken` — lida para verificar `confirmed_at` na contagem de pendentes
- `SessionNote` — lida somente para lista de prontuários (skeleton)
- `SessionPayment` — lida somente para dashboard financeiro (skeleton)

### Queries novas necessárias

```typescript
// src/features/dashboard/queries/getDashboardData.ts

// Consultas do dia atual
getDayAppointmentsForDashboard(userId: string, date: Date): Promise<AppointmentSummary[]>
// Reutiliza lógica de getDayAppointments — pode ser um alias ou wrapper

// Contagem de consultas aguardando confirmação
getPendingConfirmationCount(userId: string): Promise<number>
// WHERE status = 'scheduled'
//   AND start_time BETWEEN now() AND now() + 7 days
//   AND NOT EXISTS (SELECT 1 FROM appointment_tokens WHERE appointment_id = a.id AND confirmed_at IS NOT NULL)

// Resumo semanal
getWeeklySummary(userId: string, weekStart: Date): Promise<{ total: number; confirmed: number; cancelled: number }>
```

### Endpoints / Server Actions novas

Nenhuma Server Action nova — o dashboard é uma página Server Component que
compõe as queries diretamente. Não há mutações nesta feature.

### Configuração do Toaster

```typescript
// src/app/(auth)/layout.tsx
import { Toaster } from "sonner"

// Adicionar dentro do <body>:
<Toaster position="bottom-right" richColors />
```

Os toasts são disparados nos componentes Client existentes (formulários e
dialogs) via `import { toast } from "sonner"` — sem nova abstração.

---

## Fora do Escopo desta Feature

1. **Dark mode** — não faz parte desta feature. O design-tokens.md menciona dark
   mode como pós-MVP. Nenhuma CSS variable para `.dark` deve ser adicionada.

2. **Redesign de ícones ou tipografia** — a fonte Inter e os ícones Lucide React
   já em uso não serão substituídos. Nenhuma nova biblioteca de ícones.

3. **Animações de entrada de elementos (fade-in por elemento)** — apenas
   `transition-all` no container de página. Sem bibliotecas como Framer Motion,
   auto-animate ou CSS keyframes customizados.

4. **Testes unitários para componentes de skeleton** — skeletons são componentes
   puramente visuais sem lógica. Não requerem testes unitários no DoD desta feature.

5. **Mudanças no schema Prisma ou migrations** — esta feature não adiciona,
   altera ou remove nenhuma coluna ou tabela.

6. **Página de onboarding ou tour guiado** — o dashboard redesenhado não inclui
   tooltips de boas-vindas, tour ou overlay de ajuda para novos usuários.

7. **Personalização de tema pelo usuário** — a paleta warm-sage é aplicada
   globalmente para todos os usuários. Não há opção de escolha de tema por conta.

---

## Impacto em Features Existentes

### Arquivos que precisam ser atualizados

| Arquivo | Mudança necessária |
|---|---|
| `src/app/globals.css` | Substituir `--primary` e adicionar `--accent` com valores warm-sage |
| `src/app/(auth)/layout.tsx` | Adicionar `<Toaster position="bottom-right" richColors />` |
| `src/app/(auth)/dashboard/page.tsx` | Redesenhar layout com três seções + skeletons |
| `src/features/appointments/components/WeeklyCalendar.tsx` | Adicionar `WeeklyCalendarSkeleton` como loading state |
| `src/features/appointments/components/DayView.tsx` (ou equivalente) | Adicionar `DayViewSkeleton` como loading state |
| `src/features/appointments/actions/createAppointment.ts` | Adicionar `toast.success(...)` no retorno de sucesso |
| `src/features/appointments/actions/cancelAppointment.ts` | Adicionar `toast.success(...)` no retorno de sucesso |
| `src/features/appointments/actions/updateAppointment.ts` | Adicionar `toast.success(...)` no retorno de sucesso |
| `src/features/patients/components/PatientList.tsx` (ou equivalente) | Adicionar `PatientListSkeleton` como loading state |
| `src/features/notes/actions/createSessionNote.ts` | Adicionar `toast.success(...)` no retorno de sucesso |
| `src/features/notes/actions/updateSessionNote.ts` | Adicionar `toast.success(...)` no retorno de sucesso |
| `src/features/notes/components/PatientNotesList.tsx` | Adicionar `NoteListSkeleton` como loading state |
| `src/features/payments/actions/createSessionPayment.ts` | Adicionar `toast.success(...)` no retorno de sucesso |
| `src/features/payments/actions/updateSessionPayment.ts` | Adicionar `toast.success(...)` no retorno de sucesso |
| `src/features/payments/components/FinancialDashboard.tsx` (ou equivalente) | Adicionar `FinancialDashboardSkeleton` como loading state |
| `projects/agenda-psicologos/.spec/design-tokens.md` | Atualizar bloco de CSS variables com valores warm-sage |

### Novos arquivos a criar

| Arquivo | Conteúdo |
|---|---|
| `src/features/dashboard/queries/getDashboardData.ts` | Queries `getPendingConfirmationCount` e `getWeeklySummary` |
| `src/features/dashboard/components/DashboardTodaySkeleton.tsx` | Skeleton para agenda do dia |
| `src/features/dashboard/components/DashboardSummarySkeleton.tsx` | Skeleton para cards de resumo |
| `src/features/patients/components/PatientListSkeleton.tsx` | Skeleton para lista de pacientes |
| `src/features/appointments/components/WeeklyCalendarSkeleton.tsx` | Skeleton para agenda semanal |
| `src/features/appointments/components/DayViewSkeleton.tsx` | Skeleton para agenda diária |
| `src/features/notes/components/NoteListSkeleton.tsx` | Skeleton para lista de prontuários |
| `src/features/payments/components/FinancialDashboardSkeleton.tsx` | Skeleton para dashboard financeiro |
