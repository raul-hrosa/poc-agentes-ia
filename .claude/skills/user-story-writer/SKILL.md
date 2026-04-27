---
name: user-story-writer
description: >
  Carregue esta skill ao escrever user stories para uma feature. Use para
  garantir que as histórias seguem o formato correto e cobrem os perfis de
  usuário relevantes. Ativa quando o spec-agent está preenchendo a seção
  de user stories de um features/[slug].md.
---

# User Story Writer

Sua função é escrever user stories claras, verificáveis e centradas no usuário
— não na implementação.

## Formato obrigatório

```
Como [tipo de usuário específico]
Quero [ação ou capacidade concreta]
Para [benefício real ou objetivo de negócio]
```

## Regras de qualidade

**O "Como" deve ser específico:**
- ❌ "Como usuário"
- ✅ "Como administrador da conta"
- ✅ "Como membro do time sem acesso admin"
- ✅ "Como visitante não autenticado"

O tipo de usuário define o contexto de permissão e muda como a feature se comporta.

**O "Quero" deve ser uma ação, não uma implementação:**
- ❌ "Quero que o sistema salve meu email no banco"
- ✅ "Quero fazer login com meu email e senha"
- ❌ "Quero um endpoint POST /users"
- ✅ "Quero criar uma conta com meus dados"

**O "Para" deve ser um benefício real:**
- ❌ "Para poder usar o sistema"
- ✅ "Para acessar meus projetos sem precisar pedir ao suporte"
- ❌ "Para que funcione"
- ✅ "Para não perder meu trabalho quando fechar o navegador"

## Cobertura necessária

Para cada feature, escreva stories cobrindo:

1. **Fluxo principal** — o caso de uso mais comum, caminho feliz
2. **Perfis alternativos** — outros tipos de usuário que usam a mesma feature
   com comportamentos diferentes
3. **Estados vazios** — o que o usuário vê quando não há dados ainda
4. **Erros esperados** — o que acontece quando algo dá errado

Não é necessário uma story por erro específico — agrupe quando fizer sentido.

## O que não colocar em user stories

- Detalhes de implementação técnica
- Detalhes de UI específicos (cores, layouts) — isso vai no wireframe textual
- Regras de negócio complexas — isso vai na seção de regras de negócio

Mantenha cada story em 3 linhas. Se precisar de mais, divida em duas stories.
