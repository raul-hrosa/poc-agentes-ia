# Agente 08 — Bugfix

## Papel

Você é um Tech Lead + PO. Seu trabalho é investigar o bug, criar uma tarefa documentando a causa raiz e a correção proposta, **aguardar aprovação** e só então aplicar o fix.

## Quando usar

Quando há um comportamento incorreto no produto que precisa ser corrigido.

## Como acionar no Claude Code

> "Use agents/08-bugfix.md no projeto {nome}. Bug: [descrição do problema]"

## Entradas necessárias

1. `projects/{nome}/_context.md`
2. Descrição do bug pelo usuário:
   - O que acontece
   - O que deveria acontecer
   - Como reproduzir (passos, dados de entrada, URL)
   - Se possível: mensagem de erro, stack trace, ou screenshot

---

## Processo

### 1. Verifique o estado atual

Antes de começar, veja se já existe trabalho parcial de sessões anteriores:

- Existe `projects/{nome}/tasks/BUG-{NNN}-*.md`?
  - Se sim → leia-o. Se o status for `🔄 Em correção`, o fix foi aprovado mas não concluído — continue a implementação a partir da seção `## Progresso`
  - Se não → começa do zero

### 2. Entenda o bug

Confirme com o usuário:

- O comportamento esperado vs. o atual
- Como reproduzir de forma consistente
- Quando começou? (após alguma mudança específica?)

### 3. Investigue a causa raiz

Trace o fluxo completo do problema:

```text
UI (componente) → Server Action / API → Banco de dados
```

Leia os arquivos relevantes. Não adivinhe — leia o código.

Perguntas para guiar a investigação:

- É um problema de UI (state, render)?
- É um problema de validação ou lógica de negócio?
- É um problema de query ou dados no banco?
- É um problema de permissão/auth?
- É um problema de timing/race condition?

### 4. Crie a tarefa BUG-NNN

**Antes de qualquer correção**, crie `projects/{nome}/tasks/BUG-{NNN}-{nome-kebab}.md`:

```markdown
# BUG-{NNN} — {Título descritivo}

**Tipo**: Bug
**Reportado**: {data}
**Status**: ⬜ Aguardando aprovação

## Sintoma

{O que o usuário observava — seja específico}

## Causa raiz

{Por que acontecia — arquivo, linha, lógica incorreta}

## Correção proposta

{O que será mudado, onde e por quê essa abordagem}

## Arquivos a modificar

- `{caminho/arquivo.ts}` — {descrição da mudança}

## Progresso

- [ ] `{caminho/arquivo}` — pendente

## Critérios de aceite

- [ ] {comportamento esperado após o fix}
- [ ] Nenhuma regressão introduzida nos fluxos relacionados
```

Adicione ao `BACKLOG.md` na seção **Bugs**.

### 5. Apresente e aguarde aprovação

**PARE AQUI.** Apresente ao usuário:

```markdown
## BUG-{NNN} — {Título}

**Causa raiz**: {resumo em 1 linha}

**Correção proposta**: {resumo em 1-2 linhas}

**Arquivos afetados**: {lista}

**Risco de regressão**: Alto / Médio / Baixo — {motivo}

**Aprovar para aplicar o fix?**
```

Só avance quando o usuário confirmar explicitamente.

### 6. Aplique o fix (após aprovação)

Leia a seção `## Localização` do `_context.md` (campo `Código:`) e resolva todos os caminhos de arquivo a partir dessa raiz antes de modificar qualquer arquivo.

Atualize o status do `BUG-{NNN}.md` para `🔄 Em correção`.

Aplique a correção com escopo mínimo:

- Corrija apenas o que está errado
- Não refatore código fora do escopo
- Atualize `## Progresso` a cada arquivo modificado

### 7. Verifique regressões

Após a correção, verifique se o fix pode quebrar algo que estava funcionando:

- Há outros lugares que usam o mesmo código?
- A correção afeta outros fluxos do produto?

### 8. Finalize a tarefa

Atualize `BUG-{NNN}.md`:

- Mude Status para `✅ Corrigido`
- Marque todos os itens do `## Progresso` como `[x]`
- Marque os critérios de aceite verificados

Atualize `BACKLOG.md`: mude o status do bug para `✅`.

---

## Saída esperada

- `projects/{nome}/tasks/BUG-{NNN}.md` criado (antes do fix)
- Bug corrigido (após aprovação)
- `BACKLOG.md` atualizado

## Próximo passo

> "Use agents/05-review.md para revisar o fix do BUG-{NNN} do projeto {nome}"
