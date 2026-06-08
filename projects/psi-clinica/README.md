# PsiClínica

Sistema de gestão de consultório para psicólogos em início de carreira — agenda, prontuário, financeiro e comunicação ética em conformidade com CFP e LGPD.

## Fase atual

PRD ✅ | TechSpec ✅ | Planning ✅ | Dev ⬜

## Documentos

- [PRD](prd.md)
- [TechSpec](techspec.md)
- [Contexto do projeto](_context.md)
- [Backlog](tasks/BACKLOG.md)

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript strict + Tailwind CSS + shadcn/ui
- **Backend**: NestJS 10 (API REST dedicada)
- **ORM**: TypeORM 0.3
- **Banco**: MySQL 8.0
- **Auth**: JWT RS256 + Refresh Token (httpOnly cookie)
- **Storage**: Cloudflare R2
- **Criptografia**: AES-256-CBC a nível de aplicação (dados clínicos)
- **E-mail**: Resend
- **PDF**: Puppeteer (server-side no NestJS)
- **Editor rico**: Tiptap
- **Jobs**: @nestjs/schedule + BullMQ + Upstash Redis
- **Pagamentos**: Stripe
- **Deploy**: Vercel (frontend) + Railway (backend)

## Planos

| Plano | Preço | Limite |
| --- | --- | --- |
| Gratuito | R$ 0 | até 8 pacientes ativos |
| Pro | R$ 49/mês | ilimitados + automações + cobrança digital |
| Clínica | R$ 97/mês | Pro + até 3 agendas + insights avançados |
