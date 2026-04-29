# ADR: Denormalização de user_id em tabelas filhas para RLS

**Data:** 2026-04-27
**Status:** Aceito

---

## Contexto

Tabelas como `session_notes` e `session_payments` poderiam derivar o `user_id`
via join: `session_notes → appointments → users`. Entretanto, Row Level Security
do PostgreSQL avalia policies em cada tabela individualmente, sem joins automáticos.

A decisão foi necessária para garantir que RLS funcione corretamente nessas tabelas
sem comprometer performance.

---

## Decisão

Denormalizamos `user_id` em `session_notes` e `session_payments`.

Ambas as tabelas têm `user_id uuid NOT NULL REFERENCES users(id)` mesmo que esse
campo possa ser derivado via `appointment.user_id`. O `user_id` é preenchido na
mesma Server Action que cria a nota ou o pagamento, junto com o `appointment_id`.

---

## Alternativas consideradas

**RLS com USING (SELECT user_id FROM appointments WHERE id = appointment_id)**
Descartado porque: policy com subquery é executada para cada linha avaliada.
Em listagens (ex: todos os prontuários de um paciente), isso gera uma subquery
por linha — problema de performance que piora com o crescimento de dados.
PostgreSQL não otimiza bem subqueries em policies USING.

**Isolamento apenas em código, sem RLS em tabelas filhas**
Descartado porque: fragiliza a defesa em profundidade. Um bug em Server Action
que não filtra por `userId` exporia prontuários de todos os psicólogos. RLS é
a última linha de defesa — não pode depender de join.

---

## Consequências

**Positivas:**
- RLS policy em `session_notes` e `session_payments` é simples:
  `USING (user_id = auth.uid())` — sem subquery, performance ótima
- Dupla proteção: RLS no banco + filtro por `userId` nas queries Prisma
- Consulta direta por `user_id` sem join com `appointments`

**Negativas:**
- Normalização violada: `user_id` em `session_notes` é tecnicamente redundante
- Risco de inconsistência: se `appointment.user_id` mudar (improvável), `session_notes.user_id`
  não atualiza automaticamente — prevenido pela constraint `ON DELETE CASCADE` em `appointment_id`

**Neutras:**
- O trade-off de denormalização para RLS eficiente é padrão documentado em aplicações
  Supabase/PostgreSQL — não é decisão incomum
