---
name: spec-compliance
description: >
  Carregue esta skill ao verificar se a implementação está conforme a spec
  da feature. Use para checar cobertura de critérios EARS, user stories e
  regras de negócio. Ativa quando o review-agent precisa comparar código
  implementado com features/[slug].md.
---

# Spec Compliance

Sua função é verificar sistematicamente se o que foi implementado corresponde
ao que foi especificado — sem julgamento subjetivo, apenas verificação objetiva.

## Processo

### Passo 1 — Monte o mapa de verificação

Abra `features/[slug].md` e liste todos os itens verificáveis:
- Cada critério EARS (`AC-NN`)
- Cada user story (verifica se o fluxo existe)
- Cada regra de negócio (`RN-NN`)

### Passo 2 — Verifique critério por critério

Para cada `AC-NN`:

1. Identifique o arquivo de implementação correspondente
2. Localize o código que implementa aquele critério
3. Classifique:
   - ✅ **passou** — implementação cobre o critério completamente
   - ❌ **falhou** — critério não implementado ou implementado incorretamente
   - ⚠️ **parcial** — implementado mas com gap (ex: happy path ok, erro não tratado)

### Passo 3 — Para cada falha ou parcial

Documente em `review/[slug].md`:
```
BLK-NN — [título descritivo]
Critério: AC-NN
Arquivo: path/arquivo.ts linha N
Descrição: [o que está faltando ou errado]
Como resolver: [orientação clara]
```

### Passo 4 — Verifique o que NÃO deveria estar lá

A feature spec tem uma seção "Fora do escopo desta feature".
Verifique se o impl-agent não implementou algo que não devia:
- Features do backlog antecipadas
- Funcionalidades de outras features
- Over-engineering não solicitado

Se encontrar: reporte como `warning`, não blocker — o código extra pode
ser removido depois sem urgência, mas deve ser registrado.

## O que não verificar aqui

- Qualidade estética do código — não é seu escopo
- Preferências de estilo não documentadas — se não está nas specs, não é requisito
- Performance — a menos que haja critério EARS específico para isso
- Segurança genérica — use a skill `security-reviewer` para isso

## Critério de aprovação

A feature está **approved** quando:
- Zero `AC-NN` com status ❌ falhou
- Zero `RN-NN` violadas
- Nenhum blocker em aberto

Features com `⚠️ parcial` podem ser aprovadas se o gap for documentado
como `warning` com prazo de resolução — decisão do usuário no gate.
