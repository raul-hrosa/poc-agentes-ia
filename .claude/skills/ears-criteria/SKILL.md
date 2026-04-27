---
name: ears-criteria
description: >
  Carregue esta skill ao escrever critérios de aceite no padrão EARS. Use para
  garantir que os critérios são verificáveis, não ambíguos e cobrem fluxos
  alternativos e casos de erro. Ativa quando o spec-agent está preenchendo
  a seção de critérios de aceite de um features/[slug].md.
---

# EARS Criteria

EARS (Easy Approach to Requirements Syntax) é um padrão para escrever critérios
de aceite que podem ser verificados de forma binária: passou ou não passou.

## Formatos EARS

### Quando/Então (Event-Response) — mais comum
```
WHEN [evento ou ação do usuário]
THEN [comportamento do sistema]
```

### Condição/Quando/Então (State-driven)
```
WHILE [estado do sistema]
WHEN [evento]
THEN [comportamento]
```

### Ubíquo (sempre válido)
```
THE SYSTEM SHALL [comportamento sempre ativo]
```

## Regras de qualidade

**Cada critério deve ser verificável em menos de 5 minutos.**
Se você não consegue descrever como testar o critério, ele está mal escrito.

**Use linguagem concreta, não vaga:**
- ❌ "WHEN o usuário faz login THEN o sistema deve funcionar"
- ✅ "WHEN o usuário submete email e senha válidos THEN o sistema redireciona para /dashboard e exibe o nome do usuário no header"

**Seja específico sobre estados e dados:**
- ❌ "WHEN há erro THEN exibir mensagem"
- ✅ "WHEN o email informado não está cadastrado THEN exibir 'Email não encontrado' abaixo do campo de email"

**Cubra os limites, não só o centro:**
- O que acontece com input vazio?
- O que acontece com input inválido?
- O que acontece quando o servidor está lento?
- O que acontece quando o usuário não tem permissão?

## Cobertura mínima por feature

Todo conjunto de critérios deve ter:

| Categoria | Mínimo |
|---|---|
| Fluxo principal (happy path) | 2-3 critérios |
| Fluxos alternativos | 1-2 critérios |
| Validação de input | 1 por campo obrigatório |
| Casos de erro do sistema | 1-2 critérios |
| Autorização/permissão | 1 critério (se feature tem auth) |
| Estado vazio | 1 critério (se feature lista dados) |

## Exemplos

### Auth — Login
```
AC-01: WHEN o usuário submete email e senha válidos
       THEN o sistema cria uma sessão e redireciona para /dashboard

AC-02: WHEN o usuário submete email não cadastrado
       THEN o sistema exibe "Email ou senha incorretos" sem indicar qual está errado

AC-03: WHEN o usuário submete senha incorreta 3 vezes consecutivas
       THEN o sistema bloqueia o login por 15 minutos e exibe o tempo restante

AC-04: WHEN o usuário clica em "Esqueci minha senha"
       THEN o sistema envia email de recuperação e exibe "Verifique seu email"

AC-05: WHEN usuário não autenticado tenta acessar rota protegida
       THEN o sistema redireciona para /login com o parâmetro redirect_to
```

### Listagem com filtro
```
AC-01: WHEN o usuário acessa a listagem sem filtros ativos
       THEN o sistema exibe os 20 itens mais recentes ordenados por created_at desc

AC-02: WHEN não há itens cadastrados
       THEN o sistema exibe o estado vazio com call-to-action para criar o primeiro item

AC-03: WHEN o usuário aplica um filtro
       THEN o sistema atualiza a listagem sem recarregar a página e exibe o total filtrado

AC-04: WHEN o usuário chega no final da lista
       THEN o sistema carrega os próximos 20 itens automaticamente (infinite scroll)
```

## Numeração

Use o formato `AC-NN` sequencial dentro da feature.
O review-agent referencia esses números ao reportar issues.
