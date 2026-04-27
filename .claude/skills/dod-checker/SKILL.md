---
name: dod-checker
description: >
  Carregue esta skill ao verificar se uma task ou feature satisfaz o Definition
  of Done antes de marcar como concluída. Usada pelo impl-agent antes de cada
  commit e pelo review-agent ao revisar uma feature. Ativa sempre que houver
  necessidade de verificar completude de uma entrega.
---

# DoD Checker

Sua função é verificar cada item do Definition of Done antes de qualquer commit
ou aprovação. Nenhuma task avança sem este checklist 100% satisfeito.

## Processo para o impl-agent

### Antes do commit, execute em ordem:

**1. Rode os comandos de qualidade**
```
lint:       [comando de tech-stack.md]
type-check: [comando de tech-stack.md]
testes:     [comando de tech-stack.md]
```

Se qualquer comando falhar — pare. Corrija antes de continuar.

**2. Verifique o código manualmente**
- [ ] Nenhum `TODO`, `FIXME`, `HACK` ou `XXX` no código entregue
- [ ] Nenhum `console.log` esquecido
- [ ] Nenhum valor hardcoded que deveria ser variável de ambiente
- [ ] Nenhum import não utilizado
- [ ] Nenhuma função sem uso

**3. Verifique a cobertura da spec**
Abra `features/[slug].md` e confirme:
- [ ] Cada critério EARS `AC-NN` tem implementação correspondente
- [ ] Os fluxos de erro estão implementados (não só o happy path)
- [ ] As regras de negócio `RN-NN` estão refletidas no código

**4. Verifique dependências e estado**
- [ ] O `depends_on` desta task está `done: true` no STATUS.md
- [ ] Se adicionou nova dependência externa: documentada em `tech-stack.md`
- [ ] Se criou nova variável de ambiente: documentada em `tech-stack.md`
- [ ] Se fez migration: testou o rollback

**5. Verifique decisões tomadas**
- [ ] Tomou alguma decisão não documentada nas specs?
  → Se sim: crie `ADR/[slug].md` ANTES de fazer o commit

**6. Faça o commit**
Formato: conforme `tech-stack.md` seção "Padrão de commit"
Escopo: uma task por commit — nunca misture tasks

**7. Atualize STATUS.md**
```markdown
| task-NN | done: true |
```

## Processo para o review-agent

### Ao revisar uma feature completa:

**1. Verifique o checklist de feature do DoD**
- [ ] Todos os user stories implementados
- [ ] Todos os critérios EARS cobertos e verificáveis
- [ ] Nenhum blocker em aberto de tasks anteriores
- [ ] ADRs criados para decisões tomadas durante implementação

**2. Verifique cobertura de testes**
- [ ] Há testes para o fluxo principal
- [ ] Há testes para os casos de erro
- [ ] Os testes passam no estado atual do código

**3. Classifique issues encontrados**
- **blocker:** item do DoD não satisfeito → impede aprovação
- **warning:** problema real mas não bloqueia → deve ser endereçado em breve
- **suggestion:** melhoria opcional → não exige resposta

Todo blocker deve referenciar o item do DoD ou critério EARS não atendido.

## Resultado esperado

O impl-agent marca `done: true` no STATUS.md **apenas** após:
1. Todos os comandos passando
2. Todos os itens do checklist marcados
3. Commit feito com mensagem correta
4. STATUS.md atualizado

O review-agent marca a feature como `approved` **apenas** após:
1. Checklist de feature 100% satisfeito
2. Zero blockers em `review/[slug].md`
