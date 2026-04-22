import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('better-sqlite3', () => {
  const MockDatabase = vi.fn(() => ({ mockDb: true }))
  return { default: MockDatabase }
})

vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: vi.fn((sqlite) => ({ drizzleInstance: true, sqlite })),
}))

vi.mock('../../drizzle/schema', () => ({
  links: {},
}))

describe('src/lib/db', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    delete (global as any)._db
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    delete (global as any)._db
  })

  it('lança erro quando DATABASE_URL não está definida', async () => {
    delete process.env.DATABASE_URL
    await expect(import('./db')).rejects.toThrow('DATABASE_URL')
  })

  it('armazena conexão em global._db em desenvolvimento', async () => {
    process.env.DATABASE_URL = 'file:./data/test.db'
    process.env.NODE_ENV = 'development'
    await import('./db')
    expect((global as any)._db).toBeDefined()
  })

  it('reutiliza global._db existente sem criar nova conexão', async () => {
    const mockExisting = { mockDb: 'existing' }
    ;(global as any)._db = mockExisting
    process.env.DATABASE_URL = 'file:./data/test.db'
    process.env.NODE_ENV = 'development'
    await import('./db')
    expect((global as any)._db).toBe(mockExisting)
  })
})
