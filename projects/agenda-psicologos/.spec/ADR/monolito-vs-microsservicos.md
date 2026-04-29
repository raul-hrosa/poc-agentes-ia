# ADR: Monolito modular vs microsserviços

**Data:** 2026-04-27
**Status:** Aceito

---

## Contexto

PsiAgenda é um MVP desenvolvido por 1 desenvolvedor solo para validar product-market fit.
O produto tem 7 features no MVP, nenhuma delas com requisitos de escala independente
ou picos de carga previsíveis que justificariam separação de serviços.

A decisão foi necessária porque o produto tem múltiplos domínios (agenda, prontuário,
financeiro, pagamentos, confirmações) que poderiam ser implementados como serviços
separados ou como módulos em um único processo.

---

## Decisão

Adotamos monolito modular com Next.js 14 (App Router).

Todos os domínios vivem no mesmo processo e repositório, organizados em módulos
por feature (`src/features/[feature]/`). Não há comunicação via rede entre módulos
— chamadas são diretas em TypeScript.

---

## Alternativas consideradas

**Microsserviços (ex: NestJS API + Next.js frontend separados)**
Descartado porque: duplicaria configuração de CI/CD, autenticação, banco e deploy
para um time de 1 pessoa. O overhead operacional adiaria o lançamento em semanas
sem benefício técnico real para o volume esperado de usuários no MVP.

**Backend separado em Node.js (Express/Fastify) + Next.js frontend**
Descartado porque: Server Actions e Server Components do Next.js 14 eliminam a
necessidade de API REST interna. Ter dois projetos separados (frontend + backend)
duplica setup sem ganho para solo developer.

---

## Consequências

**Positivas:**
- Deploy em um único processo (Vercel) — menos configuração, menos falhas
- Compartilhamento de tipos entre UI e lógica de servidor sem serialização
- Desenvolvimento mais rápido: uma mudança de feature toca um único repositório
- Debugging simplificado: stack trace completa em um lugar

**Negativas:**
- Escala horizontal acoplada: se uma feature tiver pico de carga (ex: muitos webhooks Stripe),
  escala todo o processo — não apenas o módulo afetado
- Limites entre módulos são convenção de código, não fronteira de processo —
  disciplina do developer é necessária para não criar acoplamento lateral

**Neutras:**
- Se o produto crescer além de ~10k usuários ativos, reavaliar extração de módulos
  específicos (ex: webhook Stripe, geração de tokens) como funções serverless separadas
