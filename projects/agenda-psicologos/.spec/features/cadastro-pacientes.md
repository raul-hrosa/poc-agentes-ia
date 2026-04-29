# Feature: Cadastro de Pacientes

**Slug:** `cadastro-pacientes`
**Prioridade:** must-have
**Fase:** 2 — Specs
**Criada em:** 2026-04-27
**Status:** aguardando aprovação

---

## Contexto

Pacientes são a entidade central do PsiAgenda. Sem uma lista de pacientes não
existe agenda. Esta feature cobre o ciclo completo de gerenciamento de pacientes:
cadastro, edição, arquivamento e busca. É o pré-requisito para todas as outras
features do MVP.

---

## User Stories

### Fluxo principal — cadastro

**US-01**
Como psicólogo autenticado,
quero cadastrar um novo paciente informando nome e telefone (WhatsApp),
para ter esse paciente disponível para agendamento de consultas.

**US-02**
Como psicólogo autenticado,
quero informar a data de nascimento do paciente durante o cadastro,
para calcular a idade e ter esse dado no histórico clínico quando necessário.

**US-03**
Como psicólogo autenticado,
quero informar nome e telefone de um contato de emergência do paciente,
para ter uma referência de contato disponível em situações críticas.

**US-04**
Como psicólogo autenticado,
quero adicionar observações gerais sobre o paciente (campo de texto livre),
para registrar informações contextuais que não são prontuário de sessão.

### Fluxo principal — listagem e busca

**US-05**
Como psicólogo autenticado,
quero ver a lista de todos os meus pacientes ativos em ordem alfabética,
para localizar rapidamente qualquer paciente sem precisar lembrar o ID.

**US-06**
Como psicólogo autenticado,
quero buscar pacientes pelo nome,
para encontrar um paciente específico sem percorrer toda a lista.

### Fluxo principal — edição

**US-07**
Como psicólogo autenticado,
quero editar os dados de um paciente já cadastrado,
para corrigir informações ou adicionar dados que não foram preenchidos no cadastro.

### Fluxo principal — arquivamento

**US-08**
Como psicólogo autenticado,
quero arquivar um paciente que não está mais em atendimento,
para manter minha lista ativa limpa sem perder o histórico de consultas e prontuário.

**US-09**
Como psicólogo autenticado,
quero visualizar e restaurar pacientes arquivados,
para reativar um paciente que retornou para atendimento.

### Estado vazio

**US-10**
Como psicólogo que acabou de criar sua conta,
quero ver uma mensagem orientativa quando acesso a lista de pacientes ainda vazia,
para entender como começar a usar o sistema sem precisar de suporte.

### Limite do plano free

**US-11**
Como psicólogo no plano free com 10 pacientes ativos,
quero ser informado de que atingi o limite do plano ao tentar cadastrar um novo paciente,
para entender que preciso arquivar um paciente ou fazer upgrade para continuar.

---

## Critérios de Aceite

### Listagem de pacientes

**AC-01**
WHEN o psicólogo autenticado acessa `/patients`
THEN o sistema exibe a lista de pacientes ativos (`is_active = true` e `deleted_at IS NULL`)
     ordenados alfabeticamente por `name`, com nome e telefone visíveis em cada item.

**AC-02**
WHEN não há pacientes cadastrados
THEN o sistema exibe mensagem "Nenhum paciente cadastrado ainda" e um botão
     "Adicionar primeiro paciente" que abre o formulário de cadastro.

**AC-03**
WHEN o psicólogo digita ao menos 2 caracteres no campo de busca
THEN o sistema filtra a lista em tempo real exibindo apenas pacientes cujo `name`
     contém a string digitada (busca case-insensitive).

**AC-04**
WHEN o psicólogo limpa o campo de busca
THEN o sistema restaura a lista completa de pacientes ativos.

**AC-05**
WHILE buscando pacientes
WHEN nenhum paciente corresponde ao termo digitado
THEN o sistema exibe "Nenhum paciente encontrado para [termo]".

### Cadastro de paciente

**AC-06**
WHEN o psicólogo submete o formulário com `name` (preenchido) e `phone` (preenchido)
THEN o sistema cria o registro na tabela `patients` com `userId` do psicólogo autenticado,
     `is_active = true`, `deleted_at = null`, e redireciona para a lista de pacientes
     com toast de sucesso "Paciente [nome] cadastrado com sucesso".

**AC-07**
WHEN o psicólogo tenta submeter o formulário sem preencher o campo `name`
THEN o sistema exibe "Nome é obrigatório" abaixo do campo e não submete o formulário.

**AC-08**
WHEN o psicólogo tenta submeter o formulário sem preencher o campo `phone`
THEN o sistema exibe "Telefone é obrigatório" abaixo do campo e não submete o formulário.

**AC-09**
WHEN o psicólogo preenche `phone` com valor que não é um número de telefone válido
     (menos de 10 dígitos ou mais de 11 dígitos considerando apenas os dígitos)
THEN o sistema exibe "Telefone inválido. Use o formato 11999999999" abaixo do campo.

**AC-10**
WHEN o psicólogo preenche `birth_date` com uma data futura
THEN o sistema exibe "Data de nascimento não pode ser uma data futura" abaixo do campo.

**AC-11**
WHEN o psicólogo está no plano free e já possui 10 pacientes com `is_active = true`
     e `deleted_at IS NULL` e tenta submeter o formulário
THEN o sistema exibe o alerta "Você atingiu o limite de 10 pacientes no plano grátis.
     Arquive um paciente ou faça upgrade para o plano Pro." e não cria o paciente.

**AC-12**
WHEN o psicólogo está no plano pro
THEN o sistema não aplica limite de quantidade de pacientes ativos.

**AC-13**
WHEN o psicólogo preenche apenas `emergency_contact_name` sem `emergency_contact_phone`
THEN o sistema exibe "Informe também o telefone do contato de emergência" abaixo do campo
     de telefone de emergência e não submete o formulário.

**AC-14**
WHEN o psicólogo preenche apenas `emergency_contact_phone` sem `emergency_contact_name`
THEN o sistema exibe "Informe também o nome do contato de emergência" abaixo do campo
     de nome de emergência e não submete o formulário.

**AC-15**
WHILE o formulário está sendo submetido
THEN o sistema desabilita o botão de submit e exibe indicador de loading para prevenir
     duplo envio.

### Edição de paciente

**AC-16**
WHEN o psicólogo acessa a edição de um paciente
THEN o sistema exibe o formulário pré-preenchido com os dados atuais do paciente.

**AC-17**
WHEN o psicólogo submete o formulário de edição com dados válidos
THEN o sistema atualiza o registro em `patients`, atualiza `updated_at`,
     e exibe toast "Dados de [nome] atualizados com sucesso".

**AC-18**
WHEN o psicólogo tenta remover o `name` ou o `phone` ao editar
THEN o sistema aplica as mesmas validações do cadastro e não salva o registro.

### Perfil do paciente

**AC-19**
WHEN o psicólogo acessa o perfil de um paciente
THEN o sistema exibe nome, telefone (WhatsApp), data de nascimento (se preenchida),
     contato de emergência (se preenchido), observações gerais (se preenchidas)
     e a idade calculada dinamicamente a partir de `birth_date` (se preenchida).

### Arquivamento e restauração

**AC-20**
WHEN o psicólogo confirma o arquivamento de um paciente
THEN o sistema define `is_active = false` no registro, o paciente some da lista ativa,
     e o sistema exibe toast "Paciente arquivado. Você pode restaurá-lo a qualquer momento.".

**AC-21**
WHEN o psicólogo acessa a aba "Arquivados"
THEN o sistema exibe apenas pacientes com `is_active = false` e `deleted_at IS NULL`,
     ordenados alfabeticamente por `name`.

**AC-22**
WHEN o psicólogo confirma a restauração de um paciente arquivado
     E o psicólogo está no plano free com menos de 10 pacientes ativos
THEN o sistema define `is_active = true` no registro e exibe toast
     "Paciente reativado com sucesso".

**AC-23**
WHEN o psicólogo tenta restaurar um paciente arquivado
     E o psicólogo está no plano free e já possui 10 pacientes ativos
THEN o sistema exibe alerta "Limite de pacientes atingido. Arquive outro paciente
     ou faça upgrade para o plano Pro." e não reativa o paciente.

### Autorização e isolamento

**AC-24**
WHEN o psicólogo autenticado acessa qualquer rota de `/patients`
THEN o sistema retorna apenas registros onde `patients.userId = id do psicólogo autenticado`.

**AC-25**
WHEN um usuário não autenticado tenta acessar qualquer rota de `/patients`
THEN o sistema redireciona para `/login`.

**AC-26**
WHEN o psicólogo tenta acessar o perfil ou editar um paciente cujo `userId`
     não corresponde ao seu `id`
THEN o sistema retorna erro 404 (não expõe que o paciente existe e pertence a outro usuário).

---

## Wireframe Textual

### Tela 1 — Lista de Pacientes (`/patients`)

```
+--------------------------------------------------+
| PsiAgenda                          [Avatar] [Menu]|
+--------------------------------------------------+
| Pacientes                      [+ Novo Paciente] |
+--------------------------------------------------+
| [Buscar pacientes...                     ] [x]   |
|                                                  |
| Ativos (12)    Arquivados (3)                    |
|--------------------------------------------------|
| A                                                |
|  Ana Beatriz Costa              (11) 99999-0001  |
|  André Ferreira                 (11) 98888-0002  |
| B                                                |
|  Bruno Martins                  (11) 97777-0003  |
| ...                                              |
|                                                  |
+--------------------------------------------------+
```

**Elementos:**
- Header com nome do app, avatar do usuário e menu de navegação
- Título da seção com botão "Novo Paciente" (fixo, sempre visível)
- Campo de busca com botão de limpar (x) que aparece quando há texto
- Abas: "Ativos (n)" selecionada por padrão e "Arquivados (n)"
- Lista agrupada por letra inicial do nome (separadores alfabéticos)
- Cada item mostra: nome completo e telefone formatado
- Toque no item navega para o perfil do paciente
- Em mobile: lista ocupa toda a largura, sem colunas laterais

**Estado vazio (nenhum paciente ativo):**
```
+--------------------------------------------------+
|                                                  |
|      [icone de pessoa]                           |
|      Nenhum paciente cadastrado ainda            |
|      Adicione seu primeiro paciente para         |
|      começar a usar o PsiAgenda.                 |
|                                                  |
|             [Adicionar primeiro paciente]        |
|                                                  |
+--------------------------------------------------+
```

**Estado vazio (busca sem resultado):**
```
|  Nenhum paciente encontrado para "Joao"          |
|  Verifique a grafia ou cadastre um novo paciente.|
```

---

### Tela 2 — Formulário de Cadastro / Edição (`/patients/new` e `/patients/[id]/edit`)

```
+--------------------------------------------------+
| [<- Voltar]  Novo Paciente                       |
+--------------------------------------------------+
|                                                  |
| Dados do paciente                                |
|                                                  |
| Nome *                                           |
| [                                        ]       |
|                                                  |
| Telefone (WhatsApp) *                            |
| [                                        ]       |
| Formato: 11999999999 (somente números)           |
|                                                  |
| Data de nascimento                               |
| [  DD/MM/AAAA                            ]       |
|                                                  |
| Observações gerais                               |
| [                                                |
|                                                  |
|                                          ]       |
|                                                  |
| Contato de emergência                            |
|                                                  |
| Nome do contato                                  |
| [                                        ]       |
|                                                  |
| Telefone do contato                              |
| [                                        ]       |
|                                                  |
|             [Cancelar]   [Salvar paciente]       |
|                                                  |
+--------------------------------------------------+
```

**Elementos:**
- Botão voltar no header com label da tela
- Seção "Dados do paciente" com campos Nome (*obrigatório) e Telefone (*obrigatório)
- Hint de formato abaixo do campo Telefone
- Data de nascimento: input com máscara DD/MM/AAAA, opcional
- Observações gerais: textarea, opcional, sem limite de caracteres
- Seção "Contato de emergência" colapsada em estado inicial — expandida ao preencher
- Campos Nome e Telefone do contato de emergência, opcionais mas vinculados entre si
- Botão Cancelar (retorna sem salvar) e Salvar (submit)
- Botão Salvar desabilitado durante submissão com spinner

**Estados de validação:**
```
| Nome *                                           |
| [                                        ]       |
| * Nome é obrigatório                             |
```

**Banner de limite de plano (exibido no topo do formulário):**
```
+--------------------------------------------------+
| [!] Você atingiu o limite de 10 pacientes no     |
|     plano grátis. Arquive um paciente ou faça    |
|     upgrade para o plano Pro.       [Fazer upgrade]|
+--------------------------------------------------+
```

---

### Tela 3 — Perfil do Paciente (`/patients/[id]`)

```
+--------------------------------------------------+
| [<- Pacientes]  Ana Beatriz Costa  [Editar]      |
+--------------------------------------------------+
|                                                  |
| Dados pessoais                                   |
|--------------------------------------------------|
| Telefone (WhatsApp)    (11) 99999-0001           |
| Data de nascimento     15/03/1990 (34 anos)      |
|                                                  |
| Contato de emergência                            |
|--------------------------------------------------|
| Nome                   Carlos Costa             |
| Telefone               (11) 98888-0002          |
|                                                  |
| Observações gerais                               |
|--------------------------------------------------|
| Encaminhada por Dr. Lima. Prefere sessões        |
| pela manhã.                                      |
|                                                  |
| Consultas                                        |
|--------------------------------------------------|
| [Ver consultas deste paciente ->]                |
|                                                  |
| ............................................     |
| [Arquivar paciente]                              |
+--------------------------------------------------+
```

**Elementos:**
- Header com botão voltar para lista, nome do paciente e botão Editar
- Seção "Dados pessoais": telefone formatado com máscara, data de nascimento com idade calculada
- Campos opcionais não preenchidos: não são exibidos (não mostrar "—" ou vazio)
- Seção "Contato de emergência": exibida apenas se `emergency_contact_name` ou
  `emergency_contact_phone` estiver preenchido
- Seção "Observações gerais": exibida apenas se `notes` estiver preenchido
- Link "Ver consultas deste paciente" que leva para `/appointments?patient=[id]`
  (filtrado por paciente — funcionalidade da feature Agenda)
- Botão "Arquivar paciente" no rodapé, com confirmação via Dialog antes de executar

**Dialog de confirmação de arquivamento:**
```
+----------------------------------+
| Arquivar paciente?               |
|                                  |
| Ana Beatriz Costa será removida  |
| da sua lista ativa. O histórico  |
| de consultas e prontuário será   |
| preservado.                      |
|                                  |
| [Cancelar]   [Sim, arquivar]     |
+----------------------------------+
```

---

### Tela 4 — Pacientes Arquivados (aba na `/patients`)

```
+--------------------------------------------------+
| Ativos (12)    Arquivados (3)                    |
|--------------------------------------------------|
| C                                                |
|  Carla Dias                     (11) 96666-0005  |
|  [Restaurar]                                     |
| ...                                              |
+--------------------------------------------------+
```

**Elementos:**
- Mesma estrutura da lista ativa
- Cada item exibe botão "Restaurar" (ação inline)
- Restaurar mostra Dialog de confirmação antes de executar
- Ao restaurar com sucesso, paciente some da lista arquivada e toast confirma

---

## Regras de Negócio

**RN-01 — Campos obrigatórios vs. opcionais**
- Obrigatórios: `name`, `phone`
- Opcionais: `birth_date`, `emergency_contact_name`, `emergency_contact_phone`, `notes`

**RN-02 — Validação de telefone**
O campo `phone` e `emergency_contact_phone` aceitam somente dígitos.
Valor mínimo: 10 dígitos (DDD + 8 dígitos). Valor máximo: 11 dígitos (DDD + 9 dígitos).
Máscaras e hífens são removidos antes de persistir — o banco armazena somente dígitos.

**RN-03 — Vínculo entre campos de contato de emergência**
`emergency_contact_name` e `emergency_contact_phone` são um par: ambos devem estar
preenchidos ou ambos devem estar vazios. Preencher apenas um bloqueia o submit.

**RN-04 — Limite de pacientes no plano free**
Um psicólogo no plano `free` pode ter no máximo 10 pacientes com `is_active = true`
e `deleted_at IS NULL` simultaneamente. A contagem é feita na Server Action antes de
inserir ou reativar. Pacientes arquivados (`is_active = false`) não contam para o limite.
Psicólogos no plano `pro` não têm limite.

**RN-05 — Soft delete**
Pacientes nunca são excluídos permanentemente pelo psicólogo via esta feature.
O arquivamento define `is_active = false`. O campo `deleted_at` é reservado para
remoção administrativa ou exclusão de conta (LGPD).

**RN-06 — Isolamento por psicólogo**
Todo acesso à tabela `patients` inclui obrigatoriamente `where: { userId: session.user.id }`.
Um psicólogo nunca enxerga pacientes de outro psicólogo, mesmo que ambos tenham cadastrado
pacientes com o mesmo nome e telefone.

**RN-07 — Ausência de unicidade de paciente entre psicólogos**
Não existe constraint de unicidade de nome ou telefone entre psicólogos distintos.
Dentro do mesmo psicólogo, não há constraint de unicidade — o mesmo nome pode ser cadastrado
duas vezes (ex: dois pacientes distintos com o mesmo nome).

**RN-08 — Cálculo de idade**
A idade exibida no perfil é calculada dinamicamente no momento da renderização,
a partir de `birth_date` e da data atual. Não é armazenada no banco.

**RN-09 — Ordenação padrão**
A listagem de pacientes (ativos e arquivados) é sempre ordenada por `name ASC` (alfabética).
Não há opção de reordenação pelo usuário nesta feature.

**RN-10 — Busca**
A busca filtra por `name` usando `contains` (SQL LIKE `%termo%`), case-insensitive.
A busca é local (client-side) quando a lista cabe em memória; para mais de 100 pacientes,
a busca é server-side com debounce de 300ms.

---

## Dados e API

### Entidade utilizada

- `patients` — criação, leitura, atualização e arquivamento

### Server Actions

| Ação | Arquivo sugerido | Descrição |
|---|---|---|
| `createPatient` | `app/(auth)/patients/actions.ts` | Cria paciente. Valida limite do plano free antes de inserir. |
| `updatePatient` | `app/(auth)/patients/actions.ts` | Atualiza dados do paciente. Valida que `userId` bate com sessão. |
| `archivePatient` | `app/(auth)/patients/actions.ts` | Define `is_active = false`. |
| `restorePatient` | `app/(auth)/patients/actions.ts` | Define `is_active = true`. Valida limite do plano free. |

### Queries (Server Components)

| Query | Descrição |
|---|---|
| `getActivePatients(userId)` | Lista `is_active = true`, `deleted_at = null`, order by `name ASC` |
| `getArchivedPatients(userId)` | Lista `is_active = false`, `deleted_at = null`, order by `name ASC` |
| `getPatientById(userId, patientId)` | Busca por id com validação de `userId` |
| `countActivePatients(userId)` | Conta pacientes ativos para validação de limite |

### Schemas Zod

```typescript
// lib/validations/patient.ts

const PatientFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .regex(/^\d{10,11}$/, "Telefone inválido. Use o formato 11999999999"),
  birthDate: z.coerce.date().max(new Date(), "Data de nascimento não pode ser futura").optional().nullable(),
  emergencyContactName: z.string().max(255).optional().nullable(),
  emergencyContactPhone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido. Use o formato 11999999999")
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    const hasName = !!data.emergencyContactName?.trim()
    const hasPhone = !!data.emergencyContactPhone?.trim()
    return hasName === hasPhone
  },
  {
    message: "Preencha nome e telefone do contato de emergência ou deixe ambos vazios",
    path: ["emergencyContactPhone"],
  }
)
```

### Rotas Next.js (App Router)

| Rota | Tipo | Descrição |
|---|---|---|
| `/patients` | Page (Server Component) | Lista de pacientes ativos + aba arquivados |
| `/patients/new` | Page (Server Component) | Formulário de cadastro |
| `/patients/[id]` | Page (Server Component) | Perfil do paciente |
| `/patients/[id]/edit` | Page (Server Component) | Formulário de edição pré-preenchido |

Todas as rotas ficam dentro do grupo `(auth)` protegido pelo middleware do NextAuth.

### Eventos disparados

Nenhum evento externo (webhook, e-mail, job) é disparado por esta feature.
O cadastro de paciente é uma operação síncrona e local.

---

## Fora do Escopo desta Feature

1. **Importação em lote de pacientes** — importar lista de pacientes via CSV ou planilha
   não faz parte desta feature. Cada paciente é cadastrado individualmente.

2. **Exclusão permanente de paciente** — o psicólogo não pode deletar um paciente
   permanentemente por esta interface. Apenas arquivamento (`is_active = false`) está disponível.
   Exclusão definitiva, se necessária para LGPD, é operação administrativa fora do MVP.

3. **Foto ou avatar do paciente** — upload de imagem de perfil do paciente não está incluso.

4. **Histórico de consultas no perfil** — a seção "Consultas" no perfil do paciente exibe apenas
   um link para a agenda filtrada. Renderização da lista de consultas é responsabilidade
   da feature "Agenda de consultas".

5. **Prontuário no perfil do paciente** — notas de sessão são vinculadas a consultas,
   não diretamente ao paciente. Acesso ao prontuário é responsabilidade da feature
   "Prontuário simplificado por sessão".

6. **Compartilhamento de paciente entre psicólogos** — o modelo de dados não suporta
   e o produto não prevê paciente acessível por mais de um psicólogo.

---

## Dependências

- Nenhuma feature do MVP precisa estar implementada antes desta.
- Esta feature é pré-requisito para: Agenda de consultas, Prontuário simplificado,
  Controle financeiro e Lembretes automáticos.
