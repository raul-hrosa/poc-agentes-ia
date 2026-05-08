# Review — cadastro-pacientes

**Data:** 2026-05-01 (re-review após correções de BLK-01, BLK-02 e MAJ-01)
**Revisor:** review-agent
**Status:** approved

---

## Resumo

Re-review solicitado após correções de BLK-01, BLK-02 e MAJ-01 identificados no review anterior. As três correções foram verificadas e estão corretas. Nenhum novo blocker foi introduzido pelas correções. A feature está aprovada.

---

## Verificação das correções solicitadas

### BLK-01 — Acesso direto ao Prisma em `new/page.tsx` (RESOLVIDO)

`NewPatientPage` agora importa `getUserPlan` de `@/features/auth/queries/getUserPlan` e usa `Promise.all` para buscar em paralelo `countActivePatients` e `getUserPlan`. O Prisma não é mais importado diretamente no page component. O arquivo `getUserPlan.ts` encapsula corretamente a query via `@/shared/lib/prisma`, seguindo o padrão arquitetural do DoD. Resolvido.

### BLK-02 — Cast `as unknown as` em `PatientFormPage.tsx` (RESOLVIDO)

O cast `as unknown as import("react-hook-form").Resolver<PatientFormFields>` foi removido. O formulário agora é tipado com `type PatientFormValues = z.input<typeof PatientFormSchema>` (linha 26) e `useForm<PatientFormValues>` (linha 45), eliminando a incompatibilidade de tipos que exigia o cast duplo. O `zodResolver(PatientFormSchema)` é aceito sem cast. Resolvido.

Nota sobre cast residual (linha 75): `const payload = data as PatientFormInput` converte `z.input<>` para `z.infer<>`. Este não é um cast `as unknown as` — é uma conversão direta entre tipos compatíveis estruturalmente. Em runtime, o `zodResolver` já executou `parse` antes de invocar `onSubmit`, portanto `data.birthDate` já é `Date` neste ponto. O cast é tecnicamente correto e não constitui blocker. Registrado como warning abaixo.

### MAJ-01 — Threshold de busca (RESOLVIDO)

`PatientsPage.tsx` linha 57: `searchQuery.length >= 2`. O filtro agora só é aplicado com 2 ou mais caracteres, conforme AC-03. Resolvido.

---

## Issues

### BLOCKER

Nenhum.

---

### WARNING

**WARN-01 — Cast `data as PatientFormInput` em `onSubmit` (novo, menor que BLK-02)**
- Arquivo: `src/features/patients/components/PatientFormPage.tsx`, linha 75
- Descrição: `const payload = data as PatientFormInput` converte o tipo de entrada do formulário (`z.input<>`, onde `birthDate` é `string`) para o tipo de saída do schema (`z.infer<>`, onde `birthDate` é `Date`). O cast não usa `unknown` intermediário e não contorna verificação de tipos estruturalmente incompatíveis. Em runtime a conversão é correta (o `zodResolver` já coerceu os dados). O gap é que o tipo estático não reflete o estado real do valor após coerção. Não bloqueia.
- Como resolver (opcional): Usar `PatientFormSchema.parse(data)` explicitamente para obter o tipo `PatientFormInput` com inferência correta, eliminando o cast. Isso é uma melhoria de clareza, não de comportamento.

**WARN-02 — `getUserPlan` em `features/auth/queries/` pode retornar `"free"` como fallback silencioso**
- Arquivo: `src/features/auth/queries/getUserPlan.ts`, linha 9
- Descrição: Quando `prisma.user.findUnique` retorna `null` (usuário não encontrado), a função retorna `"free"` sem lançar erro. Isso significa que um userId inválido ou de usuário excluído será tratado como plano free em vez de gerar erro de autenticação. Na prática não é um vetor de problema porque `getCurrentUser()` já garante que o usuário existe antes de `getUserPlan` ser chamado, mas o comportamento silencioso pode mascarar bugs futuros.
- Como resolver (opcional): Lançar erro se `user` for `null`, ou documentar a decisão de retornar `"free"` como fallback seguro em um comentário no código.

**WARN-03 (mantido do review anterior) — MIN-01: Dupla navegação após arquivamento**
- Arquivo: `src/features/patients/components/ArchivePatientDialog.tsx` (linha 39) e `src/features/patients/components/PatientProfilePage.tsx` (linha 38)
- Descrição: `ArchivePatientDialog` chama `router.push("/patients")` internamente após o sucesso. O componente pai `PatientProfilePage` também define `handleArchived` que chama `router.push("/patients")`. Ambas as navegações são disparadas em sequência. Não quebra o fluxo visível, mas é padrão inconsistente.
- Como resolver (opcional): Remover `router.push("/patients")` de `ArchivePatientDialog` e delegar apenas ao callback `onArchived`.

**WARN-04 (mantido do review anterior) — MIN-02: Localização de arquivos de teste diverge de TASK-07**
- Arquivos: `src/features/patients/actions/__tests__/patientActions.test.ts` e `src/features/patients/queries/__tests__/queries.test.ts`
- Descrição: TASK-07 especificou paths sem subpasta `__tests__/`. Os testes existem e cobrem os cenários exigidos; a divergência é apenas de localização e nome.
- Como resolver (opcional): Renomear e mover os arquivos para os paths especificados na task.

---

### SUGGESTION

Nenhuma sugestão adicional.

---

## Critérios EARS verificados

| Critério | Status | Observação |
|----------|--------|------------|
| AC-01 — Lista pacientes ativos ordenados alfabeticamente com nome e telefone | OK | `getActivePatients` filtra `isActive=true, deletedAt=null`, ordena por `name ASC`. UI exibe nome e telefone formatado. |
| AC-02 — Estado vazio com mensagem e botão "Adicionar primeiro paciente" | OK | `PatientsPage.tsx` exibe estado vazio correto quando `currentList.length === 0 && !searchQuery`. |
| AC-03 — Busca filtra com ao menos 2 caracteres (case-insensitive) | OK | Corrigido: `searchQuery.length >= 2` na linha 57 de `PatientsPage.tsx`. |
| AC-04 — Limpar campo restaura lista completa | OK | Botão "x" chama `setSearchQuery("")`, o que retorna a lista sem filtro. |
| AC-05 — Mensagem "Nenhum paciente encontrado para [termo]" | OK | Exibida quando `currentList.length > 0 && filteredList.length === 0 && searchQuery`. |
| AC-06 — Criar paciente com redirect e toast de sucesso | OK | `createPatient` cria com `userId`, `isActive=true`, `deletedAt=null`. Toast "Paciente [nome] cadastrado com sucesso" implementado. |
| AC-07 — Rejeitar nome vazio com mensagem exata | OK | Schema rejeita com "Nome é obrigatório"; erro exibido inline com `aria-describedby`. |
| AC-08 — Rejeitar telefone vazio com mensagem exata | OK | Schema rejeita com "Telefone é obrigatório". |
| AC-09 — Rejeitar telefone com menos de 10 ou mais de 11 dígitos | OK | Regex `^\d{10,11}$` com mensagem "Telefone inválido. Use o formato 11999999999". |
| AC-10 — Rejeitar data de nascimento futura com mensagem exata | OK | `.max(new Date(), "Data de nascimento não pode ser uma data futura")`. |
| AC-11 — Alerta de limite de plano free com mensagem exata ao tentar cadastrar | OK | `createPatient` retorna erro com mensagem exata. Banner exibido em `PatientFormPage` quando `isAtLimit=true`. |
| AC-12 — Plano pro sem limite de pacientes | OK | `createPatient` só verifica limite quando `plan === "free"`. |
| AC-13 — Rejeitar apenas `emergencyContactName` sem `emergencyContactPhone` | OK | `.refine` com mensagem "Informe também o telefone do contato de emergência" no path `emergencyContactPhone`. |
| AC-14 — Rejeitar apenas `emergencyContactPhone` sem `emergencyContactName` | OK | `.refine` com mensagem "Informe também o nome do contato de emergência" no path `emergencyContactName`. |
| AC-15 — Botão submit desabilitado com spinner durante submissão | OK | `disabled={isSubmitting || isAtLimit}` com spinner condicional. |
| AC-16 — Formulário de edição pré-preenchido | OK | `defaultValues` populados a partir de `patient` quando `mode === "edit"`. |
| AC-17 — Atualização com toast "Dados de [nome] atualizados com sucesso" | OK | Implementado em `PatientFormPage` modo `edit`. |
| AC-18 — Edição aplica mesmas validações de cadastro | OK | `updatePatient` usa `PatientFormSchema.parse(input)` antes de atualizar. |
| AC-19 — Perfil exibe dados com idade calculada dinamicamente | OK | `PatientProfilePage` usa `calculateAge(birthDate)` e exibe "(N anos)" quando `birthDate !== null`. |
| AC-20 — Arquivamento define `isActive=false`, toast e desaparece da lista | OK | `archivePatient` atualiza `isActive=false`. Toast "Paciente arquivado. Você pode restaurá-lo a qualquer momento." implementado. |
| AC-21 — Aba Arquivados exibe apenas `isActive=false, deletedAt=null` ordenados | OK | `getArchivedPatients` filtra e ordena corretamente. |
| AC-22 — Restauração bem-sucedida com toast quando abaixo do limite | OK | `restorePatient` define `isActive=true`. Toast "Paciente reativado com sucesso" em `PatientsPage`. |
| AC-23 — Bloqueio de restauração quando plano free com 10 pacientes ativos | OK | `restorePatient` verifica limite antes de restaurar. |
| AC-24 — Isolamento: retorna apenas registros do userId autenticado | OK | Todas as queries e actions filtram por `userId: user.id`. |
| AC-25 — Não autenticado redireciona para /login | OK | Middleware protege rotas `(auth)`. `getCurrentUser()` lança erro se não autenticado. |
| AC-26 — Acesso a paciente de outro userId retorna 404 | OK | `getPatientById(userId, patientId)` retorna `null` quando userId não bate; page chama `notFound()`. |

---

## Regras de negócio verificadas

| Regra | Status | Observação |
|-------|--------|------------|
| RN-01 — Campos obrigatórios vs opcionais | OK | Schema e form implementam `name` e `phone` obrigatórios; demais opcionais. |
| RN-02 — Validação de telefone (somente dígitos, 10-11 dígitos) | OK | Regex `^\d{10,11}$` aplicado em `phone` e `emergencyContactPhone`. |
| RN-03 — Par de contato de emergência | OK | Dois `refine` no schema garantem que ambos devem estar preenchidos ou ambos vazios. |
| RN-04 — Limite de 10 pacientes no plano free | OK | `createPatient` e `restorePatient` consultam `countActivePatients` quando `plan === "free"`. |
| RN-05 — Soft delete | OK | `archivePatient` define apenas `isActive=false`, sem tocar `deletedAt`. |
| RN-06 — Isolamento por psicólogo | OK | Todas as queries incluem `where: { userId }`. |
| RN-07 — Sem unicidade de paciente entre psicólogos | OK | Nenhuma constraint de unicidade implementada. |
| RN-08 — Cálculo de idade dinâmico | OK | `calculateAge` em `format.ts`, chamado no momento de renderização. |
| RN-09 — Ordenação padrão por `name ASC` | OK | `orderBy: { name: "asc" }` em todas as queries de listagem. |
| RN-10 — Busca client-side por `name contains` | OK | `p.name.toLowerCase().includes(searchQuery.toLowerCase())` em `PatientsPage`. |

---

## DoD checklist — feature

- [x] Todos os user stories implementados (US-01 a US-11)
- [x] Todos os critérios EARS cobertos (26 critérios — todos OK após correções)
- [x] ADRs criados para decisões tomadas: `patient-actions-user-plan.md` documenta a busca de plano via query encapsulada
- [x] Nenhum TODO ou placeholder restante nos arquivos de produção
- [x] Testes para fluxo principal e casos de erro existem (actions e queries cobertos)
- [x] Sem `console.log` em código de produção
- [x] Sem cast `as unknown as` em código de produção (BLK-02 resolvido)
- [x] Sem acesso direto ao Prisma em page components (BLK-01 resolvido)

---

## Fora do escopo — verificação

Os itens explicitamente fora do escopo (importação em lote, exclusão permanente, foto de paciente, histórico de consultas no perfil, prontuário no perfil, compartilhamento entre psicólogos) não foram implementados. Nenhum over-engineering detectado.

---

## Conclusão

Feature aprovada. Zero blockers. Todos os critérios EARS passaram. As três correções solicitadas (BLK-01, BLK-02 e MAJ-01) foram implementadas corretamente sem introduzir novos blockers.

Warnings registrados (4): WARN-01 e WARN-02 são novos (menores); WARN-03 e WARN-04 mantidos do review anterior. Nenhum impede a aprovação.
