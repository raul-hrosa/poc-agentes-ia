# MVP Scope — agenda-psicologos

## Critério de corte aplicado

Para cada feature, foram aplicados os 3 filtros em sequência:
1. Sem isso, o usuário não consegue resolver o problema central?
2. Sem isso, o produto não pode ser cobrado?
3. Sem isso, a proposta de valor principal não se sustenta?

Feature entra no MVP se passou em pelo menos 1 dos 3 filtros.

---

## Features do MVP

### 1. Cadastro de pacientes
**Prioridade:** must-have
**Justificativa:** Sem lista de pacientes, não existe agenda. É a entidade central do produto.
**Critério de corte:** Filtro 1 — sem isso o problema central não pode ser resolvido.
**Complexidade:** Baixa
**Campos mínimos:** nome, telefone (WhatsApp), data de nascimento (opcional), contato de emergência (opcional)

---

### 2. Agenda de consultas
**Prioridade:** must-have
**Justificativa:** É o produto. Sem agenda funcional o PsiAgenda não existe.
**Critério de corte:** Filtros 1 e 3.
**Complexidade:** Média
**Funcionalidades mínimas:**
- Criar, editar e cancelar consulta (data, hora, paciente, modalidade: presencial/online)
- Visualização semanal e diária
- Status da consulta: agendada, confirmada, realizada, cancelada, no-show

---

### 3. Lembretes automáticos de consulta
**Prioridade:** must-have
**Justificativa:** Reduzir no-show é o benefício central que justifica o produto existir.
  Sem lembretes, é apenas uma agenda de papel digital.
**Critério de corte:** Filtros 1 e 3.
**Complexidade:** Média
**Implementação no MVP:** Lembrete via link enviado para WhatsApp (mensagem pré-formatada
  que o profissional encaminha) + página de confirmação simples acessível pelo paciente.
  Lembrete automático no plano pro: sistema envia link 24h e 2h antes.

---

### 4. Confirmação de consulta pelo paciente
**Prioridade:** must-have
**Justificativa:** Sem confirmação, lembrete não resolve o no-show. O paciente precisa
  responder — mesmo que seja apenas clicar em um link.
**Critério de corte:** Filtros 1 e 3.
**Complexidade:** Baixa
**Implementação no MVP:** Página web pública com token único por consulta.
  Paciente clica em "Confirmar presença" ou "Preciso cancelar". Psicólogo vê status
  atualizado na agenda.

---

### 5. Prontuário simplificado por sessão
**Prioridade:** must-have
**Justificativa:** Psicólogos são obrigados por lei a manter registros de atendimento (CFP).
  Sem isso, o produto não cobre uma necessidade crítica e real do profissional.
**Critério de corte:** Filtro 1 — sem prontuário o produto não pode substituir as
  anotações manuais atuais do psicólogo.
**Complexidade:** Baixa
**Implementação no MVP:** Campo de texto livre por sessão (vinculado à consulta realizada),
  com data e histórico ordenado cronologicamente por paciente.

---

### 6. Autenticação e acesso seguro
**Prioridade:** must-have
**Justificativa:** Prontuário contém dados sensíveis de saúde (LGPD). Sem autenticação
  segura o produto não pode ser lançado.
**Critério de corte:** Filtro 2 — sem isso o produto não pode ser cobrado (risco legal).
**Complexidade:** Baixa
**Implementação:** Login por e-mail e senha. Sessão persistente no dispositivo.
  Reset de senha por e-mail.

---

### 7. Controle financeiro básico de sessões
**Prioridade:** should-have
**Justificativa:** Psicólogos autônomos precisam saber quais sessões foram pagas,
  quais estão pendentes e quanto faturaram no mês. É o diferencial que justifica
  o plano pago.
**Critério de corte:** Filtro 2 — sem isso o plano profissional tem menos apelo.
**Complexidade:** Baixa
**Implementação no MVP:** Por consulta: marcar como pago/pendente, valor da sessão.
  Resumo mensal: total de sessões, total recebido, total pendente.

---

## Fora do MVP (backlog)

### Integração real com WhatsApp Business API
**Quando considerar:** Após 200 usuários ativos no plano pro e validação de que
  o fluxo de link manual tem taxa de confirmação abaixo de 40%.
**Motivo de exclusão:** Custo mensal por mensagem enviada (Twilio, Zenvia), complexidade
  de aprovação de templates, e o link manual resolve o mesmo problema no MVP.

---

### Agenda recorrente (consultas semanais automáticas)
**Quando considerar:** Após validar com 50 usuários que criam 4+ consultas por semana
  para o mesmo paciente.
**Motivo de exclusão:** Aumenta complexidade de conflitos de agenda e edge cases
  de cancelamento. A criação manual é suficiente no início.

---

### Relatórios financeiros avançados (DRE, gráficos de evolução)
**Quando considerar:** Após 6 meses de uso e feedback de demanda por dados históricos.
**Motivo de exclusão:** Psicólogos em início de carreira têm poucos pacientes —
  um relatório mensal simples já satisfaz a necessidade real neste momento.

---

### Teleconsulta integrada (videochamada dentro do produto)
**Quando considerar:** Após consolidar base de 500 usuários e validar que psicólogos
  abandonariam Zoom/Google Meet por solução integrada.
**Motivo de exclusão:** Infraestrutura cara (WebRTC ou serviço de video pago),
  psicólogos já têm hábito com Zoom e Google Meet. Não é bloqueador para o valor central.

---

### Plataforma de captação de pacientes (marketplace)
**Quando considerar:** Produto separado — após PsiAgenda ter 1.000 psicólogos cadastrados.
**Motivo de exclusão:** É outro produto, não uma feature. Muda completamente o modelo
  de negócio e adiciona complexidade de dois lados de marketplace.

---

### App mobile nativo (iOS/Android)
**Quando considerar:** Após validar retenção acima de 60% por 3 meses no produto web.
**Motivo de exclusão:** Web responsivo resolve o caso de uso no MVP. App nativo
  adiciona 2 plataformas para manter e prolonga o tempo de lançamento em meses.

---

### Integração com calendário externo (Google Calendar, Outlook)
**Quando considerar:** Após 100 usuários solicitarem explicitamente via feedback.
**Motivo de exclusão:** Adiciona complexidade de sincronização bidirecional e OAuth.
  A agenda interna do PsiAgenda é suficiente para o perfil de início de carreira.

---

## Fora do produto (nunca)

### Gestão de múltiplos profissionais e recepção
PsiAgenda é para psicólogos solos. Gestão de clínica com múltiplos profissionais,
permissões por perfil, recepcionistas e agendamento externo são o escopo de
iClinic e Psicomanager. Entrar nesse mercado exigiria reposicionar completamente
o produto e abandonar o diferencial de simplicidade.

### Prontuário estruturado com CID, laudos e SOAP
O posicionamento de PsiAgenda é prontuário simples por design. Adicionar
campos estruturados, CID-10, geração de laudos e formatos clínicos complexos
transforma o produto em software médico regulado (ANVISA), com requisitos legais
completamente diferentes. Esse escopo não será perseguido.

---

## Notas de escopo

O MVP tem 7 features (6 must-have + 1 should-have). Está dentro do limite saudável
de 5-7 features. A feature 7 (controle financeiro) foi incluída como should-have
porque diferencia o plano pago do free — sem ela, a conversão freemium fica comprometida.

O fluxo principal que um usuário pode completar sem suporte:
1. Cadastrar-se (autenticação)
2. Adicionar um paciente
3. Agendar uma consulta
4. Enviar lembrete via link (copiar e colar no WhatsApp)
5. Paciente confirma via link
6. Registrar prontuário após a sessão
7. Marcar sessão como paga

Esse fluxo completo deve funcionar sem treinamento.

---

## Definição de sucesso do MVP

### Critérios verificáveis em 30 dias de uso

1. **Adoção do fluxo principal:** 70% dos usuários cadastrados completaram pelo menos
   1 ciclo completo (agendar + lembrete + confirmação + prontuário) sem contato com suporte.

2. **Redução de no-show:** Usuários que usam o lembrete por link relatam no-show
   abaixo de 20% (vs. média de 30-40% sem sistema).

3. **Conversão freemium:** 5% dos usuários com mais de 10 pacientes ativos
   migraram para o plano pago dentro de 60 dias.

4. **Retenção:** 50% dos usuários que criaram ao menos 3 consultas continuam
   usando o produto após 30 dias.

### Critério de falha (pivô necessário)

Se após 90 dias com pelo menos 50 usuários ativos:
- Nenhum usuário converteu para plano pago, ou
- Taxa de abandono após primeira semana for superior a 70%

→ Revisar modelo de negócio ou proposta de valor antes de continuar desenvolvendo.
