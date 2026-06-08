# PRD — PsiClínica

## Visão Geral
PsiClínica é um sistema de gestão de consultório para psicólogos em início de carreira (0–3 anos). Resolve agenda, prontuário, cobrança e comunicação com pacientes em uma interface simples, acessível e em conformidade com CFP e LGPD. O diferencial é a linguagem desenhada para quem está começando — não para clínicas consolidadas.

## Problema
Psicólogos recém-formados gerenciam seu consultório com agenda de papel, WhatsApp e cadernos. As ferramentas existentes são complexas e caras, voltadas para clínicas maiores. O resultado: burocracia administrativa consome horas por semana, cobranças não são feitas por constrangimento, e há medo real de não estar em conformidade com o CFP.

## Solução
Plataforma web responsiva (sem app nativo no MVP) com módulos integrados de agenda, prontuário digital, controle financeiro e comunicação ética. Templates de mensagem revisados com base no Código de Ética do CFP eliminam o constrangimento de cobrar ou cancelar. Preço acessível com plano gratuito funcional para quem tem poucos pacientes.

## Usuário-alvo
**Primário**: Psicóloga recém-formada (0–2 anos), 4–10 pacientes particulares, usa WhatsApp e papel, quer parecer profissional com orçamento limitado.  
**Secundário**: Psicólogo com 2–4 anos de consultório, 15–25 pacientes, quer escalar sem contratar recepcionista.

---

## MVP — Funcionalidades Essenciais

### F-01: Autenticação e conta
- **O que faz**: Cadastro, login, recuperação de senha e perfil do psicólogo com configurações de atendimento (duração padrão, valor, horários, política de cancelamento)
- **User story**: Como psicóloga, quero criar minha conta e configurar meu horário de atendimento para que o sistema gerencie minha agenda corretamente
- **Critérios de aceite**:
  - [ ] Cadastro com nome, e-mail, senha (mín. 8 chars, 1 maiúscula, 1 número), CRP e estado
  - [ ] E-mail de confirmação enviado; conta inativa até confirmação
  - [ ] Novo usuário inicia com trial de 14 dias do plano Pro automaticamente
  - [ ] Recuperação de senha por e-mail (link expira em 1h)
  - [ ] Bloqueio de 15 min após 5 tentativas erradas de login
  - [ ] Perfil editável: foto, mini bio (até 300 chars), abordagem, especialidades, valor padrão da sessão, grade de horários semanal

### F-02: Cadastro e ficha de pacientes
- **O que faz**: CRM clínico com dados do paciente, histórico de sessões, financeiro e documentos
- **User story**: Como psicóloga, quero cadastrar meus pacientes e acessar todas as informações deles em um único lugar
- **Critérios de aceite**:
  - [ ] Cadastro com nome, data de nascimento, telefone e e-mail (obrigatórios)
  - [ ] Ficha com abas: Resumo, Prontuário, Sessões, Financeiro, Documentos
  - [ ] Busca por nome ou telefone; filtros por status (ativo/em pausa/arquivado)
  - [ ] Paciente arquivado não conta para limite do plano Gratuito
  - [ ] Limite de 8 pacientes ativos no plano Gratuito; impossível excluir paciente com prontuário (apenas arquivar)
  - [ ] Upload de documentos (PDF, JPG, PNG, máx. 10MB/arquivo, 50MB/paciente no Pro)

### F-03: Agenda
- **O que faz**: Criação, edição e visualização de sessões com suporte a recorrência e controle de estados
- **User story**: Como psicóloga, quero agendar sessões recorrentes e ver minha semana de um relance para não ter conflitos de horário
- **Critérios de aceite**:
  - [ ] Visualizações: semana (padrão), dia, mês
  - [ ] Criação de sessão com: paciente, data/hora, duração, tipo (presencial/online), valor, recorrência (única/semanal/quinzenal/mensal)
  - [ ] Sessão recorrente gera até 52 sessões futuras; editável individualmente ou "esta e todas as futuras"
  - [ ] Sistema impede conflito de horário (dois pacientes no mesmo slot)
  - [ ] Estados: Agendada → Confirmada → Realizada / Falta / Cancelada / Reagendada
  - [ ] Ao marcar como "Realizada": sistema pergunta se deseja registrar pagamento
  - [ ] Bloqueios de período (férias, compromissos) com alerta se houver sessões no intervalo

### F-04: Prontuário digital
- **O que faz**: Registro de evoluções de sessão, plano terapêutico e emissão de documentos clínicos em PDF
- **User story**: Como psicóloga, quero registrar a evolução de cada sessão com segurança e emitir documentos para o paciente quando necessário
- **Critérios de aceite**:
  - [ ] Editor de texto rico (negrito, itálico, listas) vinculado a cada sessão da agenda
  - [ ] Campo privado do terapeuta (não exportável)
  - [ ] Registro não pode ser excluído; alterações têm histórico com data/hora
  - [ ] Dados criptografados em repouso (AES-256)
  - [ ] Documentos geráveis: declaração de comparecimento, relatório psicológico, encaminhamento, atestado — preenchidos com dados do paciente/psicólogo, exportados em PDF
  - [ ] Exportação do prontuário completo em PDF com marca d'água (CRP + data), registrada em log de auditoria

### F-05: Controle financeiro
- **O que faz**: Registro manual de pagamentos, controle de inadimplência e relatório financeiro
- **User story**: Como psicóloga, quero saber quais sessões estão em aberto e enviar cobranças sem constrangimento
- **Critérios de aceite**:
  - [ ] Registro de pagamento com: paciente, sessão vinculada (opcional), valor, data, forma (Pix/dinheiro/cartão/transferência/outro)
  - [ ] Um pagamento pode quitar múltiplas sessões; sistema mantém saldo devedor por paciente
  - [ ] Lista de inadimplências com filtro por período e paciente; alerta no dashboard com 2+ sessões em aberto
  - [ ] Relatório financeiro: receita total/por paciente/por forma de pagamento, sessões pagas vs. inadimplentes, exportação em PDF/CSV
  - [ ] **Plano Pro**: geração de link de cobrança via Pix ou cartão (gateway); após pagamento, sessão marcada como paga automaticamente

### F-06: Comunicação ética
- **O que faz**: Central de templates de mensagem revisados pelo CFP para WhatsApp e e-mail, com automações configuráveis
- **User story**: Como psicóloga, quero enviar lembretes e cobranças sem precisar escrever do zero, com linguagem já validada eticamente
- **Critérios de aceite**:
  - [ ] Templates prontos para: confirmação de agendamento, lembretes (24h/2h), cancelamentos, cobrança, boas-vindas, encerramento de vínculo
  - [ ] Variáveis dinâmicas: `{{nome_paciente}}`, `{{data_sessao}}`, `{{horario}}`, `{{valor}}`, `{{nome_psicologo}}`, `{{link_pagamento}}`
  - [ ] Envio via WhatsApp (link `wa.me` com mensagem pré-preenchida) ou e-mail pelo sistema
  - [ ] Histórico de mensagens enviadas por paciente com status (enviado/falhou)
  - [ ] **Plano Pro**: automações — confirmação ao agendar, lembrete 24h antes, lembrete 2h antes, cobrança após X dias sem pagamento

### F-07: Link público de agendamento
- **O que faz**: Página pública onde novos pacientes podem agendar diretamente na agenda do psicólogo
- **User story**: Como psicóloga, quero ter um link para enviar a novos pacientes para eles se agendarem sozinhos, sem precisar trocar mensagens
- **Critérios de aceite**:
  - [ ] URL única: `psiclinica.com.br/agendar/[nome]`
  - [ ] Exibe: foto, nome, CRP, bio, especialidades, horários disponíveis, modalidade
  - [ ] Paciente preenche: nome, e-mail, telefone, mensagem inicial; aceita política de cancelamento (obrigatório se configurada)
  - [ ] Confirmação automática por e-mail ao paciente; notificação ao psicólogo
  - [ ] Respeita antecedência mínima e bloqueios; não exibe slots ocupados
  - [ ] Configurável: ativar/desativar, exibir ou ocultar valor, exigir aprovação manual

### F-08: Dashboard e insights
- **O que faz**: Visão geral do consultório com métricas de agenda, financeiro e risco de abandono
- **User story**: Como psicóloga, quero ver de relance o que acontece hoje e identificar pacientes em risco de abandono
- **Critérios de aceite**:
  - [ ] Dashboard: sessões do dia, sessões sem prontuário (pendências), inadimplência em aberto, pacientes sem sessão há 30+ dias
  - [ ] **Plano Pro**: relatórios de taxa de faltas, taxa de cancelamento, taxa de retenção, horários mais produtivos

### F-09: Planos e assinatura
- **O que faz**: Gestão de planos Free/Pro/Clínica com trial automático e upgrade/downgrade
- **User story**: Como psicóloga, quero testar o produto sem cartão e fazer upgrade quando precisar de mais recursos
- **Critérios de aceite**:
  - [ ] Trial de 14 dias do plano Pro sem cartão, downgrade automático para Gratuito ao fim
  - [ ] Upgrade ativo imediatamente (pro-rata); downgrade no próximo ciclo
  - [ ] Downgrade Pro → Gratuito: pacientes acima de 8 arquivados automaticamente com aviso e confirmação prévia
  - [ ] Cancelamento: acesso mantido até fim do período pago
  - [ ] Pagamento de assinatura via Stripe

---

## Fora do Escopo (MVP)
- ~~Gestão de múltiplos profissionais / clínica multiprofissional~~ — pós-MVP
- ~~Emissão de nota fiscal eletrônica~~ — pós-MVP
- ~~Telemedicina / videochamada integrada~~ — pós-MVP
- ~~App mobile nativo~~ — pós-MVP (apenas web responsivo)
- ~~Integração com convênios / planos de saúde~~ — pós-MVP
- ~~WhatsApp Business API~~ — pós-MVP (MVP usa link `wa.me`)
- ~~Prescrição digital~~ — fora do escopo do produto

---

## Métricas de Sucesso
- 100 psicólogos cadastrados nos primeiros 30 dias após lançamento
- 30% dos usuários do trial convertem para Pro (dentro de 30 dias do fim do trial)
- Taxa de retenção D30 > 50% (usuários que ainda acessam após 30 dias)
- NPS > 40 nos primeiros 3 meses (coletado via e-mail pós-cadastro)

---

## Restrições
- Plataforma web responsiva apenas (sem app nativo no MVP)
- Prontuários mantidos por mínimo 5 anos (obrigação CFP Resolução 01/2009)
- Dados de prontuário criptografados em repouso (AES-256) — exigência regulatória
- LGPD: psicólogo é controlador, PsiClínica é operador — necessário DPA no contrato
- Envio de WhatsApp via link `wa.me` (sem API oficial) — limitação técnica do MVP

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Concorrente estabelecido (Psi Fácil, iClinic) oferecer plano acessível similar | Alta | Alto | Focar na UX de onboarding e nos templates CFP como diferencial difícil de copiar rápido |
| Psicólogos abandonarem o produto após trial por inércia | Alta | Alto | Onboarding guiado que força criar 1 paciente + 1 sessão antes do fim do trial |
| Cobrança digital (gateway) aumentar fricção de assinatura | Média | Médio | Integrar Stripe desde o Sprint 4; testar com beta users antes do lançamento |
| Não conformidade com CFP gerar reputação negativa | Baixa | Alto | Templates revisados por psicólogo consultor; aviso legal claro no produto |
| Abandono de prontuário por lentidão do editor | Média | Alto | Testar editor rico (Tiptap/Quill) com 10+ usuários antes do Sprint 3 |
