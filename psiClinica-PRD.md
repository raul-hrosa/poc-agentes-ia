# PsiClínica — Product Requirements Document (PRD)
**Versão:** 1.0  
**Data:** Junho 2025  
**Status:** Especificação inicial — MVP completo  
**Público-alvo do produto:** Psicólogos em início de carreira (0–3 anos de consultório)

---

## Índice

1. [Visão geral do produto](#1-visão-geral-do-produto)
2. [Personas](#2-personas)
3. [Arquitetura de módulos](#3-arquitetura-de-módulos)
4. [Módulo 1 — Autenticação e conta](#4-módulo-1--autenticação-e-conta)
5. [Módulo 2 — Pacientes](#5-módulo-2--pacientes)
6. [Módulo 3 — Agenda](#6-módulo-3--agenda)
7. [Módulo 4 — Prontuário](#7-módulo-4--prontuário)
8. [Módulo 5 — Financeiro](#8-módulo-5--financeiro)
9. [Módulo 6 — Comunicação ética](#9-módulo-6--comunicação-ética)
10. [Módulo 7 — Insights e relatórios](#10-módulo-7--insights-e-relatórios)
11. [Módulo 8 — Base de conhecimento](#11-módulo-8--base-de-conhecimento)
12. [Módulo 9 — Agendamento público (link do psicólogo)](#12-módulo-9--agendamento-público-link-do-psicólogo)
13. [Módulo 10 — Planos e assinatura](#13-módulo-10--planos-e-assinatura)
14. [Fluxos transversais](#14-fluxos-transversais)
15. [Regras de negócio globais](#15-regras-de-negócio-globais)
16. [Conformidade e segurança](#16-conformidade-e-segurança)
17. [Notificações e automações](#17-notificações-e-automações)
18. [Priorização de desenvolvimento](#18-priorização-de-desenvolvimento)

---

## 1. Visão geral do produto

### Proposta de valor
PsiClínica é um sistema de gestão de consultório desenhado exclusivamente para psicólogos que estão começando a carreira. Resolve as dores operacionais do dia a dia — agenda, prontuário, cobrança e comunicação com pacientes — em uma interface simples, acessível e em conformidade com o CFP e a LGPD.

### Diferenciais estratégicos
- Linguagem e UX desenhados para quem está no início, não para clínicas consolidadas
- Módulo de comunicação ética com templates prontos e revisados
- Preço acessível para quem ainda tem poucos pacientes
- Base de conhecimento integrada sobre gestão de consultório

### O que o produto NÃO faz (escopo excluído do MVP)
- Gestão de múltiplos profissionais / clínica multiprofissional
- Emissão de nota fiscal eletrônica
- Telemedicina / videochamada integrada
- Prescrição digital
- Integração com convênios / planos de saúde
- App mobile nativo (apenas web responsivo)

---

## 2. Personas

### Persona primária — Ana, 25 anos, recém-formada
- Formou-se há 8 meses, atende em consultório compartilhado 3x por semana
- Tem 6 pacientes particulares
- Usa agenda de papel e WhatsApp para agendar
- Anota as sessões em caderno ou Word
- Não cobra taxa de cancelamento por vergonha
- Medo de não estar em conformidade com o CFP
- Quer parecer profissional mas tem orçamento limitado

### Persona secundária — Carlos, 29 anos, 2 anos de consultório
- Tem 15 pacientes, atende em consultório próprio
- Já tentou usar planilha para controle financeiro, abandonou
- Perde em torno de 2h por semana em burocracia administrativa
- Quer escalar para 25 pacientes sem contratar recepcionista

---

## 3. Arquitetura de módulos

```
PsiClínica
├── Auth & Conta
├── Pacientes (CRM clínico)
├── Agenda
│   └── Agendamento público (link externo)
├── Prontuário
├── Financeiro
├── Comunicação ética
├── Insights & relatórios
├── Base de conhecimento
└── Planos & assinatura
```

### Hierarquia de acesso por plano

| Feature | Gratuito | Pro (R$49/mês) | Clínica (R$97/mês) |
|---|---|---|---|
| Pacientes ativos | até 8 | ilimitados | ilimitados |
| Agenda | básica | completa | completa |
| Prontuário | básico | completo | completo |
| Financeiro | registro manual | + cobrança Pix/cartão | completo |
| WhatsApp automático | — | sim | sim |
| Comunicação ética | templates básicos | todos os templates | todos |
| Insights | — | sim | avançado |
| Base de conhecimento | acesso limitado | acesso completo | completo |
| Salas / agendas | 1 | 1 | até 3 |
| Suporte | email | email + chat | prioritário |

---

## 4. Módulo 1 — Autenticação e conta

### 4.1 Cadastro

**Campos obrigatórios:**
- Nome completo
- E-mail
- Senha (mínimo 8 caracteres, 1 maiúscula, 1 número)
- CRP (número do registro no Conselho Regional de Psicologia)
- Estado de atuação

**Campos opcionais no cadastro (podem ser preenchidos depois):**
- Telefone
- Foto de perfil
- Abordagem terapêutica principal (lista: TCC, Psicanálise, Humanista, Sistêmica, Comportamental, Outra)
- Especialidades (multi-seleção)
- Horário padrão de atendimento

**Regras:**
- E-mail deve ser único no sistema
- CRP não é validado via API externa no MVP (campo livre com formato sugerido)
- Após cadastro, e-mail de confirmação é enviado
- Conta só fica ativa após confirmação do e-mail
- Novo usuário inicia automaticamente no plano Gratuito com trial de 14 dias do plano Pro

### 4.2 Login

- Login por e-mail + senha
- "Lembrar de mim" (sessão de 30 dias)
- Recuperação de senha por e-mail (link expira em 1 hora)
- Após 5 tentativas erradas: bloqueio de 15 minutos

### 4.3 Perfil do psicólogo

**Dados pessoais:**
- Nome, foto, CRP, estado, telefone
- Abordagem, especialidades
- Mini bio (até 300 caracteres) — usada no link público de agendamento

**Configurações de atendimento:**
- Duração padrão de sessão (30, 45, 50, 60, 90 minutos)
- Valor padrão da sessão (R$)
- Dias e horários de atendimento (grade semanal)
- Tempo de intervalo entre sessões (0, 10, 15, 30 minutos)
- Antecedência mínima para agendamento (horas)
- Antecedência mínima para cancelamento (horas)
- Política de cancelamento (texto livre, até 500 caracteres)

**Configurações de notificações:**
- Receber e-mail quando paciente agendar (sim/não)
- Receber e-mail quando paciente cancelar (sim/não)
- Receber lembrete de sessão (sim/não, com antecedência configurável)

### 4.4 Exclusão de conta

- Psicólogo pode solicitar exclusão de conta
- Dados de prontuário são mantidos por 5 anos (obrigação legal CFP)
- Sistema informa isso antes de confirmar exclusão
- Conta fica "desativada" (não excluída fisicamente) por padrão
- Exclusão física pode ser solicitada via suporte com ciência do prazo legal

---

## 5. Módulo 2 — Pacientes

### 5.1 Cadastro de paciente

**Dados básicos (obrigatórios):**
- Nome completo
- Data de nascimento
- Telefone (WhatsApp preferencialmente)
- E-mail

**Dados clínicos (opcionais):**
- Gênero (campo livre ou lista: Masculino, Feminino, Não-binário, Prefiro não informar)
- Estado civil
- Profissão
- Como chegou até o psicólogo (indicação, redes sociais, plataforma, outro)
- Contato de emergência (nome + telefone)
- Observações gerais (campo de texto livre)

**Regras:**
- Um paciente pertence a apenas um psicólogo (não compartilhado)
- Paciente pode ser arquivado (não aparece nas listas ativas mas dados são mantidos)
- Não é possível excluir paciente que tenha prontuário (apenas arquivar)
- Limite de 8 pacientes ativos no plano Gratuito (arquivados não contam)

### 5.2 Ficha do paciente

A ficha é o hub central de tudo relacionado a um paciente. Contém abas:

**Aba Resumo:**
- Foto (opcional, upload)
- Dados de contato
- Status: Ativo / Em pausa / Arquivado
- Data de início do acompanhamento
- Total de sessões realizadas
- Próxima sessão agendada
- Saldo financeiro (total pago vs total devido)
- Tags / etiquetas livres (ex: "TCC", "luto", "online")

**Aba Prontuário:** (ver Módulo 4)

**Aba Sessões:**
- Lista de todas as sessões (realizadas, agendadas, canceladas, faltas)
- Filtro por período

**Aba Financeiro:**
- Histórico de pagamentos do paciente
- Inadimplências em aberto

**Aba Documentos:**
- Upload de documentos relacionados ao paciente (laudos, encaminhamentos, contratos)
- Formatos aceitos: PDF, JPG, PNG (máx. 10MB por arquivo)
- Limite: 50MB por paciente no plano Pro

### 5.3 Busca e listagem de pacientes

- Busca por nome ou telefone
- Filtros: status (ativo / em pausa / arquivado), tags
- Ordenação: nome, data de início, próxima sessão
- Visualização em lista ou cards

### 5.4 Anamnese

- Formulário de anamnese inicial vinculado ao paciente
- Seções configuráveis: queixa principal, histórico, medicações, saúde geral, histórico familiar, objetivos terapêuticos
- Psicólogo pode adicionar campos personalizados (texto, múltipla escolha, sim/não)
- Anamnese fica registrada com data de preenchimento
- Pode ser editada com histórico de versões (data + quem editou)

---

## 6. Módulo 3 — Agenda

### 6.1 Visão da agenda

**Visualizações disponíveis:**
- Semana (padrão)
- Dia
- Mês (somente contagem de sessões por dia, sem detalhes)

**Comportamento:**
- Grade de horários baseada nas configurações de atendimento do psicólogo
- Sessões aparecem como blocos coloridos (cor configurável por paciente ou tipo)
- Feriados nacionais destacados (não bloqueados automaticamente, apenas sinalizado)
- Navegação por semana/mês com setas

### 6.2 Criação de sessão

**Campos:**
- Paciente (busca por nome)
- Data e horário
- Duração (usa o padrão do psicólogo, editável)
- Tipo: presencial / online
- Local (texto livre, ex: "Consultório Rua X" ou "Google Meet")
- Valor da sessão (usa o padrão do paciente ou o padrão geral, editável)
- Recorrência: única, semanal, quinzenal, mensal
- Observações (campo opcional)

**Regras:**
- Não permite agendar no mesmo horário (conflito de sessões)
- Ao criar sessão recorrente, gera até 52 sessões futuras (1 ano)
- Sessão recorrente pode ser editada individualmente ou "esta e todas as futuras"
- Sistema avisa se horário está fora das configurações de atendimento (não bloqueia)

### 6.3 Estados de uma sessão

```
Agendada → Confirmada → Realizada
                     → Falta (paciente não compareceu)
         → Cancelada pelo paciente
         → Cancelada pelo psicólogo
         → Reagendada
```

**Transições:**
- Psicólogo pode alterar estado manualmente
- Ao marcar como "Realizada": sistema pergunta se deseja registrar pagamento imediatamente
- Ao marcar como "Falta": sistema pergunta se deseja cobrar taxa de cancelamento (se configurada)
- Sessão cancelada com menos antecedência que o configurado: sistema sugere cobrança de taxa

### 6.4 Bloqueios de agenda

- Psicólogo pode bloquear períodos (férias, compromissos pessoais)
- Bloqueio tem título opcional (ex: "Férias", "Supervisão")
- Bloquear um período já com sessões agendadas gera alerta listando as sessões afetadas

### 6.5 Confirmação de sessão

- Psicólogo pode enviar confirmação manual de sessão para o paciente via WhatsApp ou e-mail
- Mensagem usa template do Módulo 6 (Comunicação ética)
- Confirmação automática configurável: X horas antes da sessão

---

## 7. Módulo 4 — Prontuário

### 7.1 Registro de sessão (evolução clínica)

**Campos por sessão:**
- Data e hora (preenchida automaticamente com base na sessão da agenda)
- Conteúdo da sessão (editor de texto rico: negrito, itálico, listas, títulos)
- Campo privado / notas do terapeuta (não exportável, não visível nem ao paciente)
- Humor/estado do paciente no início da sessão (escala 1–10, opcional)
- Técnicas utilizadas (multi-seleção com lista configurável + campo livre)
- Próximos passos / tarefas para o paciente (lista de itens)
- Status do pagamento da sessão (vinculado ao módulo financeiro)

**Regras:**
- Registro de sessão é vinculado a uma sessão da agenda
- Pode-se criar registro sem sessão agendada (atendimento extra, contato telefônico, etc.)
- Registro não pode ser excluído, apenas editado (com histórico de alterações: data + hora)
- Todo registro tem timestamp imutável de criação
- Campos são criptografados em repouso

### 7.2 Plano terapêutico

- Documento separado das evoluções de sessão
- Campos: objetivos de curto prazo, médio prazo, longo prazo, hipótese diagnóstica (campo livre), CID-10 (opcional, campo livre), estratégias planejadas
- Pode ser atualizado com nova versão (versões anteriores são mantidas)

### 7.3 Documentos clínicos geráveis

**Tipos:**
- Declaração de comparecimento (com data, horário e nome do paciente)
- Relatório psicológico (template com campos: identificação, demanda, procedimentos, análise, conclusão)
- Encaminhamento (para outro profissional)
- Atestado de acompanhamento psicológico

**Funcionalidade:**
- Templates preenchidos com dados do paciente e do psicólogo automaticamente
- Editor de texto antes de finalizar
- Exportação em PDF
- Registro no histórico de documentos do paciente com data de emissão

### 7.4 Exportação do prontuário

- Psicólogo pode exportar prontuário completo de um paciente em PDF
- Exportação inclui: dados do paciente, anamnese, todas as evoluções, plano terapêutico, documentos emitidos
- PDF tem marca d'água com CRP do psicólogo e data de exportação
- Ação registrada em log de auditoria

---

## 8. Módulo 5 — Financeiro

### 8.1 Registro de pagamento

**Formas de pagamento registráveis:**
- Pix
- Dinheiro
- Cartão de débito
- Cartão de crédito
- Transferência
- Outro

**Campos:**
- Paciente
- Sessão vinculada (opcional — pode ser pagamento avulso)
- Valor recebido
- Data do recebimento
- Forma de pagamento
- Observação (campo livre)

**Regras:**
- Pagamento pode ser registrado manualmente ou via cobrança gerada pelo sistema
- Um pagamento pode quitar mais de uma sessão
- Sistema mantém saldo devedor por paciente

### 8.2 Cobrança digital (plano Pro e Clínica)

- Geração de link de cobrança via Pix ou cartão de crédito
- Link enviado ao paciente via WhatsApp ou e-mail
- Prazo de vencimento configurável (padrão: 3 dias)
- Após pagamento confirmado: sessão marcada como paga automaticamente
- Cobrança expirada pode ser renovada
- Taxa da plataforma: 1,5% por transação (adicional à taxa do gateway de pagamento)

### 8.3 Recorrência de cobrança

- Pacientes com sessões semanais/quinzenais podem ter cobrança recorrente configurada
- Cobrança gerada automaticamente X dias antes da sessão (configurável: 1, 2, 3, 5 dias)
- Psicólogo pode pausar, cancelar ou editar a recorrência

### 8.4 Controle de inadimplência

- Lista de sessões realizadas sem pagamento registrado
- Filtros: período, paciente
- Indicador de dias em aberto
- Ação rápida: enviar cobrança ou registrar pagamento
- Alerta no dashboard quando paciente acumula 2+ sessões sem pagamento

### 8.5 Relatório financeiro

- Receita total no período (dia, semana, mês, personalizado)
- Receita por paciente
- Receita por forma de pagamento
- Sessões realizadas vs. pagas vs. inadimplentes
- Projeção do mês com base na agenda confirmada
- Exportação em PDF ou CSV

### 8.6 Honorários e configurações

- Valor padrão global por sessão
- Valor individual por paciente (sobrescreve o padrão)
- Taxa de cancelamento (valor fixo ou % do valor da sessão, para sessões canceladas fora do prazo)

---

## 9. Módulo 6 — Comunicação ética

### 9.1 Central de templates

Templates de mensagem prontos, revisados com base no Código de Ética do CFP.

**Categorias:**

**Confirmação e lembretes:**
- Confirmação de agendamento (após o paciente agendar)
- Lembrete de sessão (24h antes)
- Lembrete de sessão (2h antes)

**Cancelamentos:**
- Cancelamento pelo psicólogo (com antecedência)
- Cancelamento pelo psicólogo (urgência, sem aviso prévio)
- Reagendamento sugerido pelo psicólogo

**Cobrança:**
- Lembrete de pagamento pendente (tom respeitoso)
- Cobrança de taxa de cancelamento
- Link de pagamento enviado
- Confirmação de pagamento recebido

**Onboarding do paciente:**
- Boas-vindas ao início do acompanhamento
- Explicação da política de cancelamento
- Contrato terapêutico (texto base, editável)

**Comunicações delicadas:**
- Comunicado de encerramento do vínculo terapêutico (por iniciativa do psicólogo)
- Comunicado de férias / ausência temporária
- Encaminhamento para outro profissional

**Regras:**
- Variáveis dinâmicas: `{{nome_paciente}}`, `{{data_sessao}}`, `{{horario}}`, `{{valor}}`, `{{nome_psicologo}}`, `{{link_pagamento}}`
- Psicólogo pode editar qualquer template antes de enviar
- Psicólogo pode criar templates personalizados
- Templates base não podem ser excluídos (apenas copiados e editados)
- Envio por WhatsApp (abre app com mensagem pré-preenchida via `wa.me`) ou e-mail (enviado pelo sistema)

### 9.2 Histórico de comunicações

- Registro de todas as mensagens enviadas por paciente e data
- Tipo: lembrete automático, mensagem manual, cobrança
- Status: enviado / falhou

### 9.3 Automações de comunicação

| Automação | Gatilho | Template |
|---|---|---|
| Confirmação de agendamento | Sessão criada | Confirmação de agendamento |
| Lembrete 24h | 24h antes da sessão | Lembrete 24h |
| Lembrete 2h | 2h antes da sessão | Lembrete 2h |
| Cobrança automática | Sessão realizada sem pagamento por X dias | Lembrete de pagamento |
| Boas-vindas | Primeiro cadastro do paciente | Boas-vindas |

**Regras:**
- Automações ativas apenas no plano Pro e Clínica
- Psicólogo pode desativar qualquer automação globalmente ou por paciente

---

## 10. Módulo 7 — Insights e relatórios

### 10.1 Dashboard principal

**Resumo da semana:**
- Sessões hoje (com lista)
- Sessões desta semana
- Receita desta semana
- Sessões sem registro de prontuário (pendências)

**Saúde do consultório:**
- Total de pacientes ativos
- Taxa de ocupação da agenda (sessões realizadas / slots disponíveis no mês)
- Inadimplência em aberto (valor total)
- Pacientes sem sessão há mais de 30 dias (risco de abandono)

### 10.2 Relatório de pacientes

- Taxa de retenção (pacientes que continuaram após X sessões)
- Taxa de abandono (sem sessão há 30, 60, 90 dias)
- Média de sessões por paciente ativo
- Pacientes por abordagem / especialidade / como chegaram

### 10.3 Relatório de agenda

- Taxa de faltas por período
- Taxa de cancelamentos (por paciente, por dia da semana)
- Horários mais produtivos (sessões realizadas por faixa de horário)
- Sessões realizadas x agendadas (taxa de confirmação)

### 10.4 Regras dos insights

- Disponível apenas no plano Pro e Clínica
- Período padrão dos relatórios: últimos 3 meses
- Exportação em PDF com logo e CRP do psicólogo

---

## 11. Módulo 8 — Base de conhecimento

### 11.1 Trilhas de conteúdo

**Trilha 1 — Começando o consultório**
- Como definir o valor da sua sessão
- Como estruturar sua política de cancelamento
- Como apresentar o contrato terapêutico ao paciente
- Como lidar com o pedido de desconto

**Trilha 2 — Gestão financeira básica**
- Como organizar sua receita mensal
- O que é inadimplência e como prevenir
- Devo emitir nota fiscal? Guia prático
- Como declarar renda como psicólogo autônomo

**Trilha 3 — Comunicação e ética**
- Como cobrar um paciente sem constrangimento
- O que o Código de Ética do CFP diz sobre sigilo
- Como comunicar encerramento de vínculo
- LGPD na prática do consultório

**Trilha 4 — Crescimento**
- Como estruturar sua agenda para escalar
- Marketing ético para psicólogos: o que é permitido pelo CFP
- Como pedir indicações aos pacientes (dentro da ética)

### 11.2 Funcionalidades

- Busca por palavra-chave
- Artigos favoritos (salvos por usuário)
- Indicador "novo" para conteúdos publicados nos últimos 7 dias
- Estimativa de tempo de leitura por artigo

### 11.3 Acesso por plano

- Plano Gratuito: Trilha 1 completa + 2 artigos das demais trilhas
- Plano Pro e Clínica: acesso completo

---

## 12. Módulo 9 — Agendamento público (link do psicólogo)

### 12.1 URL pública

Cada psicólogo tem uma URL única:  
`psiclinica.com.br/agendar/[nome-do-psicologo]`

### 12.2 Página pública do psicólogo

**Exibe:**
- Foto, nome, CRP, mini bio
- Abordagem e especialidades
- Disponibilidade (grade de horários livres)
- Duração e valor da sessão (valor: exibição opcional)
- Modalidade (presencial, online ou ambas)

**Não exibe:**
- Dados de outros pacientes
- Informações financeiras

### 12.3 Fluxo de agendamento pelo paciente

1. Paciente acessa o link público
2. Escolhe data e horário disponível
3. Preenche: nome, e-mail, telefone, como chegou, mensagem inicial (opcional)
4. Aceita política de cancelamento (checkbox obrigatório se configurada)
5. Confirma o agendamento
6. Recebe confirmação por e-mail automático
7. Psicólogo recebe notificação

**Regras:**
- "Novo paciente" cria cadastro simplificado; psicólogo vincula ao cadastro existente depois
- Horários bloqueados ou ocupados não aparecem
- Respeitada a antecedência mínima configurada
- Paciente pode cancelar pelo link no e-mail de confirmação

### 12.4 Configurações do link público

- Ativar / desativar o link
- Mensagem de boas-vindas personalizada
- Exibir ou ocultar valor da sessão
- Exigir aprovação manual antes de confirmar
- Limitar para apenas 1ª sessão (novos pacientes)

---

## 13. Módulo 10 — Planos e assinatura

### 13.1 Planos

**Gratuito (forever free com limitações):**
- Até 8 pacientes ativos
- Agenda básica (sem automações)
- Prontuário simples (sem documentos geráveis)
- Controle financeiro manual
- Templates de comunicação básicos
- Base de conhecimento — Trilha 1 apenas

**Pro — R$ 49/mês (ou R$ 470/ano):**
- Pacientes ilimitados
- Agenda completa + automações
- Prontuário completo com documentos geráveis
- Cobrança digital (Pix + cartão)
- Todos os templates
- Insights e relatórios
- Base de conhecimento completa
- 1 agenda / sala

**Clínica — R$ 97/mês (ou R$ 932/ano):**
- Tudo do Pro
- Até 3 agendas / salas
- Insights avançados
- Suporte prioritário por chat
- Exportação de dados em massa

### 13.2 Trial

- Todo cadastro novo inicia com 14 dias do plano Pro (sem cartão)
- Ao fim, downgrade automático para Gratuito
- Banner não intrusivo informa dias restantes durante o trial
- E-mail de lembrete no último dia

### 13.3 Upgrade / downgrade

- Upgrade: ativo imediatamente, cobrado pro-rata
- Downgrade: ativo no próximo ciclo
- Downgrade Pro → Gratuito: pacientes acima de 8 arquivados automaticamente (com aviso e confirmação prévia)
- Cancelamento: acesso mantido até fim do período pago

---

## 14. Fluxos transversais

### 14.1 Primeiro atendimento

```
1. Psicólogo cadastra paciente novo
2. Preenche dados básicos
3. Cria sessão na agenda (ou paciente agenda pelo link público)
4. Sistema envia confirmação automática (se ativo)
5. Lembrete enviado 24h antes (se ativo)
6. Após sessão: psicólogo marca como "Realizada"
7. Sistema pergunta: "Registrar pagamento agora?"
8. Psicólogo registra evolução no prontuário
9. Próxima sessão já aparece (se recorrente)
```

### 14.2 Inadimplência

```
1. Sessão realizada sem pagamento registrado
2. Após 3 dias (configurável): alerta no dashboard
3. Psicólogo acessa lista de inadimplências
4. Ação: "Enviar cobrança" → abre template de cobrança
5. Ou: "Registrar pagamento recebido"
6. Se pago via link: sessão marcada automaticamente
```

### 14.3 Cancelamento com taxa

```
1. Paciente cancela sessão
2. Sistema verifica: dentro ou fora do prazo?
3. Fora do prazo → sugere cobrar taxa
4. Psicólogo confirma ou ignora
5. Se confirmar: gera cobrança e envia template
6. Registro no histórico da sessão
```

### 14.4 Exportação de prontuário

```
1. Psicólogo acessa ficha do paciente
2. Opção "Exportar prontuário"
3. Escolhe o que incluir (período, seções)
4. Sistema gera PDF com marca d'água (CRP + data)
5. Ação registrada em log de auditoria
6. PDF disponível para download por 24h
```

---

## 15. Regras de negócio globais

### Sessões
- Sessão só pode ser marcada como "Realizada" na data atual ou no passado
- Sessões futuras não podem ser marcadas como realizadas
- Prontuário pode ser editado a qualquer momento (com histórico)
- Sessão não pode ser excluída — apenas cancelada

### Pacientes
- Paciente arquivado não aparece em buscas padrão
- Paciente arquivado não conta para o limite do plano Gratuito
- Mesmo e-mail não pode estar em dois cadastros ativos do mesmo psicólogo

### Financeiro
- Sistema registra separadamente: valor da sessão e valor efetivamente recebido
- Relatórios usam valor recebido
- Um pagamento pode quitar múltiplas sessões

### Dados
- Nenhum dado de paciente é excluído fisicamente
- Logs de auditoria mantidos por prazo indeterminado
- Exportações registradas em log

---

## 16. Conformidade e segurança

### LGPD
- Psicólogo é o controlador dos dados dos pacientes
- PsiClínica é o operador
- Termo de uso e política de privacidade aceitos no cadastro
- Psicólogo pode exportar ou solicitar exclusão de todos os seus dados

### CFP (Resolução 01/2009)
- Prontuários mantidos por prazo mínimo de 5 anos
- Sistema impede exclusão dentro desse prazo
- Campos de prontuário não acessíveis por terceiros nem pela equipe PsiClínica

### Segurança técnica (requisitos mínimos)
- Dados de prontuário criptografados em repouso (AES-256)
- HTTPS obrigatório em todas as comunicações
- Senhas armazenadas com hash bcrypt
- Após 5 tentativas de login erradas: bloqueio de 15 minutos
- Backups automáticos diários com retenção de 30 dias
- Log de acesso a prontuários (quem acessou, quando)

---

## 17. Notificações e automações

### Para o psicólogo (in-app + e-mail)

| Evento | Canal |
|---|---|
| Novo agendamento via link público | E-mail + in-app |
| Cancelamento de paciente | E-mail + in-app |
| Pagamento recebido | E-mail + in-app |
| Sessão do dia sem prontuário | In-app (fim do dia) |
| Paciente inadimplente (X dias) | In-app + e-mail |
| Paciente sem sessão há 30 dias | In-app (semanal) |
| Trial expirando (3 dias antes) | E-mail |

### Para o paciente (WhatsApp ou e-mail)

| Evento | Canal | Automação? |
|---|---|---|
| Confirmação de agendamento | WhatsApp / e-mail | Sim (configurável) |
| Lembrete 24h antes | WhatsApp / e-mail | Sim (configurável) |
| Lembrete 2h antes | WhatsApp / e-mail | Sim (configurável) |
| Link de cobrança | WhatsApp / e-mail | Manual ou automático |
| Confirmação de pagamento | WhatsApp / e-mail | Sim (automático) |
| Cancelamento pelo psicólogo | WhatsApp / e-mail | Manual |

**Nota MVP:** Envio via WhatsApp abre o app com mensagem pré-preenchida (`wa.me`). Integração com WhatsApp Business API é feature pós-MVP.

---

## 18. Priorização de desenvolvimento

### Sprint 1 — Fundação (semanas 1–3)
- [ ] Autenticação (cadastro, login, recuperação de senha)
- [ ] Perfil do psicólogo e configurações de atendimento
- [ ] Cadastro e listagem de pacientes
- [ ] Ficha básica do paciente

### Sprint 2 — Core clínico (semanas 4–6)
- [ ] Agenda: criar, editar, visualizar sessões
- [ ] Estados de sessão (agendada, realizada, cancelada, falta)
- [ ] Prontuário: registro de evolução de sessão
- [ ] Registro manual de pagamento

### Sprint 3 — Automação e comunicação (semanas 7–9)
- [ ] Central de templates de comunicação
- [ ] Envio via WhatsApp (link wa.me)
- [ ] Lembretes automáticos por e-mail
- [ ] Link público de agendamento

### Sprint 4 — Financeiro avançado (semanas 10–12)
- [ ] Cobrança digital (Pix + cartão via gateway)
- [ ] Relatório financeiro
- [ ] Controle de inadimplência

### Sprint 5 — Completude (semanas 13–16)
- [ ] Documentos clínicos geráveis (PDF)
- [ ] Anamnese com campos personalizáveis
- [ ] Insights e relatórios
- [ ] Base de conhecimento
- [ ] Sistema de planos e assinatura (Stripe)

### Sprint 6 — Polimento e lançamento (semanas 17–20)
- [ ] Onboarding guiado para novos usuários
- [ ] Tour interativo das features principais
- [ ] Testes de usabilidade com psicólogos beta
- [ ] Ajustes de UX baseados em feedback
- [ ] Landing page pública e SEO básico

---

*Documento mantido e versionado pelo time de produto PsiClínica.*  
*Próxima revisão prevista: após Sprint 2, com base no feedback dos beta users.*
