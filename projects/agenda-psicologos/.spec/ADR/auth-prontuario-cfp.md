# ADR: Autenticação de prontuário — Supabase Auth + RLS (sem senha adicional por CFP)

**Data:** 2026-04-27
**Status:** Aceito

---

## Contexto

O Conselho Federal de Psicologia (CFP) exige que prontuários digitais tenham
"controle de acesso por senha". O produto `product.md` delega a decisão técnica
de como implementar isso para o tech-agent.

A questão é: além do login do sistema (Supabase Auth), o produto precisa de
uma segunda senha ou autenticação adicional para acessar o prontuário?

---

## Decisão

Não adicionamos uma segunda senha para acessar prontuário no MVP.

A autenticação por e-mail e senha do Supabase Auth satisfaz o requisito de
"controle de acesso por senha" do CFP. O prontuário é acessível apenas para
o psicólogo autenticado, isolado por RLS no banco.

Se o psicólogo deixar a sessão aberta no celular, o prontuário fica acessível
enquanto a sessão estiver ativa — igual a qualquer sistema com sessão persistente.
O product.md indica "sessão persistente no dispositivo" como comportamento esperado.

---

## Alternativas consideradas

**Segunda senha para acessar seção de prontuário**
Descartado porque: adiciona fricção significativa para o psicólogo que usa o sistema
no celular durante atendimentos. Psicólogos consultar prontuário antes da sessão é
um caso de uso primário — segunda senha transforma isso em 3 passos (app → senha do app
→ senha do prontuário). O produto é posicionado como "sem burocracia".

**Sessão com timeout curto (ex: 15 min) para prontuário**
Descartado porque: o psicólogo usa o celular para consultar a agenda e prontuário
entre atendimentos. Timeout curto forçaria re-autenticação constante, quebrando
o fluxo de trabalho no consultório.

**Autenticação biométrica (Face ID / Touch ID) para prontuário**
Descartado para o MVP porque: requer app nativo (o produto é web) ou Web Authentication
API (suporte inconsistente em mobile browsers). Adiciona complexidade desproporcional
ao MVP.

---

## Consequências

**Positivas:**
- Fluxo simplificado: um login, acesso completo
- Prontuário protegido por senha (satisfaz CFP) via login do sistema
- RLS no banco garante que dados de prontuário são inacessíveis sem autenticação válida

**Negativas:**
- Se psicólogo compartilhar sessão no celular (improvável), prontuário fica exposto
- Sem camada adicional de proteção se a senha do sistema for comprometida

**Neutras:**
- CFP pode atualizar regulamentação exigindo 2FA para prontuário — reavaliar se
  houver pressão regulatória pós-lançamento
- Feature de "bloquear prontuário" pode ser adicionada como configuração opcional
  no plano pro se houver demanda explícita dos usuários
