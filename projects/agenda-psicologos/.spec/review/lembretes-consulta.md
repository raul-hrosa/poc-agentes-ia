# Review — lembretes-consulta

**Data:** 2026-05-03
**Reviewer:** review-agent
**Status:** approved

---

## Resumo

A feature `lembretes-consulta` foi implementada cobrindo todos os 23 critérios de aceite da spec. O fluxo completo — geração de token HMAC-SHA256, invalidação de token anterior, exibição de status no painel do psicólogo, envio de e-mail via Resend, e página pública de confirmação com validação de token em ordem correta — está funcional e conforme especificado.

A cobertura de testes é abrangente: 4 arquivos de teste cobrem actions (generateReminderToken, sendReminderEmail), queries (getLatestReminderForAppointment, getTokenForConfirmPage), API Route (POST /api/confirm/[token]) e 6 fluxos de integração incluindo casos de erro e autorização. Nenhum blocker encontrado.

---

## Issues

### Blockers (impedem aprovação)

Nenhum.

---

### Majors (devem ser corrigidos antes do deploy)

Nenhum.

---

### Minors (sugestões)

**MIN-01 — Prop `appointmentStatus` declarada mas não utilizada em `ReminderSectionClient`**

Arquivo: `src/features/reminders/components/ReminderSectionClient.tsx` linha 13–25

A interface `ReminderSectionClientProps` declara `appointmentStatus: string`, mas a desestruturação do componente omite esse campo. A prop é passada pelo `ReminderSection.tsx` mas nunca lida dentro do componente — o comportamento de consulta terminal é controlado pela prop `isTerminal`. Remover a declaração de `appointmentStatus` da interface e do ponto de chamada limpa o contrato da API do componente.

**MIN-02 — Campo `action` em `ConfirmPageData` sempre retorna `null`**

Arquivo: `src/features/reminders/queries/getTokenForConfirmPage.ts` linha 56

A query retorna `action: null` fixo para tokens válidos. O campo existe no tipo `ConfirmPageData` mas nunca é populado com um valor real — o `preselectedAction` na página vem de `searchParams.action`, não deste campo. Se o campo não tem uso atual, removê-lo evita confusão futura sobre sua semântica.

---

## Critérios de aceite verificados

| Critério | Status | Observação |
|----------|--------|------------|
| AC-01 — Geração de token HMAC-SHA256, registro em appointment_tokens | ✅ | `tokens.ts` + `generateReminderToken.ts`: payload correto, 72h, used_at/action nulos por default de schema |
| AC-02 — Link somente leitura com botão "Copiar link" / "Copiado!" 2s | ✅ | `ReminderSectionClient.tsx`: implementado com `setCopyLabel` e `setTimeout` |
| AC-03 — Reenvio invalida token ativo anterior | ✅ | `updateMany({ where: { usedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } })` |
| AC-04 — Status terminal bloqueia geração de lembrete | ✅ | Check no `generateReminderToken`; `isTerminal` oculta botões no componente |
| AC-05 — Envio de e-mail via Resend com dados completos | ✅ | `sendReminderEmail.ts`: from, subject, dados da consulta, links de confirmação/cancelamento |
| AC-06 — Botão "Enviar por e-mail" oculto sem e-mail cadastrado | ✅ | Renderização condicional `{patientEmail !== null && ...}` |
| AC-07 — Toast de erro quando Resend falha | ✅ | Erro capturado no `handleSendEmail`, exibe `toast.error` com mensagem correta |
| AC-08 — Botão desabilitado e loading durante envio | ✅ | `disabled={isPendingSendEmail}` + texto "Enviando..." |
| AC-09 — Seção Lembrete exibe data de geração e status atual | ✅ | Estado "pending" mostra data `createdAt` e texto de status |
| AC-10 — Estado vazio exibe "Nenhum lembrete enviado" e botão Gerar | ✅ | Branch `if (!latestReminder)` no componente |
| AC-11 — Consulta `status=confirmed` mostra confirmação com data/hora | ✅ | Branch `latestReminder.status === "confirmed"` com `usedAt` formatado |
| AC-12 — Consulta cancelada via link mostra cancelamento com data/hora | ✅ | Branch `latestReminder.status === "cancelled"` com `usedAt` formatado |
| AC-13 — Página pública exibe dados corretos para token válido | ✅ | `getTokenForConfirmPage` valida e retorna dados; `ConfirmPage` renderiza `ConfirmPageClient` |
| AC-14 — Confirmação atualiza appointment e token atomicamente | ✅ | `prisma.$transaction([appointment.update, appointmentToken.update])` |
| AC-15 — Tela intermediária antes do cancelamento | ✅ | `ConfirmPageClient` transita para `screen: "cancel-confirm"` com dados e botões Voltar/Confirmar |
| AC-16 — Cancelamento atualiza appointment e token atomicamente | ✅ | Mesmo `$transaction` com `status: "cancelled"` |
| AC-17 — Token expirado retorna página de erro "Este link expirou." | ✅ | `getTokenForConfirmPage` retorna `{ reason: "expired" }`; `ConfirmPage` renderiza `ErrorCard` |
| AC-18 — Token usado retorna "Este link já foi utilizado." + ação | ✅ | Retorna `{ reason: "used", action }` com mensagem específica por ação |
| AC-19 — Token inexistente retorna "Link inválido." sem vazar dados | ✅ | Retorna `{ reason: "not_found" }`; mensagem não expõe existência de outros tokens |
| AC-20 — Consulta em status terminal retorna página informativa | ✅ | `appointment_closed` renderiza "Esta consulta não está mais disponível para confirmação." |
| AC-21 — Psicólogo não pode gerar lembrete de consulta de outro usuário | ✅ | `findFirst({ where: { id, userId: user.id } })` retorna null → erro 404-equivalente |
| AC-22 — Usuário não autenticado recebe erro 401 na Server Action | ✅ | `getCurrentUser()` lança antes de qualquer operação; coberto em testes |
| AC-23 — Rota pública sem autenticação | ✅ | `src/app/confirm/[token]/page.tsx` fora de `(auth)`; API Route sem verificação de sessão |

---

## Regras de negócio verificadas

| Regra | Status | Observação |
|-------|--------|------------|
| RN-01 — HMAC-SHA256 com APP_SECRET e payload correto | ✅ | `createHmac("sha256", APP_SECRET).update(payload).digest("hex")` |
| RN-02 — Expiração de 72 horas | ✅ | `new Date(Date.now() + 72 * 60 * 60 * 1000)` |
| RN-03 — Uso único do token | ✅ | `usedAt` e `action` preenchidos atomicamente; verificado antes de executar |
| RN-04 — Invalidação do token anterior ao reenviar | ✅ | `updateMany` com filtro `usedAt: null, expiresAt: { gt: now }` |
| RN-05 — Apenas dono da consulta pode gerar lembrete | ✅ | Filtro `userId` em todas as queries e actions |
| RN-06 — Lembrete somente para scheduled/confirmed | ✅ | Check explícito na action |
| RN-07 — Sem limite de reenvios | ✅ | Nenhum contador implementado |
| RN-08 — Transição de status atomicamente | ✅ | `$transaction` com dois updates |
| RN-09 — Ordem de validação: exists > expired > used > status | ✅ | Ordem exata em `getTokenForConfirmPage` e na API Route |
| RN-10 — Rota pública fora do grupo (auth) | ✅ | Estrutura de pastas confirma isolamento |
| RN-11 — E-mail transacional via Resend | ✅ | `from: "PsiAgenda <lembretes@psiagenda.com.br>"` |
| RN-12 — Campo email adicionado a patients como opcional | ✅ | `email String? @db.VarChar(255)` no schema Prisma |

---

## Verificacao DoD

- Todos os user stories implementados: sim (US-01 a US-10 cobertos)
- Cobertura de testes para fluxo principal e casos de erro: sim (4 arquivos, 6 fluxos de integração)
- ADR criado para decisão de tokens: sim (`ADR/token-confirmacao.md` listado no STATUS.md)
- Nenhum TODO ou placeholder: confirmado
- Sem `console.log` no codigo de producao: confirmado
- Sem `any` implicito identificado nas implementacoes revisadas: confirmado
- Prop nao utilizada (`appointmentStatus`) identificada como minor — nao bloqueia

---

## Conclusao

**Aprovado.** Todos os 23 critérios de aceite e 12 regras de negócio foram verificados e estão conformes à spec. Nenhum blocker encontrado. Os 2 issues classificados como minors não afetam o comportamento especificado e podem ser endereçados em task de limpeza futura.
