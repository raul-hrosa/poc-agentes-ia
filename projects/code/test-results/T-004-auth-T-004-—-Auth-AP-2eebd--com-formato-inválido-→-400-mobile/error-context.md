# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: T-004-auth.spec.ts >> T-004 — Auth API >> POST /auth/register >> e-mail com formato inválido → 400
- Location: tests/e2e/T-004-auth.spec.ts:51:9

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001
Call log:
  - → POST http://localhost:3001/api/v1/auth/register
    - user-agent: Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.96 Mobile Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 109

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | // Testes de API — usam request fixture (HTTP puro), sem browser
  4   | // Premissa: NestJS rodando em PLAYWRIGHT_API_URL com banco MySQL acessível
  5   | const API = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001'
  6   | const BASE = `${API}/api/v1/auth`
  7   | 
  8   | // E-mail único por execução para evitar colisão entre runs paralelas
  9   | const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
  10  | const freshEmail = () => `t-004+${uid()}@psiclinica.test`
  11  | 
  12  | const VALID_REGISTER = {
  13  |   password: 'Senha@1234',
  14  |   full_name: 'Ana Silva',
  15  |   crp: 'CRP-06/123456',
  16  |   state: 'SP',
  17  | }
  18  | 
  19  | const hasSeededUser = !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD)
  20  | 
  21  | test.describe('T-004 — Auth API', () => {
  22  |   // ─── POST /auth/register ─────────────────────────────────────────────────────
  23  | 
  24  |   test.describe('POST /auth/register', () => {
  25  |     test('body válido → 201 com mensagem de confirmação de e-mail', async ({ request }) => {
  26  |       const res = await request.post(`${BASE}/register`, {
  27  |         data: { email: freshEmail(), ...VALID_REGISTER },
  28  |       })
  29  |       expect(res.status()).toBe(201)
  30  |       const body = await res.json()
  31  |       expect(body.message).toMatch(/Verifique seu e-mail/)
  32  |     })
  33  | 
  34  |     test('e-mail duplicado → 409 "E-mail já cadastrado"', async ({ request }) => {
  35  |       test.slow()
  36  |       const email = freshEmail()
  37  |       await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
  38  |       const res = await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
  39  |       expect(res.status()).toBe(409)
  40  |       const body = await res.json()
  41  |       expect(body.message).toBe('E-mail já cadastrado')
  42  |     })
  43  | 
  44  |     test('body vazio → 400 com array de erros de validação', async ({ request }) => {
  45  |       const res = await request.post(`${BASE}/register`, { data: {} })
  46  |       expect(res.status()).toBe(400)
  47  |       const body = await res.json()
  48  |       expect(body.message).toBeInstanceOf(Array)
  49  |     })
  50  | 
  51  |     test('e-mail com formato inválido → 400', async ({ request }) => {
> 52  |       const res = await request.post(`${BASE}/register`, {
      |                                 ^ Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001
  53  |         data: { email: 'nao-e-um-email', ...VALID_REGISTER },
  54  |       })
  55  |       expect(res.status()).toBe(400)
  56  |     })
  57  | 
  58  |     test('senha com menos de 8 caracteres → 400', async ({ request }) => {
  59  |       const res = await request.post(`${BASE}/register`, {
  60  |         data: { email: freshEmail(), ...VALID_REGISTER, password: '1234567' },
  61  |       })
  62  |       expect(res.status()).toBe(400)
  63  |     })
  64  | 
  65  |     test('state com tamanho diferente de 2 chars → 400', async ({ request }) => {
  66  |       const res = await request.post(`${BASE}/register`, {
  67  |         data: { email: freshEmail(), ...VALID_REGISTER, state: 'RIO' },
  68  |       })
  69  |       expect(res.status()).toBe(400)
  70  |     })
  71  | 
  72  |     test('campo extra proibido → 400 (ValidationPipe whitelist)', async ({ request }) => {
  73  |       const res = await request.post(`${BASE}/register`, {
  74  |         data: { email: freshEmail(), ...VALID_REGISTER, campoExtra: 'injeção' },
  75  |       })
  76  |       expect(res.status()).toBe(400)
  77  |       const body = await res.json()
  78  |       expect(body.message).toEqual(
  79  |         expect.arrayContaining([expect.stringContaining('campoExtra should not exist')]),
  80  |       )
  81  |     })
  82  |   })
  83  | 
  84  |   // ─── POST /auth/login ────────────────────────────────────────────────────────
  85  | 
  86  |   test.describe('POST /auth/login', () => {
  87  |     test('e-mail inexistente → 401 "Credenciais inválidas"', async ({ request }) => {
  88  |       const res = await request.post(`${BASE}/login`, {
  89  |         data: { email: freshEmail(), password: 'SenhaQualquer@1' },
  90  |       })
  91  |       expect(res.status()).toBe(401)
  92  |       const body = await res.json()
  93  |       expect(body.message).toBe('Credenciais inválidas')
  94  |     })
  95  | 
  96  |     test('senha incorreta em conta registrada → 401 "Credenciais inválidas"', async ({ request }) => {
  97  |       test.slow()
  98  |       const email = freshEmail()
  99  |       await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
  100 |       const res = await request.post(`${BASE}/login`, {
  101 |         data: { email, password: 'SenhaErrada@9' },
  102 |       })
  103 |       expect(res.status()).toBe(401)
  104 |       const body = await res.json()
  105 |       expect(body.message).toBe('Credenciais inválidas')
  106 |     })
  107 | 
  108 |     test('senha correta mas e-mail não confirmado → 403', async ({ request }) => {
  109 |       test.slow()
  110 |       const email = freshEmail()
  111 |       await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
  112 |       const res = await request.post(`${BASE}/login`, {
  113 |         data: { email, password: VALID_REGISTER.password },
  114 |       })
  115 |       expect(res.status()).toBe(403)
  116 |       const body = await res.json()
  117 |       expect(body.message).toMatch(/Confirme seu e-mail/)
  118 |     })
  119 | 
  120 |     test('5 tentativas com senha errada bloqueiam a conta → próximo login retorna 403', async ({ request }) => {
  121 |       test.slow()
  122 |       const email = freshEmail()
  123 |       await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
  124 |       for (let i = 0; i < 5; i++) {
  125 |         await request.post(`${BASE}/login`, { data: { email, password: 'SenhaErrada@9' } })
  126 |       }
  127 |       // 6ª tentativa — conta deve estar bloqueada
  128 |       const res = await request.post(`${BASE}/login`, {
  129 |         data: { email, password: VALID_REGISTER.password },
  130 |       })
  131 |       expect(res.status()).toBe(403)
  132 |       const body = await res.json()
  133 |       expect(body.message).toMatch(/bloqueada/)
  134 |     })
  135 | 
  136 |     test('body vazio → 400 com array de erros de validação', async ({ request }) => {
  137 |       const res = await request.post(`${BASE}/login`, { data: {} })
  138 |       expect(res.status()).toBe(400)
  139 |       const body = await res.json()
  140 |       expect(body.message).toBeInstanceOf(Array)
  141 |     })
  142 | 
  143 |     test('happy path: credenciais válidas → 200 com accessToken e cookie refresh_token', async ({ request }) => {
  144 |       test.skip(!hasSeededUser, 'Requer TEST_USER_EMAIL + TEST_USER_PASSWORD (usuário confirmado no banco)')
  145 |       test.slow()
  146 |       const res = await request.post(`${BASE}/login`, {
  147 |         data: {
  148 |           email: process.env.TEST_USER_EMAIL,
  149 |           password: process.env.TEST_USER_PASSWORD,
  150 |         },
  151 |       })
  152 |       expect(res.status()).toBe(200)
```