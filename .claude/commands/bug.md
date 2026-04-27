---
name: bug
description: >
  Reporta um bug e inicia o ciclo de correção. Coleta as informações mínimas
  necessárias, cria bugs/[slug].md e aciona o debug-agent. Pode ser usado
  a qualquer momento, independente da fase atual do projeto.
---

# /bug

## O que este comando faz

1. Coleta as informações mínimas sobre o bug
2. Gera um slug para o bug report
3. Cria `.spec/bugs/[slug].md` com o template preenchido
4. Aciona o `debug-agent`

## Coleta de informações

Após receber a descrição inicial, colete obrigatoriamente:

### Se a descrição inicial for vaga (menos de 2 frases):

Pergunte tudo de uma vez:

```
Para investigar o bug eficientemente, preciso de mais contexto:

1. O que deveria acontecer? (comportamento esperado)
2. O que está acontecendo de fato? (comportamento atual)
3. Como reproduzir? (passos específicos)
4. Tem stack trace ou mensagem de erro? (cole aqui se tiver)
5. Quais arquivos ou partes do sistema suspeita? (se souber)
```

### Se a descrição for clara:

Infira o máximo possível e preencha o template com o que foi fornecido.
Não faça perguntas desnecessárias — o debug-agent vai investigar o resto.

## Geração do slug

Gere um slug descritivo a partir da descrição:
- Lowercase, hífens
- 3-5 palavras
- Descreve o problema, não o componente

Exemplos:
- `login-email-not-found-error` ❌ vago → `login-fails-valid-credentials`
- `bug-payment` ❌ genérico → `stripe-webhook-duplicate-charge`
- `null-pointer` ❌ técnico demais → `project-list-crashes-empty-state`

## Criação do bug report

```
cp .spec/templates/bug.md .spec/bugs/[slug].md
```

Preencha com as informações coletadas:
- Campos que você tem → preencha
- Campos que não tem → deixe como `[a investigar]`, não delete

Prioridade padrão: `high`
Eleve para `critical` se:
- Impede o fluxo principal do produto
- Afeta dados de usuários
- Está em produção com usuários ativos

## Atualiza STATUS.md

Adiciona o bug na seção "Blockers ativos":
```markdown
| bug | [slug] | [descrição resumida] | bugs/[slug].md |
```

## Aciona debug-agent

```
🐛 Bug reportado: [slug]

Prioridade: [prioridade]
Arquivo(s) suspeito(s): [lista se houver]

Acionando debug-agent...
```

Passa para o `debug-agent`:
- Path do arquivo `bugs/[slug].md`
- Instrução para seguir o processo da skill `root-cause-analyzer`

## Uso

```
/bug "ao tentar fazer login com email e senha corretos, recebo
'Credenciais inválidas'. Já confirmei que o usuário existe no banco."
```

```
/bug "a listagem de projetos fica em loading infinito quando o usuário
não tem nenhum projeto criado"
```

```
/bug "erro 500 ao tentar cancelar assinatura"
```
