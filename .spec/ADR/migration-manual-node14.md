# ADR: migration-manual-node14

**Data:** 2026-04-22
**Status:** accepted

## Contexto

Durante a correção do BLK-01 (índice duplicado no schema), foi necessário
executar `npm run db:generate` para gerar uma migration que remove o índice
`links_slug_unique` redundante. O drizzle-kit 0.31.10 usa sintaxe `||=`
(nullish assignment operator) que requer Node.js 15+. O ambiente de execução
tem Node.js 14.21.3 instalado como única versão disponível.

O arquivo `architecture.md` proíbe edição manual de migrations: "Nunca editar
arquivos de migration manualmente. Sempre gerar via `npm run db:generate` e
revisar antes de aplicar."

## Decisão

Criar o arquivo de migration manualmente, limitando o conteúdo SQL ao mínimo
necessário para corrigir o estado: `DROP INDEX IF EXISTS 'links_slug_unique'`.

A migration segue o formato dos arquivos gerados pelo Drizzle Kit (comentário
`--> statement-breakpoint` entre statements, nome no formato
`NNNN_<hash>.sql`).

O journal `_journal.json` é atualizado manualmente para registrar a nova
migration.

## Alternativas consideradas

1. **Atualizar Node.js para 18+ ou 20+**: Não é possível sem acesso
   administrativo ao sistema ou nvm instalado. O ambiente tem apenas Node 14.

2. **Usar uma versão mais antiga do drizzle-kit**: Versões antigas (pre-0.20)
   têm APIs incompatíveis com a configuração atual e exigiriam reinstalação e
   reconfiguração do schema.

3. **Ignorar o blocker**: Não é aceitável — BLK-01 é um blocker que impede
   aprovação do review.

## Consequências

- **Positiva**: O blocker BLK-01 é corrigido sem mudar a stack ou o schema.
- **Negativa**: A migration foi criada manualmente em violação à regra
  `architecture.md`, mas isso é documentado neste ADR.
- **Observação futura**: Quando o ambiente for atualizado para Node 18+,
  `npm run db:generate` deve ser executado para verificar que o estado do
  schema Drizzle e as migrations estão sincronizados.
