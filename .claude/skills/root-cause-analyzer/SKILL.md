---
name: root-cause-analyzer
description: >
  Carregue esta skill ao investigar a causa raiz de um bug. Use para garantir
  que o debug-agent analisa antes de corrigir — nunca toca no código sem
  entender o problema. Ativa quando o debug-agent inicia o ciclo de bug fix.
---

# Root Cause Analyzer

Sua função é encontrar a causa raiz antes de tocar em qualquer código.
Um fix sem análise correta cria dois bugs onde havia um.

## Processo obrigatório

### Fase 1 — Reproduza o bug

Antes de qualquer análise, reproduza o problema:
1. Leia `bugs/[slug].md` — passos para reproduzir
2. Execute os passos descritos
3. Confirme que o comportamento incorreto acontece
4. Se não conseguir reproduzir — documente isso e reporte ao usuário antes de continuar

### Fase 2 — Isole o problema

**Não abra 10 arquivos de uma vez.** Siga a trilha:

1. **Stack trace** — se disponível, comece pelo frame mais alto da aplicação
2. **Logs** — identifique o momento exato da falha
3. **Input/Output** — qual input gerou o output errado?
4. **Limite da falha** — em qual camada o comportamento diverge do esperado?
   (UI → API → Service → Repository → Banco)

Pare quando encontrar o ponto exato onde o comportamento diverge.

### Fase 3 — Documente a causa raiz ANTES de corrigir

Em `bugs/[slug].md`, preencha a seção "Análise":

```markdown
## Análise

**Causa raiz:**
[Uma frase clara: "O campo X não é validado antes de ser passado para Y,
resultando em Z quando o valor é nulo"]

**Por que aconteceu:**
[Contexto: edge case não coberto, validação faltando, suposição incorreta]

**Arquivos afetados:**
- `path/arquivo.ts` — [o que precisa mudar e por quê]
```

### Fase 4 — Só então corrija

Com a causa raiz documentada, implemente o fix mínimo necessário:
- Corrija a causa raiz, não o sintoma
- Não refatore código adjacente — isso cria risco de regressão
- Não "melhore" outras partes enquanto está lá — abra um issue separado

### Fase 5 — Escreva o teste que teria pego o bug

Antes de fechar:
- Escreva um teste que reproduz o bug e agora passa
- Este teste é a prova de que o fix funciona
- Este teste é a proteção contra regressão futura

## Sinais de causa raiz encontrada

Você encontrou a causa raiz quando consegue responder:
1. "O bug acontece porque [código específico] faz [X] quando deveria fazer [Y]"
2. "Isso acontece quando [condição específica]"
3. "O fix é [mudança mínima] neste arquivo"

Se não consegue responder essas três perguntas, continue analisando.

## O que não fazer

- Não corrija sem reproduzir primeiro
- Não abra PRs com "talvez isso resolva"
- Não refatore enquanto corrige — escopo separado
- Não feche o bug sem o teste de regressão
