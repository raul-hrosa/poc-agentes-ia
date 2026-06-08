import { test, expect } from '@playwright/test'

// Testes de API — não usam browser, apenas request fixture (HTTP puro)
const API = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001'

test.describe('T-002 — Setup NestJS Base', () => {
  // ─── Swagger / Documentação ────────────────────────────────────────────────

  test.describe('Swagger', () => {
    test('GET /api/docs retorna HTML com status 200', async ({ request }) => {
      const res = await request.get(`${API}/api/docs`)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('text/html')
    })

    test('GET /api/docs-json retorna especificação OpenAPI válida', async ({ request }) => {
      const res = await request.get(`${API}/api/docs-json`)
      expect(res.status()).toBe(200)
      const json = await res.json()
      expect(json.openapi).toMatch(/^3\./)
      expect(json.info.title).toBe('PsiClínica API')
    })
  })

  // ─── Segurança HTTP (helmet) ───────────────────────────────────────────────

  test.describe('Segurança HTTP (helmet)', () => {
    test('resposta inclui X-Frame-Options: SAMEORIGIN', async ({ request }) => {
      const res = await request.get(`${API}/api/docs`)
      expect(res.headers()['x-frame-options']).toBe('SAMEORIGIN')
    })

    test('resposta inclui X-Content-Type-Options: nosniff', async ({ request }) => {
      const res = await request.get(`${API}/api/docs`)
      expect(res.headers()['x-content-type-options']).toBe('nosniff')
    })

    test('resposta inclui X-DNS-Prefetch-Control: off', async ({ request }) => {
      const res = await request.get(`${API}/api/docs`)
      expect(res.headers()['x-dns-prefetch-control']).toBe('off')
    })

    test('resposta inclui X-Download-Options: noopen', async ({ request }) => {
      const res = await request.get(`${API}/api/docs`)
      expect(res.headers()['x-download-options']).toBe('noopen')
    })
  })

  // ─── CORS ─────────────────────────────────────────────────────────────────

  test.describe('CORS', () => {
    test('preflight de origem permitida retorna Access-Control-Allow-Origin correto', async ({ request }) => {
      const res = await request.fetch(`${API}/api/docs`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      })
      expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:3000')
    })

    test('preflight de origem permitida inclui Access-Control-Allow-Credentials: true', async ({ request }) => {
      const res = await request.fetch(`${API}/api/docs`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
        },
      })
      expect(res.headers()['access-control-allow-credentials']).toBe('true')
    })

    test('origem não permitida não recebe Access-Control-Allow-Origin', async ({ request }) => {
      const res = await request.fetch(`${API}/api/docs`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://site-nao-permitido.com',
          'Access-Control-Request-Method': 'GET',
        },
      })
      expect(res.headers()['access-control-allow-origin']).toBeUndefined()
    })
  })

  // ─── JwtAuthGuard ─────────────────────────────────────────────────────────
  // Habilitados a partir de T-004 (auth module) — quando existir rota protegida real

  test.describe('JwtAuthGuard', () => {
    test.skip('rota protegida sem token retorna 401 com "Token não fornecido"', async ({ request }) => {
      // Substituir pela primeira rota protegida implementada (ex: GET /api/v1/psychologists/me)
      const res = await request.get(`${API}/api/v1/psychologists/me`)
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Token não fornecido')
    })

    test.skip('rota protegida com token inválido retorna 401 com "Token inválido ou expirado"', async ({ request }) => {
      const res = await request.get(`${API}/api/v1/psychologists/me`, {
        headers: { Authorization: 'Bearer token.invalido.assinado.errado' },
      })
      expect(res.status()).toBe(401)
      const body = await res.json()
      expect(body.message).toBe('Token inválido ou expirado')
    })

    test.skip('rota marcada @Public() é acessível sem token (ex: POST /api/v1/auth/login)', async ({ request }) => {
      // Habilitado em T-004 — endpoint de login usa @Public()
      const res = await request.post(`${API}/api/v1/auth/login`, {
        data: { email: 'qualquer@email.com', password: 'qualquer' },
      })
      // Espera 400 (credenciais inválidas) ou 200 — o que NÃO deve ocorrer é 401
      expect(res.status()).not.toBe(401)
    })
  })

  // ─── ValidationPipe ───────────────────────────────────────────────────────
  // Habilitados em T-004 — quando existir rota com DTO

  test.describe('ValidationPipe', () => {
    test.skip('POST com campo extra proibido retorna 400 (forbidNonWhitelisted)', async ({ request }) => {
      // Habilitado em T-004 — usar POST /api/v1/auth/login com campo extra
      const res = await request.post(`${API}/api/v1/auth/login`, {
        data: { email: 'a@b.com', password: '123', campoHacker: 'injeção' },
      })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('campoHacker should not exist')]),
      )
    })

    test.skip('POST com campo obrigatório ausente retorna 400 com detalhes de validação', async ({ request }) => {
      const res = await request.post(`${API}/api/v1/auth/login`, {
        data: {},
      })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.statusCode).toBe(400)
      expect(body.message).toBeInstanceOf(Array)
    })
  })

  // ─── Rate Limiting ────────────────────────────────────────────────────────
  // Custoso — executar manualmente ou em ambiente isolado

  test.describe('Rate Limiting', () => {
    test.skip('101ª requisição por IP retorna 429 Too Many Requests', async ({ request }) => {
      // ThrottlerModule: 100 req/min por IP via Redis (ThrottlerStorageService)
      // Executar apenas em ambiente isolado — não misturar com outros testes no mesmo minuto
      for (let i = 0; i < 100; i++) {
        await request.get(`${API}/api/docs`)
      }
      const res = await request.get(`${API}/api/docs`)
      expect(res.status()).toBe(429)
    })
  })
})
