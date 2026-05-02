# ADR: session_payments ausente no schema Prisma ao iniciar controle-financeiro

**Data:** 2026-05-02
**Status:** Aceito

---

## Contexto

A task de controle-financeiro/TASK-01 afirma que "a tabela `session_payments` já existe no
schema Prisma — não é necessária migration". Entretanto, ao examinar `prisma/schema.prisma`,
o modelo `SessionPayment` não existe. O data-model.md descreve a tabela `session_payments`
como parte do modelo de dados, mas ela nunca foi adicionada ao schema Prisma.

## Decisão

Adicionar o modelo `SessionPayment` ao `prisma/schema.prisma` com os campos descritos em
`data-model.md` e executar a migration correspondente via `pnpm db:migrate`.

Também é necessário adicionar a relação `sessionPayment` em `Appointment` e em `User` para
que as queries de pagamento funcionem corretamente via Prisma.

## Alternativas consideradas

**Ignorar a adição ao schema e usar SQL raw**
Descartado porque: a stack usa Prisma como ORM — queries raw fora do padrão violam a
convenção do projeto (`architecture.md`: "Nunca instanciar `new PrismaClient()` fora do
singleton. Toda query usa o Prisma Client singleton").

**Assumir que a tabela existe no banco sem o modelo Prisma**
Descartado porque: sem o modelo no schema, o Prisma Client não gera os tipos TypeScript
correspondentes, tornando as queries type-unsafe.

## Consequências

**Positivas:**
- Prisma Client gera os tipos corretos para `SessionPayment`
- Queries são type-safe e consistentes com o padrão do projeto
- Migration versionada documenta a criação da tabela

**Negativas:**
- Uma migration nova é criada, contradizendo a instrução original da task
- A instrução "tabela já existe" era incorreta — corrijo sem alterar o escopo funcional

**Neutras:**
- O modelo segue exatamente o data-model.md — sem campos adicionados ou removidos
