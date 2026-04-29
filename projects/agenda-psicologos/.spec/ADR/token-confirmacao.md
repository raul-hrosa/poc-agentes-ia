# ADR: Token de confirmação de consulta por HMAC-SHA256

**Data:** 2026-04-27
**Status:** Aceito

---

## Contexto

O fluxo central de PsiAgenda é: psicólogo agenda consulta → envia link ao paciente
via WhatsApp → paciente clica e confirma. A página de confirmação é pública
(sem autenticação do paciente) e precisa ser segura contra:
1. Enumeração de tokens (adivinhar token de outra consulta)
2. Reutilização de token (confirmar a mesma consulta múltiplas vezes)
3. Tokens que nunca expiram (consulta passada sendo confirmada tardiamente)

A decisão foi necessária para definir como gerar e validar esses tokens.

---

## Decisão

Tokens gerados com HMAC-SHA256 usando segredo da aplicação (`APP_SECRET`).

```typescript
// Geração
const payload = `${appointmentId}:${expiresAt.toISOString()}`
const token = createHmac('sha256', APP_SECRET).update(payload).digest('hex')

// Armazenamento: salvo em appointment_tokens com expires_at e used_at
// URL: https://app.psiagenda.com.br/confirm/[token]
```

Validação verifica, nesta ordem:
1. Token existe em `appointment_tokens`
2. `expires_at > now()` (não expirado)
3. `used_at IS NULL` (não usado)
4. `appointment.status` é `scheduled` ou `confirmed` (consulta ainda pode ser confirmada)

Ao confirmar ou cancelar: `used_at = now()` e `action` são definidos atomicamente
com a atualização de `appointment.status`.

---

## Alternativas consideradas

**UUID aleatório como token**
Descartado porque: UUID v4 tem 122 bits de aleatoriedade e não pode ser verificado
sem consulta ao banco. HMAC também requer consulta ao banco (para checar `used_at`),
então a diferença prática é pequena. HMAC foi escolhido por ser uma prática mais
estabelecida para tokens de URL assinados.

**JWT (JSON Web Token)**
Descartado porque: JWT pode ser verificado sem banco (stateless), mas isso elimina
a capacidade de invalidar um token antes do vencimento. Para uso único, precisamos
do banco de qualquer forma. JWT adicionaria complexidade de biblioteca sem benefício.

**OTP de 6 dígitos enviado por SMS**
Fora do escopo: exige integração com operadora de SMS (custo), e o produto deliberadamente
evita custos de mensageria no MVP. Link direto é suficiente.

---

## Consequências

**Positivas:**
- Token não pode ser enumerado (HMAC com segredo)
- Uso único garantido pelo `used_at` no banco
- Expiração de 72h previne confirmação de consultas passadas
- Sem dependência de biblioteca externa para gerar token (Node.js nativo)

**Negativas:**
- `APP_SECRET` vazado compromete todos os tokens em circulação — rotação do segredo
  invalida todos os tokens ativos (consultas com lembrete enviado, não confirmadas ainda)
- Banco deve ser consultado para toda validação — sem verificação offline

**Neutras:**
- Expiração de 72h é configurável: se feedback indicar que psicólogos enviam
  lembretes com mais de 3 dias de antecedência, ajustar para 96h ou 120h
