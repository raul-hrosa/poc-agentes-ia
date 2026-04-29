# Feature: Autenticação e Acesso Seguro

**Slug:** `autenticacao`
**Prioridade:** must-have
**Fase:** 2 — Specs
**Criada em:** 2026-04-27
**Status:** aprovada

---

## Contexto

O PsiAgenda gerencia dados de saúde sensíveis (prontuários clínicos, histórico de
pacientes), sujeitos à LGPD (Lei nº 13.709/2018, Art. 11) e às resoluções do
Conselho Federal de Psicologia (CFP). Sem autenticação segura, o produto não pode
ser lançado nem cobrado — é bloqueador legal e de negócio.

Esta feature cobre o ciclo completo de identidade do psicólogo no sistema: cadastro
de conta, login por e-mail e senha, sessão persistente no dispositivo, logout e
recuperação de senha por e-mail.

**Escopo de autenticação no MVP:**
Apenas psicólogos se autenticam. Pacientes não possuem conta e não fazem login.
O acesso de pacientes ao sistema ocorre exclusivamente via token público de
confirmação de consulta (feature `confirmacao-paciente`).

**Base técnica:**
A autenticação é implementada com NextAuth.js v5 (Auth.js) usando o Credentials
Provider (e-mail + senha via bcrypt) e o Email Provider (magic link para reset de
senha via Resend). Sessão gerenciada via cookie httpOnly assinado com `AUTH_SECRET`.
O middleware do NextAuth protege automaticamente o grupo de rotas `(auth)`.

**Multitenancy:**
Cada psicólogo autenticado é um tenant isolado. Toda query de banco inclui
obrigatoriamente `where: { userId: session.user.id }`. Não há acesso cruzado
entre contas de psicólogos diferentes.

**Conformidade CFP:**
A resolução CFP n.º 001/2009 exige controle de acesso por senha para prontuários
digitais. O login por e-mail e senha via NextAuth satisfaz esse requisito. Não há
segunda senha para acessar o prontuário no MVP (ver ADR `auth-prontuario-cfp.md`).

---

## User Stories

### Fluxo principal — cadastro

**US-01**
Como psicólogo que ainda não tem conta no PsiAgenda,
quero criar minha conta informando nome, e-mail e senha,
para ter acesso ao sistema e começar a gerenciar meus pacientes e consultas.

**US-02**
Como psicólogo criando minha conta,
quero confirmar minha senha durante o cadastro,
para evitar criar a conta com um erro de digitação que me impediria de acessar.

### Fluxo principal — login

**US-03**
Como psicólogo cadastrado,
quero fazer login com meu e-mail e senha,
para acessar minha agenda, pacientes e prontuários com segurança.

**US-04**
Como psicólogo autenticado,
quero que minha sessão permaneça ativa ao fechar e reabrir o navegador ou app,
para não precisar fazer login toda vez que abrir o PsiAgenda no meu celular.

### Fluxo principal — logout

**US-05**
Como psicólogo autenticado,
quero encerrar minha sessão pelo menu do perfil,
para garantir que ninguém mais acesse minha conta no dispositivo compartilhado.

### Fluxo principal — recuperação de senha

**US-06**
Como psicólogo que esqueceu sua senha,
quero solicitar a redefinição informando meu e-mail,
para recuperar o acesso à minha conta sem precisar contatar o suporte.

**US-07**
Como psicólogo que recebeu o e-mail de redefinição,
quero definir uma nova senha clicando no link do e-mail,
para recuperar o acesso à minha conta com uma senha que eu vá lembrar.

### Perfis alternativos — proteção de rotas

**US-08**
Como visitante não autenticado que tenta acessar qualquer página protegida,
quero ser redirecionado para a tela de login,
para entender que preciso de uma conta para usar o sistema.

**US-09**
Como psicólogo já autenticado que acessa a tela de login ou cadastro,
quero ser redirecionado diretamente para o dashboard,
para não ver telas de autenticação que não fazem sentido para quem já está logado.

### Estados vazios e erros

**US-10**
Como psicólogo tentando fazer login com credenciais incorretas,
quero receber uma mensagem de erro clara,
para saber que preciso verificar meu e-mail ou senha antes de tentar novamente.

**US-11**
Como psicólogo tentando criar uma conta com e-mail já cadastrado,
quero receber uma mensagem de erro informando que o e-mail já está em uso,
para entender que já tenho uma conta e devo usar a opção de login.

---

## Critérios de Aceite

### Cadastro de conta

**AC-01**
WHEN o visitante acessa `/register`
THEN o sistema exibe o formulário de cadastro com os campos: nome completo,
     e-mail, senha e confirmação de senha, além do botão "Criar conta".

**AC-02**
WHEN o visitante submete o formulário com todos os campos válidos
     (nome preenchido, e-mail com formato válido, senha com mínimo 8 caracteres,
     confirmação de senha idêntica à senha)
THEN o sistema cria o registro em `users` com a senha armazenada como hash bcrypt,
     autentica a sessão automaticamente e redireciona para `/dashboard`.

**AC-03**
WHEN o visitante submete o formulário com o campo nome vazio
THEN o sistema exibe "Nome é obrigatório" abaixo do campo nome e não submete.

**AC-04**
WHEN o visitante submete o formulário com e-mail em formato inválido
     (ex: "nao-e-email", "sem@dominio")
THEN o sistema exibe "Informe um e-mail válido" abaixo do campo e-mail e não submete.

**AC-05**
WHEN o visitante submete o formulário com senha com menos de 8 caracteres
THEN o sistema exibe "A senha deve ter pelo menos 8 caracteres" abaixo do campo
     senha e não submete.

**AC-06**
WHEN o visitante submete o formulário com confirmação de senha diferente da senha
THEN o sistema exibe "As senhas não conferem" abaixo do campo confirmação de senha
     e não submete.

**AC-07**
WHEN o visitante tenta criar conta com um e-mail que já está cadastrado em `users`
THEN o sistema exibe "Este e-mail já está cadastrado. Tente fazer login." abaixo
     do campo e-mail e não cria o registro.

**AC-08**
WHILE o formulário de cadastro está sendo submetido
THEN o sistema desabilita o botão "Criar conta" e exibe indicador de loading.

### Login

**AC-09**
WHEN o psicólogo acessa `/login`
THEN o sistema exibe o formulário de login com os campos: e-mail e senha, o botão
     "Entrar", o link "Esqueci minha senha" e o link "Criar conta".

**AC-10**
WHEN o psicólogo submete e-mail e senha válidos (e-mail cadastrado + senha correta)
THEN o sistema cria a sessão com cookie httpOnly, registra `session.user.id` com
     o UUID do psicólogo e redireciona para `/dashboard`.

**AC-11**
WHEN o psicólogo submete e-mail não cadastrado
THEN o sistema exibe "E-mail ou senha incorretos" sem indicar qual das informações
     está errada, e não realiza a autenticação.

**AC-12**
WHEN o psicólogo submete senha incorreta para um e-mail cadastrado
THEN o sistema exibe "E-mail ou senha incorretos" sem indicar qual das informações
     está errada, e não realiza a autenticação.

**AC-13**
WHEN o psicólogo submete o formulário com o campo e-mail vazio
THEN o sistema exibe "E-mail é obrigatório" abaixo do campo e não submete.

**AC-14**
WHEN o psicólogo submete o formulário com o campo senha vazio
THEN o sistema exibe "Senha é obrigatória" abaixo do campo e não submete.

**AC-15**
WHILE o formulário de login está sendo submetido
THEN o sistema desabilita o botão "Entrar" e exibe indicador de loading.

**AC-16**
WHEN um psicólogo já autenticado acessa `/login` ou `/register`
THEN o sistema redireciona para `/dashboard` sem exibir o formulário.

### Sessão persistente

**AC-17**
WHEN o psicólogo faz login com sucesso
THEN o sistema persiste a sessão em cookie httpOnly com validade de 30 dias,
     de modo que ao reabrir o navegador ou o app a sessão seja mantida
     sem necessidade de novo login.

**AC-18**
WHEN a sessão do psicólogo expira (após 30 dias sem atividade)
     E o psicólogo tenta acessar qualquer rota protegida
THEN o sistema invalida a sessão expirada e redireciona para `/login`.

### Logout

**AC-19**
WHEN o psicólogo clica em "Sair" no menu do perfil
THEN o sistema invalida a sessão no servidor, remove o cookie de sessão
     e redireciona para `/login`.

**AC-20**
WHEN o psicólogo não autenticado tenta acessar qualquer rota do grupo `(auth)`
     (ex: `/dashboard`, `/patients`, `/appointments`, `/notes`)
THEN o sistema redireciona para `/login?callbackUrl=[url-original]`.

**AC-21**
WHEN o psicólogo faz login após ter sido redirecionado com `callbackUrl`
THEN o sistema redireciona para a URL original em vez do `/dashboard`.

### Recuperação de senha

**AC-22**
WHEN o psicólogo acessa `/forgot-password`
THEN o sistema exibe um campo de e-mail e o botão "Enviar instruções".

**AC-23**
WHEN o psicólogo submete um e-mail cadastrado no formulário de recuperação
THEN o sistema envia e-mail de redefinição via Resend com link contendo token
     de uso único (válido por 1 hora), exibe a mensagem "Verifique seu e-mail.
     Enviamos as instruções de redefinição de senha." e não revela se o e-mail
     existia no banco ou não.

**AC-24**
WHEN o psicólogo submete um e-mail não cadastrado no formulário de recuperação
THEN o sistema exibe a mesma mensagem "Verifique seu e-mail. Enviamos as
     instruções de redefinição de senha." sem revelar que o e-mail não existe,
     e não envia nenhum e-mail.

**AC-25**
WHEN o psicólogo acessa o link de redefinição com token válido (não expirado,
     não utilizado)
THEN o sistema exibe o formulário com os campos senha e confirmação de senha.

**AC-26**
WHEN o psicólogo submete o formulário de redefinição com senha válida
     (mínimo 8 caracteres, confirmação idêntica) usando token válido
THEN o sistema atualiza o hash bcrypt da senha em `users`, invalida o token,
     autentica a sessão automaticamente e redireciona para `/dashboard` com
     toast "Senha redefinida com sucesso".

**AC-27**
WHEN o psicólogo acessa o link de redefinição com token expirado ou já utilizado
THEN o sistema exibe a mensagem "Este link de redefinição é inválido ou expirou.
     Solicite um novo link." com botão "Solicitar novo link" que navega para
     `/forgot-password`.

**AC-28**
WHEN o psicólogo submete o formulário de redefinição com senha com menos de
     8 caracteres ou confirmação diferente
THEN o sistema exibe as mesmas mensagens de validação do cadastro e não salva.

### Autorização e proteção de rotas

**AC-29**
THE SYSTEM SHALL proteger via middleware do NextAuth todas as rotas dentro do
     grupo `(auth)`, retornando redirecionamento para `/login` para qualquer
     requisição sem sessão válida.

**AC-30**
WHEN um psicólogo autenticado faz requisição a qualquer Server Action
THEN o sistema valida que `session.user.id` está presente e é um UUID válido
     antes de executar qualquer operação de banco.

---

## Wireframe Textual

### Tela 1 — Cadastro (`/register`)

```
+--------------------------------------------------+
|             PsiAgenda                            |
+--------------------------------------------------+
|                                                  |
|         Crie sua conta                           |
|                                                  |
|  Nome completo *                                 |
|  [                                    ]          |
|                                                  |
|  E-mail *                                        |
|  [                                    ]          |
|                                                  |
|  Senha *                                         |
|  [                                    ] [ver]    |
|  Mínimo 8 caracteres                             |
|                                                  |
|  Confirmar senha *                               |
|  [                                    ] [ver]    |
|                                                  |
|         [      Criar conta      ]                |
|                                                  |
|  Já tem conta? Fazer login                       |
+--------------------------------------------------+
```

**Elementos:**
- Logo ou nome do produto no topo
- Campos obrigatórios marcados com asterisco
- Campo senha com botão de visibilidade (mostrar/ocultar caracteres)
- Campo confirmação de senha com botão de visibilidade
- Texto auxiliar "Mínimo 8 caracteres" abaixo do campo senha
- Botão "Criar conta" ocupa largura total e fica desabilitado durante submissão
- Link "Fazer login" redireciona para `/login`

**Estado de erro (inline, abaixo de cada campo):**
```
|  E-mail *                                        |
|  [email-duplicado@exemplo.com         ]          |
|  * Este e-mail já está cadastrado. Tente fazer   |
|    login.                                        |
```

---

### Tela 2 — Login (`/login`)

```
+--------------------------------------------------+
|             PsiAgenda                            |
+--------------------------------------------------+
|                                                  |
|         Bem-vindo de volta                       |
|                                                  |
|  E-mail *                                        |
|  [                                    ]          |
|                                                  |
|  Senha *                                         |
|  [                                    ] [ver]    |
|                                                  |
|                     Esqueci minha senha          |
|                                                  |
|         [          Entrar          ]             |
|                                                  |
|  Não tem conta? Criar conta grátis               |
+--------------------------------------------------+
```

**Elementos:**
- Campos e-mail e senha com labels
- Campo senha com botão de visibilidade
- Link "Esqueci minha senha" alinhado à direita, abaixo do campo senha,
  navega para `/forgot-password`
- Botão "Entrar" ocupa largura total e fica desabilitado durante submissão
- Link "Criar conta grátis" redireciona para `/register`

**Estado de erro (banner acima dos campos, não inline por segurança):**
```
|  [! E-mail ou senha incorretos.            ]    |
|                                                  |
|  E-mail *                                        |
```

---

### Tela 3 — Recuperação de senha (`/forgot-password`)

```
+--------------------------------------------------+
|  [< Voltar para login]                           |
+--------------------------------------------------+
|                                                  |
|         Esqueceu sua senha?                      |
|                                                  |
|  Informe seu e-mail e enviaremos                 |
|  as instruções para redefinir sua senha.         |
|                                                  |
|  E-mail *                                        |
|  [                                    ]          |
|                                                  |
|         [   Enviar instruções   ]                |
+--------------------------------------------------+
```

**Estado após envio (independente de o e-mail existir):**
```
+--------------------------------------------------+
|                                                  |
|         Verifique seu e-mail                     |
|                                                  |
|  Enviamos as instruções de redefinição de        |
|  senha para o e-mail informado.                  |
|                                                  |
|  Não recebeu? Verifique a pasta de spam          |
|  ou tente novamente.                             |
|                                                  |
|         [    Tentar novamente    ]               |
|                                                  |
|                     Voltar para login            |
+--------------------------------------------------+
```

**Elementos:**
- Mensagem de confirmação não revela se o e-mail existe no banco
- Botão "Tentar novamente" retorna para o formulário
- Link "Voltar para login" redireciona para `/login`

---

### Tela 4 — Redefinição de senha (`/reset-password?token=[token]`)

**Estado com token válido:**
```
+--------------------------------------------------+
|             PsiAgenda                            |
+--------------------------------------------------+
|                                                  |
|         Redefina sua senha                       |
|                                                  |
|  Nova senha *                                    |
|  [                                    ] [ver]    |
|  Mínimo 8 caracteres                             |
|                                                  |
|  Confirmar nova senha *                          |
|  [                                    ] [ver]    |
|                                                  |
|         [   Redefinir senha    ]                 |
+--------------------------------------------------+
```

**Estado com token inválido ou expirado:**
```
+--------------------------------------------------+
|                                                  |
|         Link inválido ou expirado                |
|                                                  |
|  Este link de redefinição é inválido ou          |
|  expirou. Solicite um novo link.                 |
|                                                  |
|         [   Solicitar novo link   ]              |
+--------------------------------------------------+
```

---

### Menu do perfil (componente no header — todas as telas autenticadas)

```
+---------------------------+
| [avatar] Nome do Psicólogo |   [v]
+---------------------------+
      |
      | (ao clicar)
      v
+---------------------------+
| Meu perfil                |
| Configurações             |
|---------------------------|
| Sair                      |
+---------------------------+
```

**Elementos:**
- Avatar ou inicial do nome no header de todas as telas autenticadas
- Menu dropdown com opção "Sair" que dispara o logout
- Após "Sair": redireciona para `/login`

---

## Regras de Negócio

**RN-01 — Unicidade de e-mail**
O campo `email` em `users` tem constraint `UNIQUE`. Não podem existir dois
psicólogos com o mesmo e-mail. A verificação é feita na Server Action antes de
tentar inserir no banco, retornando erro legível ao invés de erro de constraint.

**RN-02 — Hash bcrypt para senhas**
A senha nunca é armazenada em texto puro. O hash é gerado com `bcryptjs` usando
fator de custo 12. A verificação no login compara a senha informada contra o hash
armazenado em `users.password`.

**RN-03 — Sessão persistente de 30 dias**
A sessão criada após login bem-sucedido tem validade de 30 dias. O cookie de sessão
é httpOnly, Secure em produção e SameSite=Lax. A validade é renovada a cada
requisição autenticada (rolling session via NextAuth).

**RN-04 — Token de redefinição de senha**
O token de redefinição é gerado pelo Email Provider do NextAuth via Resend e tem
validade de 1 hora. Após uso bem-sucedido, o token é invalidado e não pode ser
reutilizado. Se o psicólogo solicitar um novo token antes do anterior expirar,
o anterior é invalidado.

**RN-05 — Resposta genérica no esqueci minha senha**
Para evitar enumeração de e-mails cadastrados (OWASP), o sistema retorna a mesma
mensagem de confirmação independentemente de o e-mail existir ou não no banco.
Nenhum dado sobre existência de conta é revelado.

**RN-06 — Mensagem genérica no erro de login**
Para evitar enumeração de usuários, o sistema retorna "E-mail ou senha incorretos"
tanto para e-mail inexistente quanto para senha incorreta. Não há indicação de
qual campo está errado.

**RN-07 — Redirecionamento pós-login com callbackUrl**
O middleware do NextAuth preserva a URL original na query string como `callbackUrl`.
Após autenticação bem-sucedida, o psicólogo é redirecionado para a URL original.
URLs de callbackUrl externas (fora do domínio do app) são ignoradas — o
redirecionamento padrão é `/dashboard`.

**RN-08 — Isolamento de dados por sessão**
O `session.user.id` corresponde ao UUID do registro em `users`. Toda Server Action
começa com `getCurrentUser()` que valida a sessão e retorna o `userId`. Queries
de banco sempre incluem `where: { userId }` — não há acesso a dados de outros
psicólogos.

**RN-09 — Sem cadastro de pacientes como usuários**
Pacientes não têm conta e não se autenticam no sistema. O fluxo de confirmação
de consulta (feature `confirmacao-paciente`) é público, acessível via token sem
autenticação.

**RN-10 — Campos opcionais no perfil do psicólogo**
No cadastro inicial, apenas nome, e-mail e senha são obrigatórios. Os campos
`crp`, `phone` e `avatarUrl` são opcionais e podem ser preenchidos posteriormente
nas configurações de perfil. Esses campos não fazem parte do fluxo de cadastro.

---

## Casos de Erro

**CE-01 — E-mail já cadastrado no cadastro**
O sistema verifica existência do e-mail antes de inserir. Exibe erro inline
"Este e-mail já está cadastrado. Tente fazer login." sem revelar outros dados
do usuário existente.

**CE-02 — Credenciais inválidas no login**
Exibe banner "E-mail ou senha incorretos" sem indicar qual campo está errado.
Não bloqueia a conta após múltiplas tentativas no MVP (bloqueio por IP é
responsabilidade do Vercel Edge na produção).

**CE-03 — Link de redefinição expirado ou inválido**
Exibe tela de erro com mensagem "Este link de redefinição é inválido ou expirou."
e botão para solicitar novo link. Não revela se o token existiu ou qual conta
está associada.

**CE-04 — Sessão expirada durante uso**
Se o cookie de sessão expirar enquanto o psicólogo está com a tela aberta, a
próxima requisição autenticada (Server Action ou navegação) redireciona para
`/login`. O estado da tela pode ser perdido — sem mensagem específica além da
tela de login.

**CE-05 — Erro de servidor no cadastro ou login**
Se a Server Action falhar (ex: banco indisponível), o sistema exibe toast
"Ocorreu um erro. Tente novamente em alguns instantes." sem revelar detalhes
técnicos. O erro é registrado no Sentry.

**CE-06 — Falha no envio do e-mail de redefinição**
Se o Resend falhar ao enviar o e-mail de redefinição, o sistema exibe a mesma
mensagem de confirmação ao psicólogo (para não revelar o estado interno) e
registra o erro no Sentry para investigação.

---

## Dados e API

### Entidades utilizadas

- `users` — criação no cadastro, leitura no login (verificação de senha), atualização
  no reset de senha (novo hash bcrypt)

### Server Actions

| Ação | Arquivo sugerido | Descrição |
|---|---|---|
| `registerUser` | `features/auth/actions/registerUser.ts` | Valida campos, verifica unicidade de e-mail, cria hash bcrypt, insere em `users` e autentica a sessão. |
| `resetPassword` | `features/auth/actions/resetPassword.ts` | Valida token de redefinição, verifica expiração, atualiza hash bcrypt em `users` e invalida o token. |

### Integração NextAuth

O login e logout não são Server Actions customizadas — são tratados pelo NextAuth
diretamente:

| Operação | Mecanismo |
|---|---|
| Login | `signIn("credentials", { email, password })` via NextAuth Credentials Provider |
| Logout | `signOut()` via NextAuth |
| Verificação de sessão | `auth()` do NextAuth em Server Components e Server Actions |
| Envio de e-mail de reset | NextAuth Email Provider via Resend (`RESEND_API_KEY`) |

### Queries

| Query | Descrição |
|---|---|
| `getCurrentUser()` | Chama `auth()` do NextAuth, retorna `session.user` com `id`, `name` e `email`. Lança erro se sessão inválida. Usado no início de toda Server Action protegida. |
| `getUserByEmail(email)` | Busca registro em `users` por `email`. Retorna `null` se não existir. Usado no `registerUser` para verificar unicidade antes de inserir. |

### Schemas Zod

```typescript
// features/auth/schema.ts

import { z } from "zod"

export const RegisterSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Informe um e-mail válido"),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })

export const LoginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
})

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })
```

### Rotas Next.js (App Router)

| Rota | Grupo | Tipo | Descrição |
|---|---|---|---|
| `/login` | `(public)` | Page | Formulário de login. Redireciona para `/dashboard` se já autenticado. |
| `/register` | `(public)` | Page | Formulário de cadastro. Redireciona para `/dashboard` se já autenticado. |
| `/forgot-password` | `(public)` | Page | Formulário de solicitação de reset. |
| `/reset-password` | `(public)` | Page | Formulário de redefinição de senha com token. |
| `/dashboard` | `(auth)` | Page | Primeira rota protegida pós-login. |
| `/api/auth/[...nextauth]` | — | API Route | Handler do NextAuth (login, logout, callbacks, token de email). |

### Middleware

```typescript
// middleware.ts (raiz do projeto)
// NextAuth exporta o middleware que protege automaticamente
// as rotas do grupo (auth)
export { auth as middleware } from "@/auth"
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
```

### Variáveis de ambiente necessárias

| Variável | Uso |
|---|---|
| `AUTH_SECRET` | Assina cookies de sessão do NextAuth. Obrigatório em produção. |
| `RESEND_API_KEY` | Envio do e-mail de reset de senha. |
| `RESEND_FROM_EMAIL` | Remetente do e-mail de reset (ex: `noreply@psiagenda.com.br`). |
| `DATABASE_URL` | Conexão com MySQL para o Prisma Adapter do NextAuth. |
| `NEXT_PUBLIC_APP_URL` | URL base do app para montar o link de reset no e-mail. |

### Eventos disparados

- E-mail transacional via Resend ao solicitar redefinição de senha (quando o e-mail
  existe no banco).
- Nenhum webhook ou job em background é disparado por esta feature.

---

## Fora do Escopo desta Feature

1. **Autenticação de pacientes** — pacientes não têm conta e não fazem login no
   sistema. O acesso de pacientes é exclusivamente via token público de confirmação
   de consulta (feature `confirmacao-paciente`).

2. **Login social (Google, Apple, GitHub)** — OAuth providers não estão incluídos
   no MVP. O NextAuth suporta, mas a adição exigiria configuração de apps nos
   provedores e complexidade de vinculação de conta com e-mail existente.

3. **Autenticação de dois fatores (2FA)** — não há TOTP, SMS ou qualquer segundo
   fator no MVP. O CFP não exige 2FA explicitamente, e adicionar fricção no login
   contradiz o posicionamento do produto (ver ADR `auth-prontuario-cfp.md`).

4. **Gerenciamento de múltiplos usuários por conta** — o PsiAgenda é para psicólogos
   solos. Não há conceito de conta de clínica com múltiplos profissionais, permissões
   por papel ou recepcionistas.

5. **Exclusão de conta** — o psicólogo não pode excluir sua própria conta pelo MVP.
   A funcionalidade exige fluxo de confirmação, exportação de dados (LGPD, Art. 18)
   e tratamento de dados relacionados. Será adicionada em release posterior.

6. **Edição de perfil do psicólogo (nome, CRP, telefone, avatar)** — embora os
   campos existam em `users`, a tela de edição de perfil não está incluída nesta
   feature. A spec de autenticação cobre apenas identidade e acesso.

---

## Dependências

**Pré-requisitos obrigatórios:**
- Nenhuma outra feature do MVP é pré-requisito para `autenticacao`. Esta é a feature
  fundacional do sistema — todas as outras dependem dela.

**Features que dependem desta:**
- `cadastro-pacientes` — exige `session.user.id` para filtrar pacientes por psicólogo
- `agenda-consultas` — exige `session.user.id` para filtrar consultas por psicólogo
- `lembretes-consulta` — exige sessão autenticada para enviar lembretes
- `prontuario-sessao` — exige sessão autenticada e isolamento por `userId`
- `controle-financeiro` — exige `session.user.id` para filtrar pagamentos por psicólogo

**Dependência indireta:**
- `confirmacao-paciente` — não requer autenticação (é pública via token), mas o
  token é gerado a partir de dados de uma consulta cujo dono é um psicólogo autenticado.
