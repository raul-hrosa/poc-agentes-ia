# Feature: Lembretes de Consulta

**Slug:** `lembretes-consulta`
**Prioridade:** must-have
**Fase:** 2 — Specs
**Criada em:** 2026-04-27
**Status:** aprovada

---

## Contexto

O lembrete de consulta é o diferencial central que justifica o PsiAgenda existir.
Sem ele, o produto é apenas uma agenda de papel digital — e o problema de no-show
não é resolvido.

O fluxo é deliberadamente simples no MVP: o psicólogo gera um link de confirmação
para uma consulta específica, copia esse link e o encaminha ao paciente via WhatsApp.
O paciente acessa o link e confirma (ou cancela) a consulta com um clique. O psicólogo
vê o status atualizado na agenda.

**Por que este fluxo resolve o problema:**
A maioria dos psicólogos autônomos iniciantes já usa WhatsApp para se comunicar com
pacientes. Adicionar automação total (disparo automático por e-mail ou cron) cria
complexidade desnecessária no MVP. O link manual é suficiente para validar se o
mecanismo de confirmação reduz no-show antes de investir em automação.

**Canal de envio no MVP:**
Embora o `mvp-scope.md` mencione WhatsApp como canal de distribuição do link, a
stack define Resend como serviço de e-mail. Esta feature cobre os dois casos:
1. O psicólogo copia o link e envia manualmente (WhatsApp ou qualquer canal)
2. O psicólogo usa a ação "Enviar por e-mail" que dispara via Resend para o e-mail
   do paciente, se ele tiver e-mail cadastrado

A página de confirmação acessada pelo paciente é pública e não requer autenticação
— o token HMAC-SHA256 no link é a única proteção.

**Atores:**
- **Psicólogo autenticado** — gera e envia o lembrete
- **Paciente** (sem conta no sistema) — acessa o link de confirmação e responde

**Dependências desta feature:**
- `cadastro-pacientes` — o nome e telefone do paciente são usados no template de e-mail
- `agenda-consultas` — o lembrete é gerado a partir de um `appointment` existente com
  `status = scheduled` ou `status = confirmed`

**Features que dependem desta:**
- `confirmacao-paciente` — a confirmação pelo paciente usa o mesmo mecanismo de token;
  esta spec cobre a geração e envio; a spec de `confirmacao-paciente` pode detalhar
  apenas a experiência da página pública caso seja especificada separadamente

---

## User Stories

### Fluxo principal — envio de lembrete pelo psicólogo

**US-01**
Como psicólogo autenticado,
quero gerar um link de lembrete para uma consulta agendada,
para copiar e enviar ao paciente via WhatsApp e reduzir o risco de no-show.

**US-02**
Como psicólogo autenticado,
quero enviar o lembrete diretamente por e-mail a partir da interface,
para não precisar copiar e colar o link manualmente quando o paciente tem e-mail cadastrado.

**US-03**
Como psicólogo autenticado,
quero reenviar um lembrete para uma consulta que já recebeu lembrete anterior,
para lembrar o paciente novamente caso o primeiro link tenha expirado ou sido ignorado.

### Fluxo alternativo — visualização de status

**US-04**
Como psicólogo autenticado,
quero ver na agenda se um lembrete já foi enviado para uma consulta,
para saber quais pacientes já foram notificados sem precisar verificar fora do sistema.

**US-05**
Como psicólogo autenticado,
quero ver na agenda se o paciente já respondeu ao lembrete (confirmou ou cancelou),
para priorizar meu tempo e não ligar para pacientes que já confirmaram.

### Fluxo do paciente

**US-06**
Como paciente que recebeu um link de lembrete,
quero acessar a página de confirmação sem precisar criar conta,
para confirmar minha presença com um único clique sem fricção.

**US-07**
Como paciente que recebeu um link de lembrete,
quero poder cancelar a consulta pela página de confirmação,
para avisar o psicólogo com antecedência sem precisar ligar ou enviar mensagem.

### Estado vazio

**US-08**
Como psicólogo autenticado visualizando uma consulta que ainda não tem lembrete enviado,
quero ver claramente a opção de gerar e enviar o lembrete no painel de detalhes da consulta,
para não precisar procurar onde disparar essa ação.

### Erros esperados

**US-09**
Como psicólogo autenticado,
quero ser informado quando o lembrete não pode ser enviado por e-mail (falha do Resend),
para tentar novamente ou copiar o link e enviar manualmente.

**US-10**
Como paciente que acessa um link de lembrete expirado ou já utilizado,
quero ver uma página de erro clara e amigável,
para entender o que aconteceu e saber como proceder (entrar em contato com o psicólogo).

---

## Critérios de Aceite

### Geração do token e link

**AC-01**
WHEN o psicólogo autenticado clica em "Gerar lembrete" em uma consulta com
     `status = scheduled` ou `status = confirmed`
THEN o sistema gera um token HMAC-SHA256 usando o payload `{appointmentId}:{expiresAt.toISOString()}`,
     armazena um registro em `appointment_tokens` com `expires_at = now() + 72 horas`,
     `used_at = null` e `action = null`, e exibe o link completo no formato
     `https://[domínio]/confirm/[token]`.

**AC-02**
WHEN o token é gerado
THEN o sistema exibe o link em um campo de texto somente leitura com botão "Copiar link"
     ao lado, e ao clicar em "Copiar link" o link é copiado para a área de transferência
     e o botão muda para "Copiado!" por 2 segundos.

**AC-03**
WHEN o psicólogo clica em "Gerar lembrete" em uma consulta que já possui token ativo
     (não expirado e não usado)
THEN o sistema gera um novo token e invalida o token anterior tornando-o expirado
     (atualiza `expires_at` do token anterior para `now()`), exibindo o novo link.

**AC-04**
WHEN o psicólogo tenta gerar lembrete para uma consulta com `status = completed`,
     `cancelled` ou `no_show`
THEN o sistema não exibe a opção de gerar lembrete para esses status e não executa
     a ação se acionada diretamente.

### Envio por e-mail via Resend

**AC-05**
WHEN o psicólogo clica em "Enviar por e-mail" e o paciente da consulta tem e-mail cadastrado
THEN o sistema envia um e-mail via Resend para o endereço do paciente contendo: nome do
     psicólogo, data e hora da consulta, modalidade (presencial ou online), local/link
     se preenchido, e o link de confirmação; e exibe toast "E-mail enviado com sucesso".

**AC-06**
WHEN o psicólogo clica em "Enviar por e-mail" e o paciente não tem e-mail cadastrado
THEN o sistema não exibe o botão "Enviar por e-mail" — apenas o botão "Copiar link" está visível.

**AC-07**
WHEN o envio do e-mail via Resend falha (erro de rede ou resposta de erro da API)
THEN o sistema exibe toast de erro "Falha ao enviar e-mail. Copie o link e envie manualmente."
     e mantém o link visível para cópia manual.

**AC-08**
WHILE o e-mail está sendo enviado
THEN o botão "Enviar por e-mail" fica desabilitado e exibe indicador de loading.

### Exibição de status de lembrete na agenda

**AC-09**
WHEN o psicólogo visualiza o painel de detalhes de uma consulta que já tem token gerado
     (independente de usado ou não)
THEN o sistema exibe a seção "Lembrete" com: data/hora em que o lembrete foi gerado
     e status atual ("aguardando resposta", "confirmado" ou "cancelado pelo paciente").

**AC-10**
WHEN o psicólogo visualiza o painel de detalhes de uma consulta que nunca teve token gerado
THEN o sistema exibe a seção "Lembrete" com texto "Nenhum lembrete enviado" e o botão
     "Gerar lembrete".

**AC-11**
WHEN a consulta tem `status = confirmed`
THEN o sistema exibe na seção "Lembrete" do painel de detalhes: "Paciente confirmou
     presença" com a data/hora da confirmação.

**AC-12**
WHEN a consulta tem `status = cancelled` e o token `action = cancelled`
THEN o sistema exibe na seção "Lembrete" do painel de detalhes: "Paciente cancelou
     via link" com a data/hora do cancelamento.

### Página pública de confirmação — acesso pelo paciente

**AC-13**
WHEN o paciente acessa `/confirm/[token]` com um token válido
     (existe em `appointment_tokens`, `expires_at > now()`, `used_at IS NULL`,
     e `appointment.status` é `scheduled` ou `confirmed`)
THEN o sistema exibe a página de confirmação com: nome do psicólogo, data e hora da
     consulta, modalidade, local/link se preenchido, e dois botões:
     "Confirmar presença" e "Preciso cancelar".

**AC-14**
WHEN o paciente clica em "Confirmar presença" na página de confirmação
THEN o sistema atualiza atomicamente: `appointment.status = confirmed`,
     `appointment_tokens.used_at = now()` e `appointment_tokens.action = confirmed`,
     e exibe a página de sucesso com mensagem "Presença confirmada! Até [data da consulta].".

**AC-15**
WHEN o paciente clica em "Preciso cancelar" na página de confirmação
THEN o sistema exibe uma tela intermediária solicitando confirmação da ação de cancelamento,
     com os dados da consulta e botões "Voltar" e "Confirmar cancelamento".

**AC-16**
WHEN o paciente confirma o cancelamento na tela intermediária
THEN o sistema atualiza atomicamente: `appointment.status = cancelled`,
     `appointment_tokens.used_at = now()` e `appointment_tokens.action = cancelled`,
     e exibe a página de sucesso com mensagem "Cancelamento registrado. Seu psicólogo
     foi notificado.".

**AC-17**
WHEN o paciente acessa `/confirm/[token]` com token expirado (`expires_at <= now()`)
THEN o sistema exibe página de erro com: "Este link expirou." e orientação para
     entrar em contato com o psicólogo diretamente.

**AC-18**
WHEN o paciente acessa `/confirm/[token]` com token já utilizado (`used_at IS NOT NULL`)
THEN o sistema exibe página de erro com: "Este link já foi utilizado." e a ação
     já registrada ("Você já confirmou sua presença." ou "Você já cancelou esta consulta.").

**AC-19**
WHEN o paciente acessa `/confirm/[token]` com token inexistente no banco
THEN o sistema exibe página de erro com: "Link inválido." sem expor informação
     sobre a existência de outros tokens.

**AC-20**
WHEN o paciente acessa `/confirm/[token]` de uma consulta cujo `status` é
     `completed`, `cancelled` ou `no_show`
THEN o sistema exibe página informativa: "Esta consulta não está mais disponível
     para confirmação." sem exibir os botões de ação.

### Autorização

**AC-21**
WHEN um usuário autenticado como psicólogo tenta gerar lembrete para uma consulta
     cujo `userId` não corresponde ao seu `id`
THEN o sistema retorna erro 404 sem expor que a consulta existe.

**AC-22**
WHEN um usuário não autenticado tenta acessar a Server Action de geração de token
THEN o sistema retorna erro 401 sem executar a ação.

**AC-23**
THE SYSTEM SHALL processar a rota `/confirm/[token]` sem exigir autenticação —
     qualquer pessoa com o link pode acessar a página de confirmação.

---

## Wireframe Textual

### Tela 1 — Seção "Lembrete" no Painel de Detalhes da Consulta

Estado inicial (sem lembrete):
```
+------------------------------------------+
| Consulta                           [x]   |
|------------------------------------------|
| Ana Beatriz                              |
| Sex, 08 mai 2026 · 09:00–09:50           |
| Presencial · Rua das Flores, 100         |
|                                          |
| Status: [agendada]                       |
|                                          |
|------------------------------------------|
| Lembrete                                 |
|                                          |
|  Nenhum lembrete enviado.                |
|                                          |
|  [Gerar lembrete]                        |
|                                          |
|------------------------------------------|
| Ações:                                   |
| [Marcar como realizada]                  |
| [Marcar como no-show]                    |
| [Editar consulta]                        |
| [Cancelar consulta]                      |
+------------------------------------------+
```

Após gerar lembrete (paciente com e-mail cadastrado):
```
+------------------------------------------+
| Lembrete                                 |
|                                          |
|  Gerado em: 05 mai 2026 às 14:32         |
|  Status: aguardando resposta do paciente |
|                                          |
|  Link de confirmação:                    |
|  [https://app.psiagenda.com.br/conf...]  |
|  [Copiar link]  [Enviar por e-mail]      |
|                                          |
|  [Gerar novo lembrete]                   |
+------------------------------------------+
```

Após gerar lembrete (paciente sem e-mail):
```
+------------------------------------------+
| Lembrete                                 |
|                                          |
|  Gerado em: 05 mai 2026 às 14:32         |
|  Status: aguardando resposta do paciente |
|                                          |
|  Link de confirmação:                    |
|  [https://app.psiagenda.com.br/conf...]  |
|  [Copiar link]                           |
|                                          |
|  [Gerar novo lembrete]                   |
+------------------------------------------+
```

Após confirmação pelo paciente:
```
+------------------------------------------+
| Lembrete                                 |
|                                          |
|  Paciente confirmou presença             |
|  em 06 mai 2026 às 10:15                 |
|                                          |
|  [Gerar novo lembrete]                   |
+------------------------------------------+
```

Após cancelamento pelo paciente:
```
+------------------------------------------+
| Lembrete                                 |
|                                          |
|  Paciente cancelou via link              |
|  em 06 mai 2026 às 08:40                 |
|                                          |
|  [Gerar novo lembrete]                   |
+------------------------------------------+
```

**Elementos comuns:**
- A seção "Lembrete" sempre aparece no painel de detalhes de consultas com
  `status = scheduled` ou `confirmed`
- Para consultas em status terminal (`completed`, `cancelled`, `no_show`): exibe
  apenas o histórico de lembrete (se houver), sem botão de ação
- O campo do link é somente leitura, truncado com reticências se longo demais
- "Gerar novo lembrete" fica visível mesmo após o paciente ter respondido,
  permitindo reenvio em caso de nova necessidade

---

### Tela 2 — E-mail recebido pelo paciente

```
De: PsiAgenda <lembretes@psiagenda.com.br>
Para: ana.beatriz@email.com
Assunto: Lembrete: sua consulta com Dra. Carla Mendes

-------------------------------------------
             PsiAgenda
-------------------------------------------

Olá, Ana Beatriz!

Você tem uma consulta agendada:

  Psicóloga:  Dra. Carla Mendes
  Data:       Sexta-feira, 08 mai 2026
  Horário:    09:00 – 09:50
  Modalidade: Presencial
  Local:      Rua das Flores, 100 — sala 3

Por favor, confirme sua presença clicando
no botão abaixo:

  [Confirmar presença]     [Preciso cancelar]

  (ou acesse o link: https://app.psiagenda.com.br/confirm/[token])

Este link é válido por 72 horas e é de uso único.

-------------------------------------------
Enviado por PsiAgenda · psiagenda.com.br
```

**Elementos do e-mail:**
- Remetente fixo: `lembretes@psiagenda.com.br`
- Assunto: `Lembrete: sua consulta com [nome do psicólogo]`
- Saudação com nome do paciente
- Bloco de dados da consulta: psicólogo, data por extenso, horário de início e término,
  modalidade e local/link (omitido se não preenchido)
- Dois botões de ação que apontam para `/confirm/[token]?action=confirmed` e
  `/confirm/[token]?action=cancelled` respectivamente
- Link de fallback em texto puro abaixo dos botões
- Rodapé com nome do produto e URL

---

### Tela 3 — Página Pública de Confirmação (`/confirm/[token]`)

Estado válido — aguardando ação do paciente:
```
+--------------------------------------------------+
|                  PsiAgenda                       |
+--------------------------------------------------+
|                                                  |
|  Olá, Ana Beatriz!                               |
|                                                  |
|  Você tem uma consulta agendada:                 |
|                                                  |
|  Psicóloga:  Dra. Carla Mendes                  |
|  Data:       Sexta-feira, 08 mai 2026            |
|  Horário:    09:00 – 09:50                       |
|  Modalidade: Presencial                          |
|  Local:      Rua das Flores, 100 — sala 3        |
|                                                  |
|  [  Confirmar presença  ]                        |
|  [  Preciso cancelar    ]                        |
|                                                  |
+--------------------------------------------------+
```

Tela intermediária de cancelamento:
```
+--------------------------------------------------+
|                  PsiAgenda                       |
+--------------------------------------------------+
|                                                  |
|  Tem certeza que deseja cancelar?                |
|                                                  |
|  Psicóloga:  Dra. Carla Mendes                  |
|  Data:       Sexta-feira, 08 mai 2026            |
|  Horário:    09:00 – 09:50                       |
|                                                  |
|  [  Voltar  ]  [  Confirmar cancelamento  ]      |
|                                                  |
+--------------------------------------------------+
```

Estado de sucesso — confirmação:
```
+--------------------------------------------------+
|                  PsiAgenda                       |
+--------------------------------------------------+
|                                                  |
|  Presença confirmada!                            |
|                                                  |
|  Até sexta-feira, 08 mai 2026 às 09:00.          |
|                                                  |
|  Dra. Carla Mendes já foi notificada.            |
|                                                  |
+--------------------------------------------------+
```

Estado de sucesso — cancelamento:
```
+--------------------------------------------------+
|                  PsiAgenda                       |
+--------------------------------------------------+
|                                                  |
|  Cancelamento registrado.                        |
|                                                  |
|  Sua psicóloga foi notificada.                   |
|  Em caso de dúvidas, entre em contato            |
|  diretamente com o consultório.                  |
|                                                  |
+--------------------------------------------------+
```

Estado de erro — token expirado:
```
+--------------------------------------------------+
|                  PsiAgenda                       |
+--------------------------------------------------+
|                                                  |
|  Este link expirou.                              |
|                                                  |
|  Links de confirmação são válidos por 72 horas.  |
|  Entre em contato com seu psicólogo para         |
|  receber um novo link ou confirmar diretamente.  |
|                                                  |
+--------------------------------------------------+
```

Estado de erro — token já utilizado:
```
+--------------------------------------------------+
|                  PsiAgenda                       |
+--------------------------------------------------+
|                                                  |
|  Este link já foi utilizado.                     |
|                                                  |
|  Você já confirmou sua presença.                 |
|  [ou: Você já cancelou esta consulta.]           |
|                                                  |
+--------------------------------------------------+
```

Estado de erro — token inválido:
```
+--------------------------------------------------+
|                  PsiAgenda                       |
+--------------------------------------------------+
|                                                  |
|  Link inválido.                                  |
|                                                  |
|  Entre em contato com seu psicólogo para         |
|  obter um novo link de confirmação.              |
|                                                  |
+--------------------------------------------------+
```

**Elementos comuns da página pública:**
- Logo e nome do produto no topo (sem menu de navegação — página isolada)
- Página responsiva, otimizada para acesso via celular (o paciente acessa pelo WhatsApp)
- Sem link para login ou cadastro — a página não pressupõe que o paciente tem conta
- Sem cookies ou rastreamento além do necessário para o fluxo
- O `action` no parâmetro de query (`?action=confirmed` ou `?action=cancelled`)
  pré-seleciona a ação ao chegar da plataforma de e-mail; se ausente, nenhuma ação
  é pré-selecionada e ambos os botões são exibidos normalmente

---

## Regras de Negócio

**RN-01 — Geração do token HMAC-SHA256**
O token é gerado usando o módulo nativo `crypto` do Node.js:

```typescript
const payload = `${appointmentId}:${expiresAt.toISOString()}`
const token = createHmac('sha256', process.env.APP_SECRET!).update(payload).digest('hex')
```

O segredo `APP_SECRET` deve estar definido em variável de ambiente. Ver ADR
`token-confirmacao.md` para o racional completo desta decisão.

**RN-02 — Expiração de 72 horas**
Todo token gerado tem `expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000)`.
Tokens não são válidos após esse prazo, independente de terem sido usados ou não.

**RN-03 — Uso único do token**
Um token só pode ser usado uma vez. Após o paciente confirmar ou cancelar,
`used_at` é preenchido com o timestamp da ação e `action` é definido como
`confirmed` ou `cancelled`. Tentativas subsequentes de usar o mesmo token
retornam erro "link já utilizado".

**RN-04 — Invalidação do token anterior ao reenviar**
Quando o psicólogo gera um novo lembrete para uma consulta que já tem token ativo,
o sistema invalida o token anterior atualizando seu `expires_at` para `now()`.
Isso garante que nunca haja dois tokens válidos simultaneamente para a mesma consulta.
Tokens já expirados ou usados não são alterados — apenas o ativo mais recente.

**RN-05 — Quem pode enviar lembrete**
Apenas o psicólogo autenticado dono da consulta (`appointments.userId = session.user.id`)
pode gerar ou reenviar lembretes. A verificação é feita na Server Action antes de
qualquer operação em `appointment_tokens`.

**RN-06 — Quando o lembrete pode ser enviado**
Lembretes só podem ser gerados para consultas com `status = scheduled` ou
`status = confirmed`. Consultas com status terminal (`completed`, `cancelled`,
`no_show`) não permitem geração de token.

**RN-07 — Sem limite de reenvios por consulta**
No MVP, não há limite de quantas vezes o psicólogo pode gerar um novo lembrete
para a mesma consulta. Cada novo envio invalida o token anterior (ver RN-04).

**RN-08 — Transição de status após confirmação pelo paciente**
Quando o paciente confirma via link:
- `appointment.status` muda de `scheduled` → `confirmed`
- Se já estava `confirmed`, permanece `confirmed` (idempotente)
- `appointment_tokens.used_at` e `appointment_tokens.action` são definidos atomicamente

Quando o paciente cancela via link:
- `appointment.status` muda para `cancelled` (de qualquer status permitido)
- `cancellation_reason` não é preenchido (cancelamento pelo paciente via link
  não tem campo de motivo no MVP)
- `appointment_tokens.used_at` e `appointment_tokens.action` são definidos atomicamente

**RN-09 — Validação de token na página pública**
A rota `/confirm/[token]` valida o token nesta ordem obrigatória:
1. Token existe em `appointment_tokens`?
2. `expires_at > now()`? (não expirado)
3. `used_at IS NULL`? (não usado)
4. `appointment.status` é `scheduled` ou `confirmed`? (consulta ainda pode ser confirmada)

Se qualquer verificação falhar, a ação não é executada e a página de erro correspondente
é exibida. A ordem importa: o sistema verifica existência antes de expiração para não
vazar informação sobre tokens válidos mas expirados de outros usuários.

**RN-10 — Rota pública sem autenticação**
A rota `/confirm/[token]` e suas API routes associadas ficam fora do grupo `(auth)`
do Next.js App Router. O middleware do NextAuth não intercepta essas rotas.
A única proteção é a validade do token HMAC-SHA256.

**RN-11 — E-mail enviado como transacional via Resend**
O e-mail de lembrete é enviado como mensagem transacional, não marketing. O remetente
é `lembretes@psiagenda.com.br`. Não é necessário opt-out ou unsubscribe no MVP pois
a mensagem é solicitada pelo psicólogo e direcionada a um paciente com relacionamento
clínico estabelecido.

**RN-12 — Campo e-mail do paciente**
O modelo de dados atual de `patients` não inclui o campo `email`. O botão
"Enviar por e-mail" só aparece se o paciente tiver e-mail cadastrado. Como o campo
`email` ainda não existe em `patients`, a implementação desta feature deve adicionar
o campo `email` à entidade `patients` como campo opcional. Isso representa uma
extensão do modelo de dados que deve ser documentada como migration.

---

## Dados e API

### Entidades utilizadas

- `appointments` — leitura para validar status, obter dados da consulta para exibição
  e e-mail; atualização de `status` após ação do paciente
- `appointment_tokens` — criação de token, leitura para validação, atualização de
  `used_at` e `action` após ação do paciente
- `patients` — leitura do nome e e-mail do paciente para o template de e-mail
- `users` — leitura do nome do psicólogo para o template de e-mail

### Server Actions (psicólogo autenticado)

| Ação | Arquivo sugerido | Descrição |
|---|---|---|
| `generateReminderToken` | `features/reminders/actions/generateReminderToken.ts` | Gera token HMAC-SHA256, invalida token ativo anterior, cria registro em `appointment_tokens`. Requer `userId` correspondente à consulta. |
| `sendReminderEmail` | `features/reminders/actions/sendReminderEmail.ts` | Chama `generateReminderToken` se necessário e dispara e-mail via Resend com dados da consulta e link de confirmação. Só disponível se paciente tem e-mail. |

### API Routes públicas (sem autenticação)

| Rota | Método | Descrição |
|---|---|---|
| `/api/confirm/[token]` | `POST` | Recebe `action: 'confirmed' \| 'cancelled'`. Valida token (RN-09), executa transição de status atomicamente em `appointments` e `appointment_tokens`. Retorna `{ success: true, action }` ou erro estruturado. |

**Nota:** A página `/confirm/[token]` é um Server Component que lê e valida o token
na renderização. As ações de confirmar e cancelar são executadas via API Route POST
(não Server Action) porque a página não requer autenticação e Server Actions têm
associação com sessão do NextAuth.

### Queries (Server Components)

| Query | Descrição |
|---|---|
| `getAppointmentToken(token)` | Busca token com join em `appointments` e `patients`. Retorna dados para renderizar a página pública. |
| `getLatestReminderForAppointment(appointmentId)` | Busca o token mais recente de uma consulta (order by `created_at DESC LIMIT 1`) para exibir status de lembrete no painel do psicólogo. |

### Schemas Zod

```typescript
// features/reminders/schema.ts

import { z } from "zod"

export const GenerateReminderSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
})

export const SendReminderEmailSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
})

export const ConfirmActionSchema = z.object({
  token: z.string().length(64, "Token inválido"),
  action: z.enum(["confirmed", "cancelled"]),
})
```

### Variáveis de ambiente necessárias

| Variável | Descrição |
|---|---|
| `APP_SECRET` | Segredo HMAC-SHA256 para assinar tokens. Mínimo 32 caracteres. Rotação invalida todos os tokens ativos. |
| `RESEND_API_KEY` | Chave da API do Resend para envio de e-mail transacional. |
| `NEXT_PUBLIC_APP_URL` | URL base do app (ex: `https://app.psiagenda.com.br`) para compor o link de confirmação. |

### Rotas Next.js (App Router)

| Rota | Tipo | Auth | Descrição |
|---|---|---|---|
| `/confirm/[token]` | Page (Server Component) | Pública | Página de confirmação acessada pelo paciente |
| `/api/confirm/[token]` | Route Handler | Pública | Processa ação de confirmar ou cancelar |

A geração e envio de lembrete ocorrem via Server Actions acionadas no painel de
detalhes da consulta dentro de `/appointments/[id]`, que já é rota protegida.

### Extensão necessária no modelo de dados

A implementação deve adicionar o campo `email` à tabela `patients`:

```prisma
// Adição ao model Patient em prisma/schema.prisma
email String? @db.VarChar(255)  // e-mail do paciente (opcional, para envio de lembrete)
```

Migration correspondente deve ser criada antes da implementação desta feature.

---

## Fora do Escopo desta Feature

1. **Lembretes automáticos por cron job** — no MVP, o psicólogo envia o lembrete
   manualmente. Agendamento automático de disparo 24h e 2h antes da consulta é
   funcionalidade do plano pro descrita no `mvp-scope.md` como futura. Nenhum
   job agendado, cron ou background worker deve ser implementado nesta feature.

2. **SMS, WhatsApp Business API, notificação push** — o único canal de envio
   implementado nesta feature é e-mail via Resend. A distribuição do link via
   WhatsApp é feita manualmente pelo psicólogo (copiar e colar). Integrações com
   operadoras de SMS ou WhatsApp Business estão no backlog.

3. **Campo de motivo de cancelamento pelo paciente** — quando o paciente cancela
   via link, nenhum campo de motivo é exibido. O cancelamento é registrado sem
   `cancellation_reason`. Coletar motivo do paciente é funcionalidade futura.

4. **Notificação em tempo real ao psicólogo** — quando o paciente confirma ou cancela,
   o psicólogo não recebe push notification, e-mail ou websocket. O status atualizado
   é visível ao recarregar o painel de detalhes da consulta.

5. **Histórico de todos os lembretes enviados** — o painel do psicólogo exibe apenas
   o lembrete mais recente de cada consulta. O histórico completo de tokens gerados
   (reenvios anteriores) não é exibido na interface no MVP.

---

## Dependências

**Pré-requisitos obrigatórios:**
- `cadastro-pacientes` — deve estar implementada. O nome e e-mail do paciente são
  usados no template de e-mail. A migration que adiciona `email` à tabela `patients`
  é parte desta feature.
- `agenda-consultas` — deve estar implementada. O lembrete é gerado a partir de um
  `appointment` existente. O painel de detalhes da consulta é o ponto de entrada
  para esta feature.

**Features que dependem desta:**
- `confirmacao-paciente` — se especificada separadamente, compartilha a rota pública
  `/confirm/[token]` e a lógica de validação do token definida nesta spec.
