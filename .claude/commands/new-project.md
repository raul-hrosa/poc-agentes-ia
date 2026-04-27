---
name: new-project
description: >
  Inicia um novo projeto SDD a partir de um briefing em texto livre.
  Cria a pasta projects/[nome]/ com estrutura .spec/ e aciona o
  product-agent para formalizar o produto. Use quando começar um projeto do zero.
---

# /new-project

## O que este comando faz

1. Gera um slug de nome a partir do briefing
2. Cria `projects/[nome]/` com a estrutura `.spec/` completa
3. Aciona o `product-agent` com o briefing fornecido

## Passos

### 1. Garanta que a pasta projects/ existea

```bash
mkdir -p projects
```

### 2. Gere o nome do projeto

A partir do briefing, extraia um slug descritivo:
- Lowercase, hífens em vez de espaços
- 2-4 palavras que identificam o produto
- Exemplos: `fila-barbearia`, `link-bio-analytics`, `contratos-freelancer`

Se não conseguir inferir um nome claro do briefing, use o formato:
`projeto-[data]` (ex: `projeto-2025-01`)

### 3. Verifique se o projeto já existe

Se `projects/[nome]/` já existe:
```
⚠️  Já existe um projeto com este nome: projects/[nome]/

Use /status para ver o estado atual deste projeto.
Use /add-feature "briefing" para adicionar uma feature.

Se quiser criar um projeto com nome diferente, informe o nome desejado.
```

Pare aqui. Não sobrescreva um projeto existente.

### 4. Crie a estrutura do projeto

```bash
mkdir -p projects/[nome]/.spec/features
mkdir -p projects/[nome]/.spec/tasks
mkdir -p projects/[nome]/.spec/review
mkdir -p projects/[nome]/.spec/bugs
mkdir -p projects/[nome]/.spec/ADR
mkdir -p projects/[nome]/src
```

Copie os templates base para o projeto:
```bash
cp .spec/templates/* projects/[nome]/.spec/  # apenas os templates de referência
```

### 5. Confirme e acione o product-agent

```
🚀 Novo projeto criado: projects/[nome]/

Estrutura:
  projects/[nome]/
    .spec/       ← specs do projeto
    src/         ← código será gerado aqui

Acionando product-agent...
```

Acione o `product-agent` passando:
- O briefing completo do usuário
- O path do projeto: `projects/[nome]/`

O product-agent vai criar os arquivos dentro de `projects/[nome]/.spec/`.

## Uso

```
/new-project "Quero construir um SaaS de gestão de filas para barbearias.
O barbeiro configura os serviços e preços, o cliente entra na fila pelo
celular sem precisar de app, vê sua posição em tempo real e recebe aviso
quando é sua vez. Quero cobrar R$49/mês por barbearia."
```

O briefing pode ser curto ou longo — o product-agent vai extrair o necessário
e fazer perguntas se precisar de mais informação.

## Resultado esperado

```
projects/
  fila-barbearia/
    .spec/
      STATUS.md        ← criado pelo product-agent
      product.md       ← criado pelo product-agent
      mvp-scope.md     ← criado pelo product-agent
    src/               ← vazio, aguardando implementação
```
---
name: new-project
description: >
  Inicia um novo projeto SDD a partir de um briefing em texto livre.
  Cria a pasta projects/[nome]/ com estrutura .spec/ e aciona o
  product-agent para formalizar o produto. Use quando começar um projeto do zero.
---

# /new-project

## O que este comando faz

1. Gera um slug de nome a partir do briefing
2. Cria `projects/[nome]/` com a estrutura `.spec/` completa
3. Aciona o `product-agent` com o briefing fornecido

## Passos

### 1. Garanta que a pasta projects/ existea

```bash
mkdir -p projects
```

### 2. Gere o nome do projeto

A partir do briefing, extraia um slug descritivo:
- Lowercase, hífens em vez de espaços
- 2-4 palavras que identificam o produto
- Exemplos: `fila-barbearia`, `link-bio-analytics`, `contratos-freelancer`

Se não conseguir inferir um nome claro do briefing, use o formato:
`projeto-[data]` (ex: `projeto-2025-01`)

### 3. Verifique se o projeto já existe

Se `projects/[nome]/` já existe:
```
⚠️  Já existe um projeto com este nome: projects/[nome]/

Use /status para ver o estado atual deste projeto.
Use /add-feature "briefing" para adicionar uma feature.

Se quiser criar um projeto com nome diferente, informe o nome desejado.
```

Pare aqui. Não sobrescreva um projeto existente.

### 4. Crie a estrutura do projeto

```bash
mkdir -p projects/[nome]/.spec/features
mkdir -p projects/[nome]/.spec/tasks
mkdir -p projects/[nome]/.spec/review
mkdir -p projects/[nome]/.spec/bugs
mkdir -p projects/[nome]/.spec/ADR
mkdir -p projects/[nome]/src
```

Copie os templates base para o projeto:
```bash
cp .spec/templates/* projects/[nome]/.spec/  # apenas os templates de referência
```

### 5. Confirme e acione o product-agent

```
🚀 Novo projeto criado: projects/[nome]/

Estrutura:
  projects/[nome]/
    .spec/       ← specs do projeto
    src/         ← código será gerado aqui

Acionando product-agent...
```

Acione o `product-agent` passando:
- O briefing completo do usuário
- O path do projeto: `projects/[nome]/`

O product-agent vai criar os arquivos dentro de `projects/[nome]/.spec/`.

## Uso

```
/new-project "Quero construir um SaaS de gestão de filas para barbearias.
O barbeiro configura os serviços e preços, o cliente entra na fila pelo
celular sem precisar de app, vê sua posição em tempo real e recebe aviso
quando é sua vez. Quero cobrar R$49/mês por barbearia."
```

O briefing pode ser curto ou longo — o product-agent vai extrair o necessário
e fazer perguntas se precisar de mais informação.

## Resultado esperado

```
projects/
  fila-barbearia/
    .spec/
      STATUS.md        ← criado pelo product-agent
      product.md       ← criado pelo product-agent
      mvp-scope.md     ← criado pelo product-agent
    src/               ← vazio, aguardando implementação
```
