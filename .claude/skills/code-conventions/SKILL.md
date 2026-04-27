---
name: code-conventions
description: >
  Carregue esta skill antes de qualquer implementação. Injeta os padrões de
  código do projeto no contexto do impl-agent. Ativa automaticamente quando
  o impl-agent começa uma nova task. Deve ser precarregada obrigatoriamente.
---

# Code Conventions

Antes de escrever qualquer linha de código, leia e siga estas convenções.
Elas são não-negociáveis — garantem consistência em todo o codebase.

## Passo 1 — Leia os padrões do projeto

Abra `tech-stack.md` e localize:
- Seção "Padrões de código" — naming, estilo, estrutura de pastas
- Seção "Padrão de commit" — formato exato dos commits
- Seção "Comandos do projeto" — lint, type-check, testes

Abra `architecture.md` e localize:
- Seção "Convenções obrigatórias" — regras de camada e fluxo de dados
- Seção "Estrutura de pastas" — onde cada tipo de arquivo mora
- Seção "Tratamento de erros" — como erros são propagados

**Estes arquivos são a fonte de verdade. Esta skill não substitui o que está neles.**

## Passo 2 — Aplique antes de criar qualquer arquivo

Checklist antes de criar um arquivo:
- [ ] O arquivo vai para o path correto conforme `architecture.md`?
- [ ] O nome segue o padrão de nomenclatura de `tech-stack.md`?
- [ ] A lógica de negócio está na camada correta (service, não route)?
- [ ] Input está sendo validado no edge (antes de chegar ao service)?
- [ ] Erros estão sendo tratados conforme o padrão definido?

## Passo 3 — Padrões universais (valem para qualquer stack)

**Nunca hardcode valores que mudam por ambiente:**
```typescript
// ❌ errado
const API_URL = "https://api.meuapp.com"

// ✅ correto
const API_URL = process.env.API_URL
```

**Nunca deixe console.log no código entregue:**
Use o logger do projeto ou remova antes do commit.

**Nunca ignore erros silenciosamente:**
```typescript
// ❌ errado
try { await doSomething() } catch (_) {}

// ✅ correto
try { await doSomething() } catch (error) {
  logger.error("doSomething failed", { error })
  throw error
}
```

**Nunca faça query direta fora da camada de repositório/service:**
```typescript
// ❌ errado — query na route/action
const user = await db.user.findFirst({ where: { id } })

// ✅ correto — delega para o service
const user = await userService.findById(id)
```

**Sempre valide input no edge:**
Antes de qualquer lógica de negócio, valide com o schema Zod/Yup/Valibot
definido para aquele endpoint ou action.

## Passo 4 — Antes do commit

Execute na ordem:
1. `[comando de lint]` — deve passar sem erros
2. `[comando de type-check]` — deve passar sem erros
3. `[comando de testes]` — todos devem passar
4. Revise manualmente: há algum TODO, console.log ou placeholder?

Os comandos exatos estão em `tech-stack.md` seção "Comandos do projeto".
