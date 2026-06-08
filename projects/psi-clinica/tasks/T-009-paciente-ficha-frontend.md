# T-009 — Frontend Ficha do Paciente (abas: Resumo, Sessões, Financeiro)

**Épico**: [Épico 1 — Pacientes](../epics/epic-1-pacientes.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar a página `(dashboard)/patients/[id]/` com layout de ficha individual usando `Tabs` do shadcn/ui. Aba **Resumo**: dados do paciente editável inline, tags, contato de emergência, arquivar paciente. Aba **Sessões**: lista das sessões do paciente com status e datas. Aba **Financeiro**: saldo devedor e histórico de pagamentos do paciente. Header da ficha com avatar, nome, status e acesso rápido a "Nova sessão" e "Enviar mensagem".

## Critérios de aceite

- [ ] Cabeçalho exibe avatar, nome completo, status (badge colorido), CRP se informado
- [ ] Aba Resumo exibe e permite editar dados do paciente; botão "Arquivar" com confirmação
- [ ] Aba Sessões lista todas as sessões ordenadas por data (mais recente primeiro) com status colorido
- [ ] Aba Financeiro exibe saldo devedor destacado e lista de pagamentos
- [ ] Navegação direta da sessão para o prontuário da sessão
- [ ] Breadcrumb: Pacientes > [Nome do paciente]

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/(dashboard)/patients/[id]/page.tsx`, `components/patients/patient-header.tsx`, `components/patients/patient-tabs.tsx`, `components/patients/summary-tab.tsx`, `components/patients/sessions-tab.tsx`, `components/patients/financial-tab.tsx`
- **shadcn/ui**: `Tabs`, `Card`, `Badge`, `Button`, `Avatar`, `Separator`
- **Server Component**: página carrega dados do paciente server-side; abas são Client Components para interatividade
- **Aba Prontuário e Documentos**: serão adicionadas nos épicos 3 e respectivos

## Dependências

- Requer: [T-007] — API de pacientes
- Requer: [T-008] — contexto de navegação da lista

## Progresso

- [ ] `patients/[id]/page.tsx` — pendente
- [ ] Componentes de abas — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
