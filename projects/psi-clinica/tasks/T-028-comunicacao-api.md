# T-028 — API Comunicação (templates CRUD, envio, logs)

**Épico**: [Épico 5 — Comunicação Ética](../epics/epic-5-comunicacao.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Implementar o `CommunicationModule` com CRUD de templates (sistema + personalizados), envio de mensagem (e-mail via Resend ou link `wa.me`) e histórico por paciente. Templates do sistema (`is_system=true`) são criados via seed e não podem ser deletados. Envio substitui variáveis `{{nome_paciente}}`, `{{data_sessao}}`, etc., no template antes de enviar.

## Critérios de aceite

- [ ] `GET /communication/templates` retorna templates do sistema + templates próprios do psicólogo
- [ ] `POST /communication/templates` cria template personalizado com `psychologist_id`
- [ ] `DELETE /communication/templates/:id` rejeita com 403 se `is_system=true`
- [ ] `POST /communication/send` com `channel='email'`: envia via Resend, registra em `communication_logs`
- [ ] `POST /communication/send` com `channel='whatsapp'`: retorna `{ waLink: 'https://wa.me/55...' }` com mensagem pré-preenchida URL-encoded
- [ ] `GET /communication/logs/:patientId` retorna histórico com status e body_snapshot

## Notas técnicas

- **Arquivos a criar**: `apps/api/src/communication/communication.module.ts`, `communication.controller.ts`, `communication.service.ts`, `dto/send-message.dto.ts`, `dto/create-template.dto.ts`
- **Seed de templates**: migration ou arquivo `communication.seed.ts` com os 6 templates base (confirmação, lembrete 24h, lembrete 2h, cancelamento, cobrança, boas-vindas, encerramento)
- **Interpolação**: `template.body.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '')`
- **wa.me link**: `https://wa.me/55${phone.replace(/\D/g,'')}?text=${encodeURIComponent(body)}`
- **DB**: tabelas `communication_templates`, `communication_logs`

## Dependências

- Requer: [T-002] — `ResendService`
- Requer: [T-003] — tabelas de comunicação

## Progresso

- [ ] `communication.service.ts` — pendente
- [ ] Seed de templates — pendente
- [ ] `communication.controller.ts` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
