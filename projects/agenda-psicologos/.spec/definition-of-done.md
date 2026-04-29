> Personalizado para: Next.js 14 + TypeScript + Prisma + Supabase + Vitest em 2026-04-27

# Definition of Done — PsiAgenda

Este documento define o critério mínimo que toda task de implementação deve
satisfazer antes de ser marcada como concluída. Nenhuma task avança para revisão
sem passar por este checklist completo.

---

## Checklist por task

### Qualidade de código

- [ ] Código passa em lint sem erros: `pnpm lint`
- [ ] Código passa em type-check sem erros: `pnpm typecheck`
- [ ] Nenhum `any` implícito no código novo (regra `noImplicitAny` ativa no tsconfig)
- [ ] Nenhum `console.log` ou `console.error` manual no código de produção (usar Sentry)
- [ ] Nenhum `TODO` ou `FIXME` no código entregue — ou está documentado em bug/task separada
- [ ] Componentes React não têm lógica de negócio — apenas apresentação e chamadas a Server Actions

### Testes

- [ ] Testes unitários para toda lógica em `actions/` e `queries/` que tenha condicionais
- [ ] Testes passam sem falha: `pnpm test`
- [ ] Cobertura de testes não diminuiu em relação à task anterior: `pnpm test:coverage`
- [ ] Casos de erro testados (input inválido, usuário não autenticado, recurso não encontrado)

### Segurança e autenticação

- [ ] Toda Server Action começa com `getCurrentUser()` e lança erro se não autenticado
- [ ] Todo query de banco filtra por `user_id` do usuário autenticado (sem vazar dados de outros psicólogos)
- [ ] Nenhuma variável de ambiente secreta exposta com prefixo `NEXT_PUBLIC_`
- [ ] Inputs externos validados com Zod antes de qualquer operação de banco
- [ ] Tokens de confirmação: gerados com HMAC-SHA256, expiração de 72h, uso único verificado

### LGPD e CFP

- [ ] Dados de prontuário (`session_notes`) acessíveis apenas via `user_id` autenticado
- [ ] Dados de paciente (`birth_date`, `phone`) não expostos em logs ou respostas de erro
- [ ] Sem exposição de dados de paciente em URLs (IDs são UUIDs opacos)
- [ ] Página de confirmação por token não exibe dados de saúde do paciente

### Mobile-first

- [ ] Componente novo funciona em viewport 375px de largura (iPhone SE) sem scroll horizontal
- [ ] Targets de toque com mínimo 44x44px para elementos interativos
- [ ] Formulários usam tipos de input corretos para mobile (`type="tel"` para telefone, `type="email"` para e-mail)
- [ ] Sem ações que dependem exclusivamente de hover — devem funcionar em toque

### Banco de dados

- [ ] Nenhuma migration órfã (sem nome descritivo) — geradas com `pnpm db:migrate`
- [ ] Prisma Client regenerado após mudança de schema: `pnpm db:generate`
- [ ] Novas colunas obrigatórias têm DEFAULT definido na migration
- [ ] Sem queries N+1 — relações carregadas com `include` ou `select` quando necessário

### Build e deploy

- [ ] Build passa sem erros: `pnpm build`
- [ ] Sem warnings de "missing keys" em listas React
- [ ] Sem dependências instaladas que não são usadas no código

### Commit

- [ ] Commit segue o padrão: `<type>(<scope>): <descrição em imperativo>`
- [ ] Exemplos válidos: `feat(appointments): criar página de agenda semanal`
- [ ] Um commit por task (ou por conjunto coeso de mudanças da task)
- [ ] Nenhum arquivo `.env` ou `.env.local` commitado

---

## Comandos de verificação

| Item | Comando |
|---|---|
| Lint | `pnpm lint` |
| Type-check | `pnpm typecheck` |
| Testes | `pnpm test` |
| Cobertura | `pnpm test:coverage` |
| Build | `pnpm build` |
| Aplicar migrations (dev) | `pnpm db:migrate` |
| Aplicar migrations (prod) | `pnpm db:migrate:deploy` |
| Regenerar Prisma Client | `pnpm db:generate` |
| Padrão de commit | `feat(scope): descrição em imperativo` |

---

## Critérios de qualidade de código

### Obrigatórios

- TypeScript strict mode ativo (`"strict": true` em tsconfig.json)
- Nenhuma importação circular entre features (cada feature é autossuficiente)
- Server Actions em arquivos separados com `"use server"` no topo
- Zod schemas definidos em `schema.ts` por feature, nunca inline em componentes
- Prisma Client usado apenas via singleton `shared/lib/prisma.ts`

### Nomenclatura

- Componentes: PascalCase (`PatientCard.tsx`)
- Actions e queries: camelCase (`createPatient.ts`, `getPatientById.ts`)
- Tipos e interfaces: PascalCase (`AppointmentStatus`)
- Constantes: SCREAMING_SNAKE_CASE (`MAX_FREE_PATIENTS`)
- Pastas de feature: kebab-case (`appointments/`)

---

## Critérios de segurança

### Autenticação

- Middleware protege todas as rotas sob `/(auth)/`
- Toda Server Action valida autenticação independentemente do middleware
- Sessão usa cookies httpOnly via Supabase SSR (sem JWT em localStorage)

### Autorização e isolamento de dados

- RLS ativo no Supabase para todas as tabelas de dados clínicos
- Queries Prisma sempre incluem `where: { userId: user.id }` para dados do psicólogo
- Nunca retornar lista de recursos sem filtro de `user_id`

### Dados sensíveis

- Prontuário nunca aparece em URL, header ou log
- Dados de paciente não são expostos na página pública de confirmação
- `stripe_customer_id` e `stripe_subscription_id` não são expostos ao cliente

### Tokens de confirmação

- Token gerado com `crypto.createHmac('sha256', APP_SECRET)`
- Expiração verificada em tempo de validação (não apenas em criação)
- Token marcado como `used_at = now()` atomicamente na mesma transação que atualiza o appointment
- Rate limiting considerado para a rota pública `/confirm/[token]` (implementar após MVP se necessário)

---

## Critérios de acessibilidade e mobile

### Acessibilidade mínima (WCAG 2.1 nível AA)

- Contraste de texto mínimo 4.5:1 para texto normal, 3:1 para texto grande
- Todo input tem `<label>` associado (ou `aria-label`)
- Imagens decorativas têm `alt=""`; imagens com significado têm `alt` descritivo
- Foco de teclado visível em todos os elementos interativos
- Erros de formulário anunciados via `aria-describedby` ou `role="alert"`

### Mobile-first

- Design começa em 375px (iPhone SE) e expande para telas maiores
- Scroll vertical apenas — sem scroll horizontal em nenhuma viewport >= 375px
- Texto mínimo 16px para evitar zoom automático do iOS em inputs
- Bottom navigation ou ações principais acessíveis com o polegar (zona de conforto inferior)
- Loading states visíveis para ações assíncronas (skeleton ou spinner)

---

## O que não bloqueia a entrega

Os itens abaixo são desejáveis mas não bloqueiam a conclusão de uma task no MVP:

- Testes E2E (Playwright) — adicionados após MVP
- Storybook de componentes — adicionado após MVP
- Performance budget (Lighthouse) — monitorado mas não obrigatório por task
- Internacionalização (i18n) — produto é em português, sem i18n no MVP
- Dark mode — considerado após validação do MVP
