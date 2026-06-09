import { test, expect } from '@playwright/test'

// Testes de API — usam request fixture (HTTP puro), sem browser
// Premissa: NestJS rodando em PLAYWRIGHT_API_URL com banco MySQL acessível
const API = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001'
const BASE = `${API}/api/v1/auth`

// E-mail único por execução para evitar colisão entre runs paralelas
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
const freshEmail = () => `t-004+${uid()}@psiclinica.test`

const VALID_REGISTER = {
  password: 'Senha@1234',
  full_name: 'Ana Silva',
  crp: 'CRP-06/123456',
  state: 'SP',
}

const hasSeededUser = !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD)

test.describe('T-004 — Auth API', () => {
  // ─── POST /auth/register ─────────────────────────────────────────────────────

  test.describe('POST /auth/register', () => {
    test('body válido → 201 com mensagem de confirmação de e-mail', async ({ request }) => {
      const res = await request.post(`${BASE}/register`, {
        data: { email: freshEmail(), ...VALID_REGISTER },
      })
      expect(res.status()).toBe(201)
      const body = await res.json()
      expect(body.message).toMatch(/Verifique seu e-mail/)
    })

    test('e-mail duplicado → 409 "E-mail já cadastrado"', async ({ request }) => {
      test.slow()
      const email = freshEmail()
      await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
      const res = await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
      expect(res.status()).toBe(409)
      const body = await res.json()
      expect(body.message).toBe('E-mail já cadastrado')
    })

    test('body vazio → 400 com array de erros de validação', async ({ request }) => {
      const res = await request.post(`${BASE}/register`, { data: {} })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.message).toBeInstanceOf(Array)
    })

    test('e-mail com formato inválido → 400', async ({ request }) => {
      const res = await request.post(`${BASE}/register`, {
        data: { email: 'nao-e-um-email', ...VALID_REGISTER },
      })
      expect(res.status()).toBe(400)
    })

    test('senha com menos de 8 caracteres → 400', async ({ request }) => {
      const res = await request.post(`${BASE}/register`, {
        data: { email: freshEmail(), ...VALID_REGISTER, password: '1234567' },
      })
      expect(res.status()).toBe(400)
    })

    test('state com tamanho diferente de 2 chars → 400', async ({ request }) => {
      const res = await request.post(`${BASE}/register`, {
        data: { email: freshEmail(), ...VALID_REGISTER, state: 'RIO' },
      })
      expect(res.status()).toBe(400)
    })

    test('campo extra proibido → 400 (ValidationPipe whitelist)', async ({ request }) => {
      const res = await request.post(`${BASE}/register`, {
        data: { email: freshEmail(), ...VALID_REGISTER, campoExtra: 'injeção' },
      })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('campoExtra should not exist')]),
      )
    })
  })

  // ─── POST /auth/login ────────────────────────────────────────────────────────

  test.describe('POST /auth/login', () => {
    test('e-mail inexistente → 401 "Credenciais inválidas"', async ({ request }) => {
      const res = await request.post(`${BASE}/login`, {
        data: { email: freshEmail(), password: 'SenhaQualquer@1' },
      })
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Credenciais inválidas')
    })

    test('senha incorreta em conta registrada → 401 "Credenciais inválidas"', async ({ request }) => {
      test.slow()
      const email = freshEmail()
      await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
      const res = await request.post(`${BASE}/login`, {
        data: { email, password: 'SenhaErrada@9' },
      })
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Credenciais inválidas')
    })

    test('senha correta mas e-mail não confirmado → 403', async ({ request }) => {
      test.slow()
      const email = freshEmail()
      await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
      const res = await request.post(`${BASE}/login`, {
        data: { email, password: VALID_REGISTER.password },
      })
      expect(res.status()).toBe(403)
      const body = await res.json()
      expect(body.message).toMatch(/Confirme seu e-mail/)
    })

    test('5 tentativas com senha errada bloqueiam a conta → próximo login retorna 403', async ({ request }) => {
      test.slow()
      const email = freshEmail()
      await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
      for (let i = 0; i < 5; i++) {
        await request.post(`${BASE}/login`, { data: { email, password: 'SenhaErrada@9' } })
      }
      // 6ª tentativa — conta deve estar bloqueada
      const res = await request.post(`${BASE}/login`, {
        data: { email, password: VALID_REGISTER.password },
      })
      expect(res.status()).toBe(403)
      const body = await res.json()
      expect(body.message).toMatch(/bloqueada/)
    })

    test('body vazio → 400 com array de erros de validação', async ({ request }) => {
      const res = await request.post(`${BASE}/login`, { data: {} })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.message).toBeInstanceOf(Array)
    })

    test('happy path: credenciais válidas → 200 com accessToken e cookie refresh_token', async ({ request }) => {
      test.skip(!hasSeededUser, 'Requer TEST_USER_EMAIL + TEST_USER_PASSWORD (usuário confirmado no banco)')
      test.slow()
      const res = await request.post(`${BASE}/login`, {
        data: {
          email: process.env.TEST_USER_EMAIL,
          password: process.env.TEST_USER_PASSWORD,
        },
      })
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.accessToken).toBeTruthy()
      expect(body.psychologist.email).toBe(process.env.TEST_USER_EMAIL)
      expect(body.subscription.plan).toBeTruthy()
      const setCookie = res.headers()['set-cookie'] ?? ''
      expect(setCookie).toMatch(/refresh_token=/)
      expect(setCookie.toLowerCase()).toContain('httponly')
    })
  })

  // ─── POST /auth/refresh ──────────────────────────────────────────────────────

  test.describe('POST /auth/refresh', () => {
    test('sem cookie → 401 "Refresh token ausente"', async ({ request }) => {
      const res = await request.post(`${BASE}/refresh`)
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Refresh token ausente')
    })

    test('cookie com token desconhecido → 401 "Refresh token inválido ou expirado"', async ({ request }) => {
      const res = await request.post(`${BASE}/refresh`, {
        headers: { Cookie: 'refresh_token=tokeninvalidoqualquer' },
      })
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Refresh token inválido ou expirado')
    })

    test('happy path: cookie válido → 200 com novo accessToken', async ({ request }) => {
      test.skip(!hasSeededUser, 'Requer TEST_USER_EMAIL + TEST_USER_PASSWORD (usuário confirmado no banco)')
      test.slow()
      const loginRes = await request.post(`${BASE}/login`, {
        data: {
          email: process.env.TEST_USER_EMAIL,
          password: process.env.TEST_USER_PASSWORD,
        },
      })
      const setCookie = loginRes.headers()['set-cookie'] ?? ''
      const tokenMatch = setCookie.match(/refresh_token=([^;]+)/)
      expect(tokenMatch).toBeTruthy()
      const refreshCookie = `refresh_token=${tokenMatch![1]}`

      const res = await request.post(`${BASE}/refresh`, {
        headers: { Cookie: refreshCookie },
      })
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.accessToken).toBeTruthy()
    })
  })

  // ─── POST /auth/logout ───────────────────────────────────────────────────────

  test.describe('POST /auth/logout', () => {
    test('sem cookie → 204 (graceful, não retorna erro)', async ({ request }) => {
      const res = await request.post(`${BASE}/logout`)
      expect(res.status()).toBe(204)
    })

    test('happy path: logout revoga token → refresh posterior retorna 401', async ({ request }) => {
      test.skip(!hasSeededUser, 'Requer TEST_USER_EMAIL + TEST_USER_PASSWORD (usuário confirmado no banco)')
      test.slow()
      const loginRes = await request.post(`${BASE}/login`, {
        data: {
          email: process.env.TEST_USER_EMAIL,
          password: process.env.TEST_USER_PASSWORD,
        },
      })
      const setCookie = loginRes.headers()['set-cookie'] ?? ''
      const tokenMatch = setCookie.match(/refresh_token=([^;]+)/)
      const refreshCookie = `refresh_token=${tokenMatch![1]}`

      const logoutRes = await request.post(`${BASE}/logout`, {
        headers: { Cookie: refreshCookie },
      })
      expect(logoutRes.status()).toBe(204)

      const refreshRes = await request.post(`${BASE}/refresh`, {
        headers: { Cookie: refreshCookie },
      })
      expect(refreshRes.status()).toBe(401)
    })
  })

  // ─── POST /auth/forgot-password ──────────────────────────────────────────────

  test.describe('POST /auth/forgot-password', () => {
    test('e-mail desconhecido → 200 com mensagem genérica (anti-enumeração)', async ({ request }) => {
      const res = await request.post(`${BASE}/forgot-password`, {
        data: { email: freshEmail() },
      })
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.message).toMatch(/Se o e-mail estiver cadastrado/)
    })

    test('e-mail cadastrado → 200 com mesma mensagem genérica', async ({ request }) => {
      test.slow()
      const email = freshEmail()
      await request.post(`${BASE}/register`, { data: { email, ...VALID_REGISTER } })
      const res = await request.post(`${BASE}/forgot-password`, { data: { email } })
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.message).toMatch(/Se o e-mail estiver cadastrado/)
    })

    test('body vazio → 400', async ({ request }) => {
      const res = await request.post(`${BASE}/forgot-password`, { data: {} })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.message).toBeInstanceOf(Array)
    })

    test('e-mail com formato inválido → 400', async ({ request }) => {
      const res = await request.post(`${BASE}/forgot-password`, {
        data: { email: 'nao-e-email' },
      })
      expect(res.status()).toBe(400)
    })
  })

  // ─── POST /auth/reset-password ───────────────────────────────────────────────

  test.describe('POST /auth/reset-password', () => {
    test('sem ?token no query → 401 "Token ausente"', async ({ request }) => {
      const res = await request.post(`${BASE}/reset-password`, {
        data: { password: 'NovaSenha@1234' },
      })
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Token ausente')
    })

    test('token inválido + senha válida → 400 "Token inválido ou expirado"', async ({ request }) => {
      const res = await request.post(`${BASE}/reset-password?token=tokeninvalido`, {
        data: { password: 'NovaSenha@1234' },
      })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.message).toBe('Token inválido ou expirado')
    })

    test('token presente + senha curta → 400 de validação (antes de consultar banco)', async ({ request }) => {
      const res = await request.post(`${BASE}/reset-password?token=tokeninvalido`, {
        data: { password: '1234567' },
      })
      expect(res.status()).toBe(400)
    })

    test('token presente + body vazio → 400', async ({ request }) => {
      const res = await request.post(`${BASE}/reset-password?token=tokeninvalido`, {
        data: {},
      })
      expect(res.status()).toBe(400)
    })
  })

  // ─── POST /auth/confirm-email ────────────────────────────────────────────────

  test.describe('POST /auth/confirm-email', () => {
    test('sem ?token no query → 401 "Token ausente"', async ({ request }) => {
      const res = await request.post(`${BASE}/confirm-email`)
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Token ausente')
    })

    test('token inválido → 400 "Token inválido"', async ({ request }) => {
      const res = await request.post(`${BASE}/confirm-email?token=tokeninvalido`)
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.message).toBe('Token inválido')
    })
  })
})
