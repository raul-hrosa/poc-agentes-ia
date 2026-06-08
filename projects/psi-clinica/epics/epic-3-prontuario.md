# Épico 3 — Prontuário Digital

## Objetivo

Registro criptografado de evoluções de sessão, plano terapêutico e emissão de documentos clínicos em PDF — em conformidade com CFP (dados mantidos por mínimo 5 anos, sem exclusão).

## Tarefas

| ID | Título | Prioridade | Complexidade | Status |
|----|--------|-----------|-------------|--------|
| [T-018](../tasks/T-018-prontuario-api.md) | API de prontuário (CRUD criptografado, versionamento) | P1 | L | ⬜ |
| [T-019](../tasks/T-019-plano-terapeutico-api.md) | API de plano terapêutico (criptografado, versões) | P2 | M | ⬜ |
| [T-020](../tasks/T-020-editor-evolucao-frontend.md) | Frontend editor de evolução Tiptap (vinculado à sessão) | P1 | M | ⬜ |
| [T-021](../tasks/T-021-plano-terapeutico-frontend.md) | Frontend plano terapêutico (metas criptografadas) | P2 | M | ⬜ |
| [T-022](../tasks/T-022-documentos-clinicos-api.md) | API documentos clínicos e exportação prontuário PDF | P2 | L | ⬜ |
| [T-023](../tasks/T-023-documentos-clinicos-frontend.md) | Frontend geração de documentos clínicos (declaração, relatório, etc.) | P2 | M | ⬜ |

## Dependências

- Requer épico 0 — `CryptoService` e banco
- Requer épico 1 — pacientes
- Requer épico 2 — sessões (prontuário vinculado à sessão)

## Definição de pronto

- [ ] Todas as tarefas do épico concluídas
- [ ] Revisão feita (agents/05-review.md)
- [ ] Testes criados (agents/06-tester.md)
