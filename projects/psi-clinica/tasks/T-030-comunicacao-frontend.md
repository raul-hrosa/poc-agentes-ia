# T-030 — Frontend Comunicação (templates, enviar mensagem, histórico)

**Épico**: [Épico 5 — Comunicação Ética](../epics/epic-5-comunicacao.md)
**Prioridade**: P1
**Complexidade**: M (1-3h)
**Status**: ⬜ Pendente

## O que fazer

Criar a página `(dashboard)/communication/` com gerenciamento de templates e central de envio. Templates do sistema são exibidos como read-only; templates personalizados podem ser editados/deletados. Enviar mensagem abre modal com select de paciente + select de template; preview ao vivo substitui variáveis com dados reais do paciente. Histórico de mensagens por paciente acessível também na ficha do paciente.

## Critérios de aceite

- [ ] Lista de templates com badge "Sistema" para templates base (não deletáveis)
- [ ] Editar template personalizado abre modal com editor de texto e preview das variáveis disponíveis
- [ ] Modal "Enviar mensagem": select de paciente (busca por nome), select de template, preview pré-preenchido, botões "Enviar por e-mail" e "Enviar por WhatsApp"
- [ ] "Enviar por WhatsApp" abre `wa.me` em nova aba com mensagem pré-preenchida
- [ ] Aba Histórico na ficha do paciente (`T-009`) exibe mensagens enviadas com status e data

## Notas técnicas

- **Arquivos a criar**: `apps/web/src/app/(dashboard)/communication/page.tsx`, `components/communication/template-list.tsx`, `components/communication/send-message-modal.tsx`, `components/communication/message-history.tsx`, `hooks/use-communication.ts`
- **shadcn/ui**: `Tabs`, `Table`, `Dialog`, `Form`, `Select`, `Textarea`, `Badge`
- **Preview**: React state que substitui `{{variavel}}` com dados reais do paciente selecionado

## Dependências

- Requer: [T-028] — API de comunicação
- Requer: [T-007] — dados de pacientes para preview e seleção

## Progresso

- [ ] `communication/page.tsx` — pendente
- [ ] `send-message-modal.tsx` — pendente
- [ ] `message-history.tsx` — pendente

## Checklist de conclusão

- [ ] Código implementado e funcionando
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Responsivo (mobile + desktop testados)
- [ ] Loading state implementado
- [ ] Tratamento de erro com feedback ao usuário
- [ ] Status atualizado para ✅ neste arquivo
- [ ] BACKLOG.md atualizado
