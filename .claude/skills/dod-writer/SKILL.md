---
name: dod-writer
description: >
  Carregue esta skill ao personalizar o Definition of Done para a stack do
  projeto. Use para preencher a seção de personalização do definition-of-done.md
  com os comandos reais do projeto. Ativa quando o tech-agent termina de
  definir a stack e precisa tornar o DoD executável.
---

# DoD Writer

Sua função é transformar o template genérico de `definition-of-done.md` em um
checklist executável específico para a stack deste projeto.

## O que fazer

Leia `tech-stack.md` e preencha a seção "Personalização por stack" do
`definition-of-done.md` com os comandos reais do projeto.

Substitua todos os placeholders `[comando específico da stack]` pelos comandos
reais definidos em `tech-stack.md`.

## Seção a preencher

```markdown
| Item | Comando |
|---|---|
| Lint | `npm run lint` |
| Type-check | `npx tsc --noEmit` |
| Testes | `npm test` |
| Build | `npm run build` |
| Padrão de commit | `feat(scope): descrição em imperativo` |
```

## Regras

- Use os comandos exatos de `tech-stack.md` — não invente
- Se um item não se aplica à stack (ex: type-check em projeto JS puro),
  documente como `N/A — [motivo]` em vez de remover a linha
- Se a stack tem múltiplos workspaces, documente o comando por workspace:
  ```
  | Lint (frontend) | `cd frontend && npm run lint` |
  | Lint (backend)  | `cd backend && npm run lint`  |
  ```
- Após preencher, adicione uma linha no topo do arquivo com a data e stack:
  ```
  > Personalizado para: [stack resumida] em [data]
  ```
