# ADR — prisma-version-7x

**Data:** 2026-04-29
**Status:** aceito

## Contexto

A tech-stack.md especifica Prisma 5.14.x. Ao executar `pnpm add @prisma/client` e `pnpm add -D prisma`, o pnpm resolveu a versão mais recente disponível: **Prisma 7.8.0**.

O Prisma 7.x introduz mudanças de breaking change relevantes em relação ao 5.x:
- O generator usa `provider = "prisma-client"` ao invés de `"prisma-client-js"`
- O cliente é gerado em `src/generated/prisma` ao invés de `node_modules/@prisma/client`
- Um arquivo `prisma.config.ts` separado gerencia configuração de datasource
- Importações usam `from "@prisma/client"` mas o tipo gerado é local

## Decisão

Usar **Prisma 7.8.0** (versão resolvida pelo pnpm) ao invés de fixar em 5.14.x.

## Alternativas descartadas

**Fixar em prisma@5.14.x:** Exigiria adicionar `overrides` no package.json e instalar versão específica. O schema seria compatível com `provider = "prisma-client-js"`. Porém, a versão 7.x é a versão estável mais recente e mais adequada para um projeto novo em 2026.

## Consequências

- **Positivo:** Usa versão mais recente com melhorias de performance e segurança
- **Positivo:** Melhor DX com o arquivo `prisma.config.ts` separado
- **Negativo:** O schema.prisma precisa usar `provider = "prisma-client"` e `output = "../src/generated/prisma"`
- **Negativo:** Importações do Prisma Client podem precisar de ajuste em tasks futuras: `from "@/generated/prisma"` ao invés de `from "@prisma/client"`
- **Atenção:** O `@auth/prisma-adapter` 2.x pode ter incompatibilidade com Prisma 7.x — validar em TASK-01

## Nota adicional

Como o `@auth/prisma-adapter` é uma dependência crítica para NextAuth, e pode ter sido projetado para Prisma 5.x/6.x, o schema do NextAuth (`User`, `Account`, `Session`, `VerificationToken`) será mantido conforme especificado. Qualquer incompatibilidade de tipos será tratada com cast explícito ou atualização do adapter.

O Prisma 7.x também requer um driver adapter para conexão com MySQL. Como não existe `@prisma/adapter-mysql` oficial, utilizamos `@prisma/adapter-mariadb` com o driver `mariadb`, que é compatível com MySQL 8.0 (MariaDB Connector/J suporta MySQL). Este adapter é necessário para instanciar o PrismaClient no Prisma 7.x — sem ele, nenhuma conexão é possível.

Importações do Prisma Client nas features devem usar `from "@/generated/prisma"` ao invés de `from "@prisma/client"`.
