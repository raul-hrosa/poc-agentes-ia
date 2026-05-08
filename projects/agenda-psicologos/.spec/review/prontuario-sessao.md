# Review — prontuario-sessao

**Data:** 2026-05-07
**Revisor:** review-agent

---

## Resumo

A implementação do prontuário de sessão cobre todos os critérios de aceite EARS e regras de negócio da spec sem gaps relevantes. A estrutura de dados, as Server Actions, as queries e os componentes de UI aderem ao design especificado. Os testes cobrem fluxos principais e casos de erro.

**Status:** approved

---

## Issues por prioridade

### Blocker (impede aprovação)

Nenhum.

### Major (degradação significativa, não bloqueia se isolado)

Nenhum.

### Minor (melhoria, não bloqueia)

**MIN-01 — `createSessionNote` lança exceção em vez de retornar `{ error }` para consulta não encontrada (CE-01)**
Arquivo: `src/features/notes/actions/createSessionNote.ts` linha 21
O spec CE-01 diz que acessar `/notes/new?appointment=[id]` com appointment inexistente retorna 404. O 404 é tratado corretamente no Server Component `new/page.tsx`. A action, contudo, usa `throw new Error("Consulta não encontrada")` em vez de `return { error: "..." }`. No fluxo normal o Server Component impede que a action seja chamada nessa condição, mas se a action for chamada diretamente (ex: via API route ou teste de integração de ponta a ponta), a exceção vai se propagar e o componente vai exibir o toast genérico de CE-05 em vez de um erro específico. Isso é aceitável no MVP porque o fluxo de UI não permite esse caminho, mas alinha-se melhor ao padrão `NoteActionResult` retornar `{ error }`.

**MIN-02 — Rota histórico usa `[id]` em vez de `[patient_id]` no segmento dinâmico**
Arquivo: `src/app/(auth)/patients/[id]/notes/page.tsx`
A spec e as tasks definem a rota como `/patients/[patient_id]/notes`. A implementação usa o segmento `[id]` (consistente com as outras rotas do módulo `patients/`). Isso está documentado no ADR `patients-dynamic-segment-consistency.md`, portanto não é uma violação — apenas um desvio nominal do que a spec chama `patient_id` na URL de referência. Registrado para rastreabilidade.

---

## Cobertura de critérios de aceite

| Critério | Status | Observação |
|---|---|---|
| AC-01 — Botão "Registrar prontuário" em consulta completed sem nota | passou | `AppointmentDetails.tsx` linhas 215-233: renderiza link para `/notes/new?appointment=[id]` quando `!appointment.hasNote` |
| AC-02 — Botão "Ver prontuário" em consulta completed com nota | passou | `AppointmentDetails.tsx` linhas 218-224: renderiza link para `/notes/[noteId]` quando `appointment.hasNote && appointment.noteId` |
| AC-03 — Sem opção de prontuário para status != completed | passou | `isActive` (scheduled/confirmed) e `isTerminal` (cancelled/no_show) não exibem seção de prontuário |
| AC-04 — Formulário exibe contexto da consulta em /notes/new | passou | `SessionNoteForm.tsx`: nome do paciente, data por extenso, horário início-fim, modalidade exibidos como somente leitura |
| AC-05 — Criação redireciona para /notes/[note_id] com toast | passou | `SessionNoteForm.tsx` linhas 100-102: `toast.success("Prontuário registrado com sucesso")` + `router.push` |
| AC-06 — Erro "conteúdo obrigatório" ao submeter vazio | passou | `SessionNoteForm.tsx` função `validate()`: mensagem exata "O conteúdo do prontuário é obrigatório" |
| AC-07 — Redireciona para nota existente sem criar duplicata | passou | `new/page.tsx` linhas 51-53: `redirect(/notes/${existingNote.id})` antes de exibir formulário |
| AC-08 — Erro inline para consulta não completed | passou | `new/page.tsx` linhas 40-48: `<AppointmentNotCompletedError>` com mensagem exata |
| AC-09 — Botão desabilitado com loading durante submissão | passou | `SessionNoteForm.tsx` linhas 166-174: `disabled={isSubmitting}` + spinner animado |
| AC-10 — Visualização exibe nome, data, criação, última edição, conteúdo | passou | `SessionNoteView.tsx`: todos os campos exibidos com metadados `createdAtLabel` e `updatedAtLabel` |
| AC-11 — Botões "Editar" e "Excluir" visíveis na visualização | passou | `SessionNoteView.tsx` linhas 126-177: botão Editar no header, botão Excluir no rodapé |
| AC-12 — Modo edição pré-preenchido com content atual | passou | `SessionNoteForm.tsx` prop `note` popula `useState(note?.content ?? "")` |
| AC-13 — Salvar edição atualiza content e retorna para visualização com toast | passou | `SessionNoteForm.tsx` linhas 87-88: `toast.success("Prontuário atualizado")` + `onSave?.()` |
| AC-14 — Erro "conteúdo obrigatório" ao salvar edição vazia | passou | Mesma validação `validate()` — reutilizada em criação e edição |
| AC-15 — Cancelar edição descarta alterações sem modificar registro | passou | `SessionNoteView.tsx` linha 105: `onCancel={() => setIsEditing(false)}` — sem chamar action |
| AC-16 — Dialog de confirmação com texto exato ao clicar Excluir | passou | `SessionNoteView.tsx` linhas 199-205: título "Excluir prontuário?" e texto exato da spec |
| AC-17 — Confirmar exclusão: hard delete + redirect para consulta + toast | passou | `SessionNoteView.tsx` linhas 66-67: `toast.success("Prontuário excluído")` + `router.push(/appointments/${result.appointmentId})` |
| AC-18 — Cancelar dialog: fecha sem modificar | passou | `SessionNoteView.tsx` linha 210: `onClick={() => setDeleteDialogOpen(false)}` |
| AC-19 — Histórico ordenado por scheduled_at DESC, preview 150 chars | passou | `getPatientSessionNotes` ordena por `scheduledAt: "desc"`; `truncateNotePreview` limita a 150 chars |
| AC-20 — Estado vazio com mensagem orientativa exata | passou | `PatientNotesList.tsx` linhas 52-61: texto exato da spec |
| AC-21 — Clique em item navega para /notes/[note_id] | passou | `PatientNotesList.tsx` linha 85: `<Link href={/notes/${note.id}>` envolvendo o item completo |
| AC-22 — Queries retornam apenas registros do psicólogo autenticado | passou | Todas as queries incluem `userId` no `where`; actions chamam `getCurrentUser()` |
| AC-23 — Usuário não autenticado redirecionado para /login | passou | Middleware do NextAuth protege todas as rotas `(auth)/`; `getCurrentUser()` lança erro se sem sessão |
| AC-24 — Acesso a prontuário de outro psicólogo retorna 404 | passou | `getSessionNoteById` filtra por `userId`; `notFound()` chamado quando retorna null |
| AC-25 — Criar prontuário para consulta de outro psicólogo retorna 404 | passou | `new/page.tsx` busca appointment com `where: { id, userId: user.id }`; `notFound()` se null |

---

## Cobertura de regras de negócio

| Regra | Status | Observação |
|---|---|---|
| RN-01 — Prontuário só para consultas completed | passou | `createSessionNote.ts` linhas 25-29: validação server-side de `status !== "completed"` |
| RN-02 — Unicidade por appointment (UNIQUE constraint + verificação em código) | passou | Schema Prisma tem `@unique` em `appointmentId`; `createSessionNote` verifica existência antes de criar |
| RN-03 — Content obrigatório, não aceita strings de espaços | passou | Schema Zod com `.min(1).transform(trim).refine(length > 0)` em `SessionNoteFormSchema` e `UpdateSessionNoteSchema` |
| RN-04 — Hard delete sem soft delete | passou | `deleteSessionNote.ts`: `prisma.sessionNote.delete()` — sem `deletedAt` |
| RN-05 — Isolamento por psicólogo via userId | passou | Todas as queries e actions filtram por `userId` do psicólogo autenticado |
| RN-06 — Plain text sem formatação | passou | Campo `<textarea>` sem editor rich text; visualização com `whitespace-pre-wrap` preserva quebras de linha |
| RN-07 — Sem restrição por plano | passou | Nenhuma verificação de plano nas rotas de notes |
| RN-08 — Data do prontuário é a data da sessão (appointments.scheduled_at) | passou | Exibição usa `note.appointment.scheduledAt` — não há campo de data próprio |
| RN-09 — Preview gerado na renderização, 150 chars, ignora quebras no início | passou | `truncateNotePreview` em `shared/utils/format.ts`: `content.replace(/^\s+/, "")` + truncagem |
| RN-10 — Histórico filtra por userId E patientId | passou | `getPatientSessionNotes` usa `where: { userId, appointment: { patientId } }` |

---

## Definition of Done

| Item | Status | Observação |
|---|---|---|
| Todos os user stories implementados | passou | US-01 a US-09 cobertos: criação, edição, visualização, histórico, estado vazio, exclusão, erro de status |
| Critérios EARS cobertos e verificáveis | passou | AC-01 a AC-25 todos passaram |
| Nenhum blocker em aberto de tasks anteriores | passou | STATUS.md: nenhum blocker ativo |
| ADRs criados para decisões de implementação | passou | `notes-url-integration-appointmentdetails.md` e `patients-dynamic-segment-consistency.md` documentados |
| Testes para fluxo principal | passou | `actions.test.ts`: 4 cenários createSessionNote, 4 updateSessionNote, 4 deleteSessionNote |
| Testes para casos de erro | passou | Testes cobrem: appointment não encontrado, nota não encontrada, acesso a dado de outro usuário, Zod inválido, status inválido |
| Nenhum TODO ou placeholder restante | passou | Grep confirmou ausência de TODO/FIXME/HACK nos arquivos do módulo notes |
| Nenhum console.log no código de produção | passou | Grep confirmou ausência |
| Toda Server Action começa com getCurrentUser() | passou | Verificado em createSessionNote, updateSessionNote, deleteSessionNote |
| Inputs validados com Zod antes de operação de banco | passou | Todas as actions chamam `.parse(input)` antes de qualquer query |
| userId presente em todas as queries de banco | passou | Verificado nas 3 queries e nas 3 actions |
| Targets de toque >= 44px | passou | Classes `min-h-[44px]` em todos os botões e links interativos |

---

## Veredicto final

**approved**

A implementação está em conformidade com todos os critérios de aceite da spec, as regras de negócio e o Definition of Done. Os dois itens classificados como Minor (comportamento de exceção em createSessionNote para appointment não encontrado, e nomenclatura do segmento de rota) são rastreáveis e não causam degradação funcional no MVP.
