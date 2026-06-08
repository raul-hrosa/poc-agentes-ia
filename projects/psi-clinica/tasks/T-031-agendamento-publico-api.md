# T-031 — API Pública (perfil, slots disponíveis, book)

**Épico**: [Épico 6 — Agendamento Público](../epics/epic-6-agendamento-publico.md)
**Prioridade**: P2
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `PublicModule` com endpoints sem autenticação para a página pública de agendamento. `GET /public/psychologists/:slug` retorna o perfil público do psicólogo (sem dados privados). `GET /public/psychologists/:slug/slots` retorna slots disponíveis para uma data usando o mesmo algoritmo de `T-014`. `POST /public/psychologists/:slug/book` cria paciente simplificado (se não existe por e-mail) + sessão, respeitando `min_booking_advance_hours`, `public_require_approval` e `public_booking_enabled`.

## Critérios de aceite

- [ ] Todos os 3 endpoints marcados com `@Public()` (sem JWT)
- [ ] `GET /public/psychologists/:slug` retorna apenas campos públicos: foto, nome, CRP, bio, especialidades, abordagem, modalidade, `public_show_price` (valor apenas se true)
- [ ] `GET .../slots?date=` não retorna slots no passado nem dentro do `min_booking_advance_hours`
- [ ] `POST .../book` retorna 404 se `public_booking_enabled = false`
- [ ] `POST .../book` com `public_require_approval = true` cria sessão com status `scheduled` e envia notificação por e-mail ao psicólogo
- [ ] `POST .../book` envia e-mail de confirmação ao paciente (via Resend)
- [ ] Rate limiting diferenciado para endpoints públicos: 20 req/min por IP

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/public/public.module.ts`, `public.controller.ts`, `public.service.ts`, `dto/book-session.dto.ts`
- **Throttler**: `@Throttle(20, 60)` no controller público
- **Book flow**: `SELECT patient WHERE email=? AND psychologist_id=?` → cria se não existe → `POST sessions` (reutiliza `SessionsService.create()`)
- **DB**: lê `psychologists`, `schedule_availability`, `sessions`, `schedule_blocks`; escreve `patients`, `sessions`

## Dependências

- Requer: [T-014] — algoritmo de slots disponíveis (reutilizar)
- Requer: [T-007] — `PatientsService.create()`
- Requer: [T-013] — `SessionsService.create()`

## Progresso

- [ ] `public.service.ts` — pendente
- [ ] `public.controller.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
