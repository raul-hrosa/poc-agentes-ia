# Feature: Prontuário Simplificado por Sessão

**Slug:** `prontuario-sessao`
**Prioridade:** must-have
**Fase:** 2 — Specs
**Criada em:** 2026-04-27
**Status:** aguardando aprovação

---

## Contexto

Psicólogos são obrigados pelo Conselho Federal de Psicologia (CFP) a manter
registros de atendimento para cada sessão realizada. Sem prontuário, o PsiAgenda
não pode substituir as anotações manuais que o profissional já faz hoje em papel
ou em editores de texto fora do sistema.

Esta feature cobre o ciclo completo do prontuário de sessão: criação, visualização,
edição e exclusão de anotações clínicas vinculadas a uma consulta realizada. O
conteúdo é texto livre por design — o produto não implementa estruturas clínicas
como SOAP, CID-10 ou campos predefinidos.

**Por que esta feature resolve o problema central:**
O psicólogo autônomo em início de carreira precisa de um lugar único para gerenciar
pacientes, agenda e registros clínicos. Sem prontuário integrado, o sistema resolve
apenas dois terços do problema — o profissional ainda precisa alternar para outro
aplicativo após cada sessão, o que reduz a proposta de valor do PsiAgenda.

**Conformidade CFP/LGPD:**
- Prontuários são dados de saúde sensíveis conforme LGPD (Art. 11). Acesso é
  restrito exclusivamente ao psicólogo dono do registro.
- A resolução CFP n.º 001/2009 exige que prontuários sejam mantidos por no mínimo
  5 anos. Esta feature não implementa exclusão automática — a exclusão é manual
  e permanente (hard delete), sob responsabilidade do psicólogo.
- A autenticação via NextAuth.js satisfaz o requisito de acesso seguro do CFP
  para sistemas digitais. Não há segunda senha para o prontuário no MVP
  (ver ADR `auth-prontuario-cfp.md`).

**Dependências desta feature:**
- `autenticacao` — todo acesso ao prontuário requer sessão autenticada
- `cadastro-pacientes` — prontuário pertence a um paciente cadastrado
- `agenda-consultas` — prontuário é vinculado a uma consulta com `status = completed`

---

## User Stories

### Fluxo principal — criação do prontuário

**US-01**
Como psicólogo autenticado,
quero registrar anotações clínicas após uma sessão realizada,
para cumprir a obrigação legal de manutenção de prontuário e ter o histórico
do paciente em um único lugar.

**US-02**
Como psicólogo autenticado,
quero acessar o formulário de prontuário diretamente da consulta marcada como realizada,
para não precisar navegar manualmente até encontrar o local de registro das notas.

**US-03**
Como psicólogo autenticado,
quero editar o prontuário de uma sessão já registrada,
para corrigir ou complementar as anotações após salvá-las.

### Fluxo principal — visualização do histórico

**US-04**
Como psicólogo autenticado,
quero visualizar o histórico completo de prontuários de um paciente em ordem cronológica,
para acompanhar a evolução clínica ao longo do tempo sem precisar abrir sessão por sessão.

**US-05**
Como psicólogo autenticado,
quero acessar o prontuário de uma sessão específica pelo histórico do paciente,
para revisar as anotações de uma data específica antes de uma nova sessão.

### Perfis alternativos — estado vazio

**US-06**
Como psicólogo autenticado visualizando o histórico de prontuários de um paciente
que ainda não tem nenhuma anotação registrada,
quero ver uma mensagem orientativa indicando que não há registros,
para entender que as notas são criadas após marcar uma consulta como realizada.

**US-07**
Como psicólogo autenticado que acaba de marcar uma consulta como realizada,
quero ser direcionado para registrar o prontuário daquela sessão,
para aproveitar o momento pós-sessão enquanto as informações ainda estão frescas.

### Exclusão

**US-08**
Como psicólogo autenticado,
quero excluir o prontuário de uma sessão específica,
para exercer meu direito de controle sobre os dados clínicos que mantenho
conforme a LGPD.

### Erros esperados

**US-09**
Como psicólogo autenticado,
quero ser impedido de criar prontuário para uma consulta que não foi marcada como realizada,
para evitar registros clínicos vinculados a sessões que ainda não aconteceram.

---

## Critérios de Aceite

### Acesso ao prontuário a partir da consulta

**AC-01**
WHEN o psicólogo visualiza os detalhes de uma consulta com `status = completed`
     E a consulta ainda não possui prontuário (`session_notes` inexistente para esse `appointment_id`)
THEN o sistema exibe o botão "Registrar prontuário" que navega para
     `/notes/new?appointment=[id]`.

**AC-02**
WHEN o psicólogo visualiza os detalhes de uma consulta com `status = completed`
     E a consulta já possui prontuário registrado
THEN o sistema exibe o botão "Ver prontuário" que navega para
     `/notes/[note_id]`.

**AC-03**
WHEN o psicólogo visualiza os detalhes de uma consulta com `status` diferente de `completed`
     (ou seja: `scheduled`, `confirmed`, `cancelled` ou `no_show`)
THEN o sistema não exibe nenhuma opção de prontuário para essa consulta.

### Criação do prontuário

**AC-04**
WHEN o psicólogo acessa `/notes/new?appointment=[id]`
     E a consulta existe, pertence ao psicólogo autenticado e tem `status = completed`
     E ainda não existe `session_notes` para esse `appointment_id`
THEN o sistema exibe o formulário de registro com o contexto da consulta (nome do paciente,
     data e horário da sessão) e um campo de texto livre para o conteúdo.

**AC-05**
WHEN o psicólogo submete o formulário com `content` preenchido
THEN o sistema cria o registro em `session_notes` com `userId` do psicólogo autenticado,
     `appointmentId` da consulta e o `content` informado, e redireciona para
     `/notes/[note_id]` com toast "Prontuário registrado com sucesso".

**AC-06**
WHEN o psicólogo tenta submeter o formulário com `content` vazio
THEN o sistema exibe "O conteúdo do prontuário é obrigatório" abaixo do campo
     e não submete.

**AC-07**
WHEN o psicólogo acessa `/notes/new?appointment=[id]`
     E já existe `session_notes` para esse `appointment_id`
THEN o sistema redireciona para `/notes/[note_id]` existente, sem criar duplicata.

**AC-08**
WHEN o psicólogo acessa `/notes/new?appointment=[id]`
     E a consulta existe mas `status` é diferente de `completed`
THEN o sistema exibe erro "Prontuário só pode ser registrado para sessões realizadas"
     e não exibe o formulário.

**AC-09**
WHILE o formulário está sendo submetido
THEN o sistema desabilita o botão de submit e exibe indicador de loading.

### Visualização do prontuário

**AC-10**
WHEN o psicólogo acessa `/notes/[note_id]`
     E o prontuário pertence ao psicólogo autenticado
THEN o sistema exibe: nome do paciente, data e horário da sessão, data de criação
     do prontuário, data da última edição (se editado) e o conteúdo do prontuário.

**AC-11**
WHEN o psicólogo acessa a visualização do prontuário
THEN o sistema exibe os botões "Editar" e "Excluir" visíveis na mesma tela.

### Edição do prontuário

**AC-12**
WHEN o psicólogo clica em "Editar" na visualização do prontuário
THEN o sistema exibe o campo de texto pré-preenchido com o `content` atual
     e um botão "Salvar alterações".

**AC-13**
WHEN o psicólogo salva a edição com `content` preenchido
THEN o sistema atualiza `content` e `updated_at` em `session_notes`,
     exibe toast "Prontuário atualizado" e retorna para a visualização.

**AC-14**
WHEN o psicólogo tenta salvar a edição com `content` vazio
THEN o sistema exibe "O conteúdo do prontuário é obrigatório" e não salva.

**AC-15**
WHEN o psicólogo cancela a edição
THEN o sistema descarta as alterações e retorna para a visualização sem modificar o registro.

### Exclusão do prontuário

**AC-16**
WHEN o psicólogo clica em "Excluir" na visualização do prontuário
THEN o sistema exibe um dialog de confirmação com o texto "Excluir prontuário?
     Esta ação não pode ser desfeita. O registro será removido permanentemente."

**AC-17**
WHEN o psicólogo confirma a exclusão no dialog
THEN o sistema executa hard delete do registro em `session_notes`, redireciona
     para a consulta correspondente e exibe toast "Prontuário excluído".

**AC-18**
WHEN o psicólogo cancela no dialog de exclusão
THEN o sistema fecha o dialog e o prontuário permanece inalterado.

### Histórico de prontuários por paciente

**AC-19**
WHEN o psicólogo acessa `/patients/[patient_id]/notes`
THEN o sistema exibe a lista de todos os prontuários do paciente, ordenados por
     `appointments.scheduled_at DESC` (mais recente primeiro), com data da sessão
     e os primeiros 150 caracteres do `content` como preview.

**AC-20**
WHEN não há prontuários registrados para o paciente
THEN o sistema exibe mensagem "Nenhum prontuário registrado ainda. Prontuários
     aparecem aqui após você marcar uma sessão como realizada e registrar as anotações."

**AC-21**
WHEN o psicólogo clica em um item da lista de histórico
THEN o sistema navega para `/notes/[note_id]` com o prontuário completo.

### Autorização e isolamento

**AC-22**
WHEN o psicólogo autenticado acessa qualquer rota de `/notes`
THEN o sistema retorna apenas registros onde `session_notes.userId = id do psicólogo autenticado`.

**AC-23**
WHEN um usuário não autenticado tenta acessar qualquer rota de `/notes` ou `/patients/[id]/notes`
THEN o sistema redireciona para `/login`.

**AC-24**
WHEN o psicólogo tenta acessar, editar ou excluir um prontuário cujo `userId`
     não corresponde ao seu `id`
THEN o sistema retorna erro 404 (não expõe que o prontuário existe e pertence a outro psicólogo).

**AC-25**
WHEN o psicólogo tenta criar prontuário para uma consulta cujo `userId`
     não corresponde ao seu `id`
THEN o sistema retorna erro 404 sem criar o registro.

---

## Wireframe Textual

### Tela 1 — Formulário de Criação (`/notes/new?appointment=[id]`)

```
+--------------------------------------------------+
| [< Voltar para consulta]  Nova Anotação          |
+--------------------------------------------------+
|                                                  |
| Ana Beatriz Costa                                |
| Quinta-feira, 24 abr 2026 · 09:00–09:50          |
| Presencial                                       |
|                                                  |
|--------------------------------------------------|
| Anotações da sessão *                            |
|                                                  |
| [                                                |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
|                                        ]         |
|                                                  |
|              [Cancelar]  [Salvar prontuário]     |
+--------------------------------------------------+
```

**Elementos:**
- Botão voltar no header retorna para a visualização de detalhes da consulta
- Título "Nova Anotação" no header
- Contexto da consulta: nome do paciente, data por extenso, horário de início e término,
  modalidade — exibido como somente leitura antes do campo de texto
- Campo de texto livre, multilinha (textarea), sem limite de caracteres, sem formatação
- Campo obrigatório marcado com asterisco
- Botão "Cancelar" retorna para a consulta sem salvar
- Botão "Salvar prontuário" submete o formulário
- Botão "Salvar prontuário" desabilitado durante submissão com spinner

**Estado de validação:**
```
| Anotações da sessão *                            |
| [                                        ]       |
| * O conteúdo do prontuário é obrigatório         |
```

---

### Tela 2 — Visualização do Prontuário (`/notes/[note_id]`)

```
+--------------------------------------------------+
| [< Voltar]                         [Editar]      |
+--------------------------------------------------+
|                                                  |
| Ana Beatriz Costa                                |
| Quinta-feira, 24 abr 2026 · 09:00–09:50          |
|                                                  |
| Registrado em 24/04/2026 às 10:15                |
| Editado em 24/04/2026 às 11:02  (se editado)     |
|                                                  |
|--------------------------------------------------|
|                                                  |
| Paciente relatou ansiedade aumentada nos últimos |
| dias. Exploramos gatilhos ligados ao ambiente    |
| de trabalho. Próxima sessão: revisar técnicas    |
| de regulação emocional.                          |
|                                                  |
|--------------------------------------------------|
|                                                  |
|                         [Excluir prontuário]     |
+--------------------------------------------------+
```

**Elementos:**
- Botão voltar no header (retorna para o histórico do paciente ou para a consulta,
  conforme a rota de origem)
- Botão "Editar" no canto superior direito do header
- Contexto da sessão: nome do paciente, data por extenso e horário
- Metadados do prontuário: data e hora de criação; data e hora da última edição
  (exibida apenas se `updated_at > created_at`)
- Conteúdo do prontuário exibido como texto simples, sem formatação
- Botão "Excluir prontuário" no rodapé, alinhado à direita

---

### Tela 3 — Modo Edição (mesma rota `/notes/[note_id]`, estado de edição)

```
+--------------------------------------------------+
| [< Cancelar edição]  Editar Anotação             |
+--------------------------------------------------+
|                                                  |
| Ana Beatriz Costa                                |
| Quinta-feira, 24 abr 2026 · 09:00–09:50          |
|                                                  |
|--------------------------------------------------|
| Anotações da sessão *                            |
|                                                  |
| [Paciente relatou ansiedade aumentada nos        |
|  últimos dias. Exploramos gatilhos ligados       |
|  ao ambiente de trabalho. Próxima sessão:        |
|  revisar técnicas de regulação emocional.        |
|                                        ]         |
|                                                  |
|         [Cancelar]   [Salvar alterações]         |
+--------------------------------------------------+
```

**Elementos:**
- Header muda para "Editar Anotação" com botão "Cancelar edição" no lugar do voltar
- Contexto da sessão mantido como somente leitura
- Campo de texto pré-preenchido com o `content` atual, editável
- Botão "Cancelar" descarta as alterações e retorna para a visualização
- Botão "Salvar alterações" submete a edição

---

### Tela 4 — Histórico de Prontuários do Paciente (`/patients/[patient_id]/notes`)

```
+--------------------------------------------------+
| [< Ana Beatriz Costa]     Prontuários            |
+--------------------------------------------------+
|                                                  |
| 2026                                             |
|--------------------------------------------------|
| 24 abr 2026 · 09:00                              |
| Paciente relatou ansiedade aumentada nos         |
| últimos dias. Exploramos gatilhos ligados...     |
|                                    [Ver completo]|
|--------------------------------------------------|
| 17 abr 2026 · 09:00                              |
| Sessão focada em histórico familiar. Paciente    |
| demonstrou boa receptividade às intervenções...  |
|                                    [Ver completo]|
|--------------------------------------------------|
| 10 abr 2026 · 09:00                              |
| Primeira sessão. Anamnese realizada. Objetivos   |
| terapêuticos discutidos e definidos em conjunto...|
|                                    [Ver completo]|
+--------------------------------------------------+
```

**Elementos:**
- Botão voltar no header retorna para o perfil do paciente
- Título "Prontuários" no header
- Lista de prontuários agrupada por ano (separadores de ano quando há registros
  em anos diferentes)
- Cada item exibe: data e horário da sessão, preview dos primeiros 150 caracteres
  do `content` (truncado com "..." se maior) e link "Ver completo"
- Ordenação: mais recente primeiro (`scheduled_at DESC`)
- Toque em qualquer área do item navega para `/notes/[note_id]`

**Estado vazio:**
```
+--------------------------------------------------+
|                                                  |
|      Nenhum prontuário registrado ainda.         |
|                                                  |
|      Prontuários aparecem aqui após você         |
|      marcar uma sessão como realizada e          |
|      registrar as anotações.                     |
|                                                  |
+--------------------------------------------------+
```

---

### Dialog de Confirmação de Exclusão

```
+------------------------------------------+
| Excluir prontuário?                      |
|                                          |
| Esta ação não pode ser desfeita.         |
| O registro será removido permanentemente.|
|                                          |
|   [Cancelar]   [Sim, excluir]            |
+------------------------------------------+
```

**Elementos:**
- Título "Excluir prontuário?" com texto de aviso sobre permanência da ação
- Sem indicação do paciente ou data para manter o dialog simples
- Botão "Cancelar" fecha sem executar
- Botão "Sim, excluir" aciona a exclusão
- Exibido como modal sobre a tela atual

---

## Regras de Negócio

**RN-01 — Vínculo obrigatório com consulta realizada**
Prontuário só pode ser criado para consultas com `status = completed`. Nenhuma
consulta com outro status (`scheduled`, `confirmed`, `cancelled`, `no_show`) pode
ter prontuário associado. A validação é feita na Server Action, não apenas no cliente.

**RN-02 — Unicidade de prontuário por consulta**
Cada consulta pode ter no máximo um prontuário. A constraint `UNIQUE (appointment_id)`
em `session_notes` garante isso no banco. Em código, antes de criar, o sistema
verifica se já existe um registro para o `appointment_id` e redireciona para o
existente em vez de lançar erro de constraint.

**RN-03 — Conteúdo obrigatório**
O campo `content` em `session_notes` é `NOT NULL` e não pode ser uma string vazia.
A validação Zod rejeita strings vazias ou compostas apenas de espaços em branco.
Não há limite máximo de caracteres definido — o banco usa `TEXT`.

**RN-04 — Hard delete**
A exclusão de prontuário é permanente. Não há soft delete para `session_notes`.
O psicólogo tem controle total sobre seus dados clínicos conforme LGPD (Art. 18, VI).
Uma vez excluído, o conteúdo não pode ser recuperado pelo sistema.

**RN-05 — Isolamento por psicólogo**
Todo acesso à tabela `session_notes` inclui obrigatoriamente `where: { userId: session.user.id }`.
O campo `user_id` é denormalizado em `session_notes` (ver ADR `user-id-denormalizacao-rls.md`)
para garantir isolamento eficiente sem joins adicionais.

**RN-06 — Sem formatação de texto**
O campo `content` armazena e exibe texto simples (plain text). Não há suporte a
Markdown, negrito, listas ou qualquer formatação. O textarea renderiza quebras de
linha como `\n` e as exibe corretamente na visualização.

**RN-07 — Sem restrição por plano**
No MVP, o prontuário está disponível para todos os planos (free e pro). Não há
limite de quantidade de prontuários por plano.

**RN-08 — Data do prontuário é a data da sessão**
O prontuário não tem campo de "data do prontuário" separado. A data exibida
é `appointments.scheduled_at` — a data da sessão à qual o prontuário está vinculado.
Os metadados `created_at` e `updated_at` de `session_notes` registram quando
o psicólogo criou e editou o registro, não quando a sessão aconteceu.

**RN-09 — Preview no histórico**
O preview exibido na listagem de histórico é gerado no momento da renderização
como os primeiros 150 caracteres do `content`. Não é armazenado no banco.
Quebras de linha no início do texto são ignoradas no preview.

**RN-10 — Acesso via perfil do paciente**
O histórico de prontuários de um paciente é acessível via `/patients/[patient_id]/notes`.
Apenas o psicólogo dono do paciente pode acessar essa rota. A consulta filtra
`session_notes` por `userId` do psicólogo autenticado E por `appointments.patient_id`
igual ao `patient_id` da rota.

---

## Casos de Erro

**CE-01 — Consulta não encontrada ou sem permissão**
Ao acessar `/notes/new?appointment=[id]` com um `appointment_id` inexistente
ou pertencente a outro psicólogo: retorna 404, sem revelar a existência do registro.

**CE-02 — Consulta com status inválido para prontuário**
Ao tentar criar prontuário para consulta com status diferente de `completed`:
o sistema exibe mensagem de erro inline "Prontuário só pode ser registrado para
sessões realizadas" e não exibe o formulário.

**CE-03 — Prontuário já existe para a consulta**
Ao acessar `/notes/new?appointment=[id]` quando já existe prontuário: o sistema
redireciona silenciosamente para `/notes/[note_id]` existente sem criar duplicata.

**CE-04 — Prontuário não encontrado ou sem permissão**
Ao acessar `/notes/[note_id]` com id inexistente ou pertencente a outro psicólogo:
retorna 404.

**CE-05 — Erro de servidor ao salvar**
Se a Server Action falhar ao criar ou editar o prontuário (ex: erro de banco):
o sistema exibe toast de erro "Não foi possível salvar o prontuário. Tente novamente."
e mantém o formulário preenchido para que o psicólogo não perca o conteúdo digitado.

---

## Dados e API

### Entidades utilizadas

- `session_notes` — criação, leitura, atualização e exclusão
- `appointments` — leitura para validar `status = completed` e exibir contexto
  da sessão (data, horário, modalidade)
- `patients` — leitura para exibir nome do paciente no contexto do prontuário
  e para a listagem de histórico por paciente

### Server Actions

| Ação | Arquivo sugerido | Descrição |
|---|---|---|
| `createSessionNote` | `features/notes/actions/createSessionNote.ts` | Cria prontuário. Valida que `appointment.status = completed`, que o appointment pertence ao psicólogo autenticado e que não existe nota prévia para o appointment. |
| `updateSessionNote` | `features/notes/actions/updateSessionNote.ts` | Edita `content` de um prontuário existente. Valida `userId`. Atualiza `updated_at`. |
| `deleteSessionNote` | `features/notes/actions/deleteSessionNote.ts` | Hard delete do prontuário. Valida `userId` antes de excluir. |

### Queries (Server Components)

| Query | Descrição |
|---|---|
| `getSessionNoteByAppointment(userId, appointmentId)` | Busca nota pelo `appointment_id` com validação de `userId`. Retorna `null` se não existir. |
| `getSessionNoteById(userId, noteId)` | Busca nota pelo `id` com validação de `userId`. |
| `getPatientSessionNotes(userId, patientId)` | Lista todos os prontuários de um paciente, com join em `appointments` para obter `scheduled_at`. Ordena por `scheduled_at DESC`. |

### Schemas Zod

```typescript
// features/notes/schema.ts

import { z } from "zod"

export const SessionNoteFormSchema = z.object({
  appointmentId: z.string().uuid("ID da consulta inválido"),
  content: z
    .string()
    .min(1, "O conteúdo do prontuário é obrigatório")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "O conteúdo do prontuário é obrigatório"),
})

export const UpdateSessionNoteSchema = z.object({
  noteId: z.string().uuid("ID do prontuário inválido"),
  content: z
    .string()
    .min(1, "O conteúdo do prontuário é obrigatório")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "O conteúdo do prontuário é obrigatório"),
})

export const DeleteSessionNoteSchema = z.object({
  noteId: z.string().uuid("ID do prontuário inválido"),
})
```

### Rotas Next.js (App Router)

| Rota | Tipo | Descrição |
|---|---|---|
| `/notes/new?appointment=[id]` | Page (Server Component) | Formulário de criação. Valida status da consulta e unicidade antes de exibir. |
| `/notes/[note_id]` | Page (Server Component) | Visualização do prontuário. Modo edição via estado de cliente. |
| `/patients/[patient_id]/notes` | Page (Server Component) | Histórico de prontuários do paciente em ordem cronológica. |

Todas as rotas ficam dentro do grupo `(auth)` protegido pelo middleware do NextAuth.

### Eventos disparados

Nenhum evento externo (webhook, e-mail, job) é disparado por esta feature.
Criação, edição e exclusão de prontuário são operações síncronas e locais.

---

## Fora do Escopo desta Feature

1. **Prontuário estruturado com campos clínicos** — campos como diagnóstico (CID-10),
   objetivos terapêuticos, técnicas utilizadas, escala de humor ou formato SOAP não
   fazem parte desta feature. O produto é prontuário simples por design. Ver seção
   "Fora do produto (nunca)" em `mvp-scope.md`.

2. **Busca no conteúdo dos prontuários** — pesquisa por palavras-chave dentro do
   texto das anotações não está inclusa nesta feature. A navegação é feita pelo
   histórico cronológico.

3. **Exportação ou impressão do prontuário** — gerar PDF, imprimir ou exportar
   os registros não está previsto nesta feature no MVP.

4. **Prontuário vinculado ao paciente sem consulta** — toda anotação é obrigatoriamente
   vinculada a uma consulta com `status = completed`. Não há notas avulsas de paciente
   sem sessão correspondente na agenda.

5. **Histórico de versões** — alterações no conteúdo do prontuário sobrescrevem o
   registro anterior. Não há versionamento de edições. O campo `updated_at` registra
   apenas quando foi a última edição.

6. **Compartilhamento de prontuário** — enviar ou compartilhar o prontuário com
   o próprio paciente ou com outro profissional não está previsto nesta feature.

---

## Dependências

**Pré-requisitos obrigatórios:**
- `autenticacao` — todas as rotas de prontuário estão dentro do grupo `(auth)`
  e requerem sessão autenticada via NextAuth.
- `cadastro-pacientes` — o histórico de prontuários por paciente requer que o
  paciente exista e pertença ao psicólogo autenticado.
- `agenda-consultas` — o prontuário só pode ser criado para consultas com
  `status = completed`. A feature de agenda é responsável pela transição de status.

**Features que dependem desta:**
- Nenhuma outra feature do MVP depende de `session_notes`.
