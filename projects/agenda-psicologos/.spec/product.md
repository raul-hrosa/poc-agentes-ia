# Produto — agenda-psicologos

## Nome do produto

**PsiAgenda**

## Tagline

A agenda mais simples para psicólogos que estão começando — sem burocracia, sem custo alto.

## Problema que resolve

Psicólogos em início de carreira gerenciam consultas manualmente: anotações em papel,
WhatsApp para confirmações e planilhas improvisadas. Isso causa faltas não confirmadas,
esquecimento de horários, prontuários perdidos e tempo desperdiçado em tarefas
administrativas que poderiam ser dedicadas ao atendimento.

O problema se manifesta principalmente como:
- Pacientes que não comparecem sem aviso prévio (no-show)
- Dificuldade em lembrar o que foi tratado em sessões anteriores
- Falta de controle financeiro sobre sessões realizadas versus pendentes de pagamento

## Público-alvo

### Perfil primário — Psicólogo recém-formado
- Formado há menos de 3 anos, CRP recente
- 5 a 20 pacientes ativos
- Atende em consultório compartilhado, clínica parceira ou online (Zoom, Google Meet)
- Renda mensal variável, entre R$ 2.000 e R$ 6.000 bruto
- Não tem funcionário ou secretária
- Usa celular como ferramenta principal de trabalho
- Sensível a preço: ferramentas acima de R$ 50/mês são difíceis de justificar
- Não tem familiaridade com softwares complexos de gestão

### Perfil secundário — Psicólogo autônomo consolidado
- 3 a 7 anos de carreira
- 20 a 40 pacientes ativos
- Quer profissionalizar a gestão sem contratar secretária
- Pode pagar até R$ 80/mês por uma ferramenta que economize tempo

### Quem não é o público
- Clínicas com múltiplos profissionais e recepção (mercado de iClinic, Psicomanager)
- Psicólogos organizacionais ou de RH (sem agenda de sessões individuais)

## Proposta de valor

PsiAgenda oferece ao psicólogo autônomo em início de carreira um sistema de agenda
com confirmação automática de consultas, prontuário simplificado e controle financeiro
básico — tudo em uma única ferramenta acessível e fácil de aprender em menos de 10 minutos.

O valor principal é recuperar tempo e reduzir no-show sem exigir conhecimento técnico
ou investimento alto.

## Modelo de negócio

### Estrutura
Freemium com plano pago por assinatura mensal.

### Plano gratuito (permanente)
- Até 10 pacientes ativos
- Agenda básica com lembretes manuais
- Prontuário simplificado (texto livre por sessão)
- Sem confirmação automática

### Plano Profissional — R$ 39/mês
- Pacientes ilimitados
- Confirmação automática de consultas via WhatsApp (usando link ou bot simples)
- Lembretes automáticos 24h e 2h antes da consulta
- Prontuário com histórico completo
- Relatório financeiro mensal básico (sessões realizadas, recebidas, pendentes)

### Projeção de conversão
- Meta: 5% dos usuários free convertem para pago em 90 dias
- Ticket médio: R$ 39/mês
- Break-even estimado: 50 assinantes pagos (~R$ 1.950/mês MRR)

### Justificativa de preço
O mercado concorrente (iClinic, Psicomanager) cobra entre R$ 89 e R$ 250/mês.
PsiAgenda posiciona-se como a opção entry-level para quem ainda não tem volume
suficiente para justificar ferramentas enterprise.

## Diferenciais vs concorrentes

| Aspecto | PsiAgenda | iClinic | Psicomanager |
|---|---|---|---|
| Preço entrada | R$ 0 (free) / R$ 39 (pro) | R$ 89/mês | R$ 99/mês |
| Setup | < 10 minutos | Horas + onboarding | Horas + suporte |
| Foco | Psicólogo solo em início | Clínicas e consultórios | Clínicas médias/grandes |
| Prontuário | Simplificado (texto livre) | Completo (SOAP, CID) | Completo + laudos |
| Confirmação | WhatsApp link/bot | E-mail + SMS | E-mail + SMS |
| Financeiro | Básico (controle de sessões) | Faturamento completo | ERP integrado |
| Curva de aprendizado | Muito baixa | Média | Alta |

O posicionamento de PsiAgenda é deliberadamente simples: não competir com iClinic
em funcionalidade, mas dominar o segmento de psicólogos que ainda não precisam
de iClinic.

## Premissas

1. O psicólogo usa WhatsApp como canal principal de comunicação com pacientes.
2. A confirmação de consulta via link simples é suficiente para reduzir no-show
   em pelo menos 30% (premissa a validar no MVP).
3. O usuário prefere simplicidade a completude — um prontuário de texto livre
   é preferível a campos estruturados no início de carreira.
4. O modelo freemium funcionará porque psicólogos com mais de 10 pacientes
   ativos têm renda suficiente para assinar o plano profissional.

## Restrições e decisões não-técnicas

- O produto deve funcionar bem em celular (mobile-first) — psicólogos usam
  o celular para tudo, não têm computador dedicado ao consultório.
- A confirmação automática via WhatsApp deve ser implementada sem custo
  de SMS — usar link de confirmação (sem API paga do WhatsApp Business
  na fase MVP).
- Conformidade com CFP (Conselho Federal de Psicologia): o prontuário
  digital deve ter controle de acesso por senha e os dados devem
  ser armazenados com segurança (LGPD). Decisão técnica de como
  implementar fica para o tech-agent.
- Não há restrição de stack definida pelo usuário.

## Riscos de produto

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Psicólogos não confiam em prontuário digital | Média | Alto | Enfatizar segurança e LGPD no onboarding |
| Plano free é suficiente, ninguém paga | Média | Alto | Limitar pacientes no free e testar conversão |
| WhatsApp muda política e bloqueia bots | Baixa | Médio | Confirmar por link (sem bot real no MVP) |
| Concorrente lança versão barata | Baixa | Médio | Velocidade de lançamento é vantagem |
