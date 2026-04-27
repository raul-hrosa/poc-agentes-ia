---
name: refine-product
description: >
  Abre uma segunda rodada de refinamento com o product-agent para ajustar
  product.md ou mvp-scope.md. Use quando quiser mudar a visão do produto,
  adicionar contexto ou revisar o escopo do MVP antes de avançar para
  arquitetura.
---

# /refine-product

## O que este comando faz

1. Verifica que ainda é seguro alterar o produto (Fase 1 não iniciada)
2. Apresenta o estado atual de `product.md` e `mvp-scope.md`
3. Aciona o `product-agent` em modo de refinamento

## Verificação de segurança

### Se Fase 1 (arquitetura) já foi aprovada:

```
⚠️  A arquitetura já foi definida com base no produto atual.

Alterar product.md ou mvp-scope.md agora pode criar inconsistências
com tech-stack.md, architecture.md e data-model.md.

Se quiser prosseguir, o tech-agent precisará revisar a arquitetura
após o refinamento.

Confirma que deseja refinar o produto mesmo assim? (responda "sim")
```

Se o usuário confirmar, prossegue com aviso de que a Fase 1 precisará
ser revisada.

## Execução

Apresenta o resumo atual:

```
📋 Estado atual do produto

product.md:
  Produto: [nome]
  Problema: [resumo]
  Público: [resumo]
  Modelo: [monetização]

mvp-scope.md:
  MVP inclui: [n] features
  MVP exclui: [n] itens no backlog

O que você quer ajustar?
```

Aciona `product-agent` em modo refinamento com:
- Conteúdo atual de `product.md` e `mvp-scope.md`
- Instrução para atualizar os arquivos existentes (não recriar)
- Instrução para registrar o que mudou em relação à versão anterior

## Uso

```
/refine-product
```

Sem argumentos — o product-agent vai perguntar o que você quer ajustar.

Ou com contexto direto:

```
/refine-product "Mudei de ideia sobre o modelo de monetização.
Quero cobrar por transação em vez de assinatura mensal."
```

```
/refine-product "Preciso remover a feature de relatórios do MVP.
Ficou grande demais."
```
