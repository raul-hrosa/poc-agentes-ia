---
name: status
description: >
  Exibe o estado atual de um projeto específico ou lista todos os projetos
  existentes em projects/. Use para saber onde o projeto está após retomar
  uma sessão ou para ter uma visão geral rápida.
---

# /status

## O que este comando faz

- Sem argumento → lista todos os projetos em `projects/`
- Com argumento → mostra o estado detalhado do projeto informado

## Sem argumento — lista todos os projetos

Se `projects/` não existe ou está vazia:
```
Nenhum projeto encontrado em projects/

Use /new-project "sua ideia" para criar seu primeiro projeto.
```

Se houver projetos:
```
📁 Projetos em projects/

  fila-barbearia/       Fase 4 — Implementação   2/5 features done
  link-bio-analytics/   Fase 2 — Specs            aguardando aprovação
  contratos-freelancer/ Fase 0 — Produto          aguardando aprovação

Use /status "nome-do-projeto" para ver detalhes.
```

## Com argumento — estado detalhado

Lê `projects/[nome]/.spec/STATUS.md` e apresenta:

```
📋 [Nome do projeto]  →  projects/[nome]/
   Iniciado em: [data] | Última atualização: [data]

─────────────────────────────────────────

FASE ATUAL: [n] — [nome da fase]
Status: [Aguardando aprovação | Em execução | Bloqueado]

─────────────────────────────────────────

GATES
  ✅ Fase 0 — Produto aprovado
  ✅ Fase 1 — Arquitetura aprovada
  ⏳ Fase 2 — Specs em andamento
  ○  Fase 3 — Tasks
  ○  Fase 4 — Implementação
  ○  Fase 5 — Revisão

─────────────────────────────────────────

FEATURES DO MVP ([n] de [total] concluídas)

  ✅ user-auth             done
  🔄 billing-subscription  implementing
       task-01 ✅  task-02 🔄  task-03 ⏳
  ⏳ project-dashboard     pending spec

─────────────────────────────────────────

STACK
  [resumo em 1 linha]

─────────────────────────────────────────

BLOCKERS ATIVOS
  🐛 login-fails-valid-credentials

─────────────────────────────────────────

PRÓXIMO PASSO
  [descrição clara]
  Comando: [o comando exato a executar]
```

## Lógica do "Próximo Passo"

| Situação | Próximo passo |
|---|---|
| Fase 0 concluída, gate pendente | `/approve-phase` |
| Fase 1 concluída, gate pendente | `/approve-phase` |
| Feature com spec pendente | `/approve-phase` |
| Feature com tasks prontas | `/implement "[slug]"` |
| Feature em implementação | Aguardar ou verificar blockers |
| Review com blockers | Corrigir e `/review "[slug]"` |
| Bug aberto | Aguardar debug-agent |
| Todas as features done | 🎉 MVP concluído |

## Uso

```
/status
/status "fila-barbearia"
/status "link-bio-analytics"
```
