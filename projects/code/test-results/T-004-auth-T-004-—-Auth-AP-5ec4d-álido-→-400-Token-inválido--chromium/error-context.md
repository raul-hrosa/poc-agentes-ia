# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: T-004-auth.spec.ts >> T-004 — Auth API >> POST /auth/confirm-email >> token inválido → 400 "Token inválido"
- Location: tests/e2e/T-004-auth.spec.ts:321:9

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001
Call log:
  - → POST http://localhost:3001/api/v1/auth/confirm-email?token=tokeninvalido
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.7778.96 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```

# Test source

```ts
  222 |       const setCookie = loginRes.headers()['set-cookie'] ?? ''
  223 |       const tokenMatch = setCookie.match(/refresh_token=([^;]+)/)
  224 |       const refreshCookie = `refresh_token=${tokenMatch![1]}`
  225 | 
  226 |       const logoutRes = await request.post(`${BASE}/logout`, {
  227 |         headers: { Cookie: refreshCookie },
  228 |       })
  229 |       expect(logoutRes.status()).toBe(204)
  230 | 
  231 |       const refreshRes = await request.post(`${BASE}/refresh`, {
  232 |         headers: { Cookie: refreshCookie },
  233 |       })
  234 |       expect(refreshRes.status()).toBe(401)
  235 |     })
  236 |   })
  237 | 
  238 |   // ─── POST /auth/forgot-password ──────────────────────────────────────────────
  239 | 
  240 |   test.describe('POST /auth/forgot-password', () => {
  241 |     test('e-mail desconhecido → 200 com mensagem genérica (anti-enumeração)', async ({ request }) => {
  242 |       const res = await request.post(`${BASE}/forgot-password`, {
  243 |         data: { email: freshEmail() },
  244 |       })
  245 |       expect(res.status()).toBe(200)
  246 |       const body = await res.json()
  247 |       expect(body.message).toMatch(/Se o e-mail estiver cadastrado/)
  248 |     })
  249 | 
  250 |     test('e-mail cadastrado → 200 com mesma mensagem genérica', async ({ request }) => {
  251 |       test.slow()
  252 |       const email = freshEmail()
  253 |       await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
  254 |       const res = await request.post(`${BASE}/forgot-password`, { data: { email } })
  255 |       expect(res.status()).toBe(200)
  256 |       const body = await res.json()
  257 |       expect(body.message).toMatch(/Se o e-mail estiver cadastrado/)
  258 |     })
  259 | 
  260 |     test('body vazio → 400', async ({ request }) => {
  261 |       const res = await request.post(`${BASE}/forgot-password`, { data: {} })
  262 |       expect(res.status()).toBe(400)
  263 |       const body = await res.json()
  264 |       expect(body.message).toBeInstanceOf(Array)
  265 |     })
  266 | 
  267 |     test('e-mail com formato inválido → 400', async ({ request }) => {
  268 |       const res = await request.post(`${BASE}/forgot-password`, {
  269 |         data: { email: 'nao-e-email' },
  270 |       })
  271 |       expect(res.status()).toBe(400)
  272 |     })
  273 |   })
  274 | 
  275 |   // ─── POST /auth/reset-password ───────────────────────────────────────────────
  276 | 
  277 |   test.describe('POST /auth/reset-password', () => {
  278 |     test('sem ?token no query → 401 "Token ausente"', async ({ request }) => {
  279 |       const res = await request.post(`${BASE}/reset-password`, {
  280 |         data: { password: 'NovaSenha@1234' },
  281 |       })
  282 |       expect(res.status()).toBe(401)
  283 |       const body = await res.json()
  284 |       expect(body.message).toBe('Token ausente')
  285 |     })
  286 | 
  287 |     test('token inválido + senha válida → 400 "Token inválido ou expirado"', async ({ request }) => {
  288 |       const res = await request.post(`${BASE}/reset-password?token=tokeninvalido`, {
  289 |         data: { password: 'NovaSenha@1234' },
  290 |       })
  291 |       expect(res.status()).toBe(400)
  292 |       const body = await res.json()
  293 |       expect(body.message).toBe('Token inválido ou expirado')
  294 |     })
  295 | 
  296 |     test('token presente + senha curta → 400 de validação (antes de consultar banco)', async ({ request }) => {
  297 |       const res = await request.post(`${BASE}/reset-password?token=tokeninvalido`, {
  298 |         data: { password: '1234567' },
  299 |       })
  300 |       expect(res.status()).toBe(400)
  301 |     })
  302 | 
  303 |     test('token presente + body vazio → 400', async ({ request }) => {
  304 |       const res = await request.post(`${BASE}/reset-password?token=tokeninvalido`, {
  305 |         data: {},
  306 |       })
  307 |       expect(res.status()).toBe(400)
  308 |     })
  309 |   })
  310 | 
  311 |   // ─── POST /auth/confirm-email ────────────────────────────────────────────────
  312 | 
  313 |   test.describe('POST /auth/confirm-email', () => {
  314 |     test('sem ?token no query → 401 "Token ausente"', async ({ request }) => {
  315 |       const res = await request.post(`${BASE}/confirm-email`)
  316 |       expect(res.status()).toBe(401)
  317 |       const body = await res.json()
  318 |       expect(body.message).toBe('Token ausente')
  319 |     })
  320 | 
  321 |     test('token inválido → 400 "Token inválido"', async ({ request }) => {
> 322 |       const res = await request.post(`${BASE}/confirm-email?token=tokeninvalido`)
      |                                 ^ Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001
  323 |       expect(res.status()).toBe(400)
  324 |       const body = await res.json()
  325 |       expect(body.message).toBe('Token inválido')
  326 |     })
  327 |   })
  328 | })
  329 | 
```