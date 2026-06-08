# T-032 — Frontend Página Pública de Agendamento ([slug])

**Épico**: [Épico 6 — Agendamento Público](../epics/epic-6-agendamento-publico.md)
**Prioridade**: P2
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar a rota `app/agendar/[slug]/page.tsx` (fora do layout autenticado). Exibe perfil público do psicólogo com foto, bio, especialidades e calendário de seleção de data/hora. Ao escolher o slot, exibe formulário de dados do paciente (nome, e-mail, telefone, mensagem inicial, aceite da política de cancelamento). Após envio com sucesso, exibe página de confirmação. Página totalmente SSR-friendly e responsiva.

## Critérios de aceite

- [ ] Página carrega perfil via `GET /public/psychologists/:slug` server-side (SSR)
- [ ] Calendário exibe apenas dias futuros com slots disponíveis (dias sem slots são desabilitados)
- [ ] Ao selecionar data, busca slots disponíveis `GET .../slots?date=` client-side
- [ ] Formulário valida: nome (obrigatório), e-mail (válido), telefone (obrigatório), política de cancelamento (obrigatório se configurada)
- [ ] Após agendamento com sucesso: página de confirmação com data/hora e instrução "Você receberá um e-mail de confirmação"
- [ ] Se `public_booking_enabled=false`: página exibe mensagem "Agendamento online indisponível no momento"

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/agendar/[slug]/page.tsx`, `app/agendar/[slug]/booking-form.tsx`, `app/agendar/[slug]/confirmation.tsx`
- **Sem autenticação**: não importar `api.ts` com JWT nesta rota; usar `fetch` direto para `/public/`
- **shadcn/ui**: `Calendar`, `Card`, `Form`, `Input`, `Textarea`, `Checkbox`, `Button`, `Avatar`
- **SEO**: `generateMetadata()` com nome e bio do psicólogo para open graph

## Dependências

- Requer: [T-031] — API pública
- Requer: [T-001] — Next.js scaffoldado

## Progresso

- [ ] `agendar/[slug]/page.tsx` — pendente
- [ ] `booking-form.tsx` — pendente
- [ ] `confirmation.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
