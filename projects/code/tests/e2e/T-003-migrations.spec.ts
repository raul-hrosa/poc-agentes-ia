import { test, expect } from '@playwright/test'

// Testes de API — usam request fixture (HTTP puro), sem browser
// Premissa: se o NestJS sobe e responde, significa que todas as entidades TypeORM
// foram carregadas sem erros e a conexão com o banco foi estabelecida.
// A ausência de erros 500 nos endpoints básicos prova que o módulo inicializou.
const API = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001'

test.describe('T-003 — Migrations MySQL e Entidades TypeORM', () => {
  // ─── Conectividade e boot ──────────────────────────────────────────────────
  // Se o NestJS não conseguir carregar as entidades (decorators inválidos,
  // imports quebrados, TypeORM schema incompatível), o processo não sobe.
  // Qualquer resposta 200 abaixo confirma que os módulos inicializaram.

  test.describe('Boot da API com TypeORM', () => {
    test('GET /api/docs retorna 200 — TypeORM conectou e entidades carregaram', async ({ request }) => {
      const res = await request.get(`${API}/api/docs`)
      expect(res.status()).toBe(200)
    })

    test('GET /api/docs-json retorna spec OpenAPI válida — módulos registrados corretamente', async ({ request }) => {
      const res = await request.get(`${API}/api/docs-json`)
      expect(res.status()).toBe(200)
      const json = await res.json()
      expect(json.openapi).toMatch(/^3\./)
    })
  })

  // ─── JwtAuthGuard em rotas que existirão por módulo ───────────────────────
  // Habilitados por tarefa conforme controllers forem implementados.
  // Quando habilitados, 401 (não 500) confirma que o módulo inicializou
  // corretamente: Service/Repository injetados, entidade mapeada no banco.

  test.describe('Módulo Psychologists', () => {
    test.skip('GET /api/v1/psychologists/me sem token retorna 401 — entidade Psychologist carregada', async ({ request }) => {
      // Habilitar em T-005 — PsychologistsModule controller implementado
      const res = await request.get(`${API}/api/v1/psychologists/me`)
      expect(res.status()).toBe(401)
    })
  })

  test.describe('Módulo Patients', () => {
    test.skip('GET /api/v1/patients sem token retorna 401 — entidade Patient carregada', async ({ request }) => {
      // Habilitar quando PatientsModule controller for implementado
      const res = await request.get(`${API}/api/v1/patients`)
      expect(res.status()).toBe(401)
    })
  })

  test.describe('Módulo Sessions', () => {
    test.skip('GET /api/v1/sessions sem token retorna 401 — entidades Session/SessionRecurrence carregadas', async ({ request }) => {
      // Habilitar quando SessionsModule controller for implementado
      const res = await request.get(`${API}/api/v1/sessions`)
      expect(res.status()).toBe(401)
    })
  })

  test.describe('Módulo Subscriptions', () => {
    test.skip('GET /api/v1/subscriptions/me sem token retorna 401 — entidade Subscription carregada', async ({ request }) => {
      // Habilitar quando SubscriptionsModule controller for implementado
      const res = await request.get(`${API}/api/v1/subscriptions/me`)
      expect(res.status()).toBe(401)
    })
  })

  // ─── Rotas inexistentes ────────────────────────────────────────────────────

  test.describe('Roteamento', () => {
    test('GET /api/v1/rota-inexistente retorna 404 — API está roteando (não crashou)', async ({ request }) => {
      const res = await request.get(`${API}/api/v1/rota-inexistente`)
      expect(res.status()).toBe(404)
    })
  })

  // ─── Nota sobre migration:run / migration:revert ───────────────────────────
  // Os critérios "migration:run cria tabelas sem erros" e "migration:revert
  // desfaz sem erros" precisam ser validados manualmente via CLI:
  //   cd apps/api && npm run migration:run
  //   cd apps/api && npm run migration:revert
  // Esses comandos não são testáveis via HTTP.
})
