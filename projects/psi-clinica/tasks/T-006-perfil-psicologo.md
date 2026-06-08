# T-006 — Perfil do Psicólogo (API + frontend settings)

**Épico**: [Épico 0 — Infraestrutura](../epics/epic-0-infraestrutura.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar `PsychologistsModule` no NestJS com endpoints de perfil e disponibilidade semanal. No frontend, criar a página `(dashboard)/settings/` com formulários de perfil (foto, bio, abordagem, especialidades, valor padrão) e configuração da grade de horários semanal (dia da semana + horário de início/fim). Upload de avatar envia para R2 e armazena a chave em `avatar_path`.

## Critérios de aceite

- [ ] `GET /psychologists/me` retorna perfil completo com URL presigned do avatar
- [ ] `PATCH /psychologists/me` atualiza campos de perfil e configurações de atendimento
- [ ] `POST /psychologists/me/avatar` faz upload para R2, atualiza `avatar_path`
- [ ] `PUT /psychologists/me/availability` substitui grade semanal em `schedule_availability`
- [ ] Frontend exibe foto atual, permite upload de nova imagem com preview
- [ ] Grade de horários permite adicionar/remover blocos por dia da semana
- [ ] Formulário persiste slug único de agendamento público (validado como disponível)

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/psychologists/psychologists.module.ts`, `psychologists.controller.ts`, `psychologists.service.ts`, `dto/update-psychologist.dto.ts`, `entities/psychologist.entity.ts`; `apps/web/src/app/(dashboard)/settings/page.tsx`, `components/psychologist/profile-form.tsx`, `components/psychologist/availability-form.tsx`
- **Avatar upload**: `@UseInterceptors(FileInterceptor('avatar'))` no controller; validar MIME (`image/jpeg`, `image/png`, `image/webp`) e tamanho (máx 2MB)
- **Disponibilidade**: `PUT /availability` faz `DELETE WHERE psychologist_id=? + INSERT` em transaction
- **shadcn/ui**: `Tabs`, `Form`, `Input`, `Select`, `Switch`, `Avatar`, `Badge`

## Dependências

- Requer: [T-002] — guards, R2Service
- Requer: [T-003] — tabelas `psychologists`, `schedule_availability`
- Requer: [T-005] — frontend autenticado

## Progresso

- [ ] `psychologists.service.ts` — pendente
- [ ] `psychologists.controller.ts` — pendente
- [ ] Frontend settings — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
