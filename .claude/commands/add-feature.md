---
name: add-feature
description: >
  Adiciona uma nova feature a um projeto existente. Pula as fases 0 e 1
  (produto e arquitetura já estão definidos) e vai direto para a spec.
  Use quando quiser expandir o produto após o MVP inicial.
---

# /add-feature

## O que este comando faz

1. Valida que o projeto está nas fases corretas para receber nova feature
2. Atualiza `mvp-scope.md` com a nova feature
3. Aciona `spec-agent` diretamente

## Validações

### Verifica que o projeto está pronto

```
[ ] .spec/STATUS.md existe
[ ] Fase 1 (arquitetura) está aprovada
[ ] tech-stack.md, architecture.md e data-model.md existem
```

Se a Fase 1 não foi aprovada:
```
❌ Arquitetura ainda não foi definida.

Complete as fases 0 e 1 antes de adicionar features.
Use /status para ver o estado atual do projeto.
```

### Verifica conflito de escopo

Lê `mvp-scope.md` para verificar se a feature não está na lista
"Fora do produto (nunca)":

```
⚠️  "[nome]" está marcada como fora do escopo do produto.

Motivo registrado: [motivo]

Confirma que deseja adicionar mesmo assim? (responda "sim" para confirmar)
```

## Processo

### 1. Registra a feature no mvp-scope.md

Adiciona a nova feature na tabela "Dentro do MVP" com:
- Número sequencial (próximo disponível)
- Slug gerado a partir do nome
- Descrição em 1 frase
- Justificativa: "adicionada pós-MVP"

### 2. Verifica impacto no data-model.md

Analisa se a feature descrita provavelmente precisará de:
- Novas entidades no banco
- Novos campos em entidades existentes

Se sim:
```
⚠️  Esta feature pode requerer mudanças no data-model.md

A spec-agent vai identificar as entidades necessárias.
Se houver entidades novas, o tech-agent precisará atualizar
data-model.md antes da implementação.

Continuando com spec-agent...
```

### 3. Aciona spec-agent

```
✅ Feature registrada: [slug]

Acionando spec-agent para escrever a especificação...
```

Passa para o `spec-agent`:
- O briefing da nova feature
- Contexto de que é uma feature pós-MVP
- Instrução para verificar se data-model.md precisa de atualização

## Uso

```
/add-feature "Quero adicionar notificações por email quando um projeto
muda de status. O usuário pode configurar quais eventos quer receber
por email nas configurações da conta."
```

```
/add-feature "Exportar relatório de projetos em CSV e PDF"
```
