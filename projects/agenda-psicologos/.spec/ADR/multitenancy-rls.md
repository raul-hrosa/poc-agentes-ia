# ADR: Multi-tenancy por user_id com Row Level Security

**Data:** 2026-04-27
**Status:** Aceito

---

## Contexto

PsiAgenda é um produto SaaS onde cada psicólogo é um tenant independente.
Os dados de um psicólogo (pacientes, consultas, prontuários) não devem jamais
ser acessíveis por outro psicólogo — isso é requisito de segurança e LGPD.

A decisão foi necessária para definir como isolar dados entre psicólogos no
banco compartilhado.

---

## Decisão

Isolamento por `user_id` com Row Level Security (RLS) no PostgreSQL via Supabase.

Toda tabela de dado clínico tem `user_id uuid NOT NULL REFERENCES users(id)`.
Policies RLS garantem que `auth.uid()` corresponde ao `user_id` da linha em
todas as operações (SELECT, INSERT, UPDATE, DELETE).

A camada de aplicação (Prisma + Server Actions) adiciona uma segunda camada de
defesa sempre filtrando por `userId` nas queries.

---

## Alternativas consideradas

**Schema separado por tenant (PostgreSQL schema-per-tenant)**
Descartado porque: Supabase não suporta bem schema-per-tenant no free tier.
Aumenta complexidade de migrations (uma migration por tenant). Sem benefício
real para o volume esperado no MVP.

**Banco separado por tenant**
Descartado porque: operacionalmente inviável para solo developer. Custo de
infra explode com o número de usuários. Sem justificativa para escala do MVP.

**Isolamento apenas em código (sem RLS)**
Descartado porque: sem RLS, um bug de aplicação (ex: query sem filtro de user_id)
pode vazar dados de todos os psicólogos. RLS é uma camada de defesa que não pode
ser "esquecida" no código — está no banco. Para dados de saúde (LGPD), defesa
em profundidade é obrigatória.

---

## Consequências

**Positivas:**
- Vazamento de dados entre psicólogos é impossível mesmo com bug na aplicação
- Conformidade LGPD reforçada na camada de banco
- Simples de implementar com Supabase (RLS é nativo)
- Sem overhead de infra por tenant

**Negativas:**
- Queries de admin (para monitoramento do produto) precisam usar service role,
  que bypassa RLS — risco de acesso indevido se mal gerenciado
- `user_id` precisa ser denormalizado em tabelas filhas (ex: `session_notes` tem
  `user_id` mesmo podendo derivar via `appointment.user_id`) para que RLS funcione
  eficientemente sem joins

**Neutras:**
- Se necessário auditar acessos por usuário no futuro, RLS pode ser combinado com
  audit logging nativo do Supabase
