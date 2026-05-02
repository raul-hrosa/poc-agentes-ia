import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    appointmentToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    appointment: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { prisma } from "@/shared/lib/prisma"
import { POST } from "@/app/api/confirm/[token]/route"

const mockTokenFindUnique = prisma.appointmentToken.findUnique as ReturnType<typeof vi.fn>
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>

const TOKEN = "a".repeat(64)
const APPOINTMENT_ID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"

function makeTokenRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "token-id-1",
    token: TOKEN,
    appointmentId: APPOINTMENT_ID,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    usedAt: null,
    action: null,
    appointment: {
      id: APPOINTMENT_ID,
      status: "scheduled",
    },
    ...overrides,
  }
}

function makeRequest(body: Record<string, unknown> = { action: "confirmed" }): NextRequest {
  return new NextRequest(`http://localhost/api/confirm/${TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const routeContext = { params: { token: TOKEN } }

beforeEach(() => {
  vi.clearAllMocks()
  mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) => {
    return Promise.all(ops)
  })
})

describe("POST /api/confirm/[token]", () => {
  it("retorna 400 para ação inválida", async () => {
    const req = makeRequest({ action: "invalid" })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(400)
    const json = await res.json() as { error: string }
    expect(json.error).toBe("Dados inválidos")
  })

  it("retorna 400 quando body não tem action", async () => {
    const req = makeRequest({})
    const res = await POST(req, routeContext)
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando token não existe", async () => {
    mockTokenFindUnique.mockResolvedValue(null)
    const req = makeRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(404)
    const json = await res.json() as { error: string }
    expect(json.error).toBe("not_found")
  })

  it("retorna 410 quando token está expirado", async () => {
    mockTokenFindUnique.mockResolvedValue(
      makeTokenRecord({ expiresAt: new Date(Date.now() - 1000) }),
    )
    const req = makeRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(410)
    const json = await res.json() as { error: string }
    expect(json.error).toBe("expired")
  })

  it("retorna 409 quando token já foi usado", async () => {
    mockTokenFindUnique.mockResolvedValue(
      makeTokenRecord({
        usedAt: new Date("2026-05-03T12:00:00.000Z"),
        action: "confirmed",
      }),
    )
    const req = makeRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(409)
    const json = await res.json() as { error: string; action: string }
    expect(json.error).toBe("used")
    expect(json.action).toBe("confirmed")
  })

  it("retorna 422 quando consulta está com status terminal", async () => {
    mockTokenFindUnique.mockResolvedValue(
      makeTokenRecord({ appointment: { id: APPOINTMENT_ID, status: "completed" } }),
    )
    const req = makeRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(422)
    const json = await res.json() as { error: string }
    expect(json.error).toBe("appointment_closed")
  })

  it("retorna 422 quando consulta está cancelled", async () => {
    mockTokenFindUnique.mockResolvedValue(
      makeTokenRecord({ appointment: { id: APPOINTMENT_ID, status: "cancelled" } }),
    )
    const req = makeRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(422)
  })

  it("confirma consulta e retorna 200 com action=confirmed", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())
    const req = makeRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(200)
    const json = await res.json() as { success: boolean; action: string }
    expect(json.success).toBe(true)
    expect(json.action).toBe("confirmed")
    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it("cancela consulta e retorna 200 com action=cancelled", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())
    const req = makeRequest({ action: "cancelled" })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(200)
    const json = await res.json() as { success: boolean; action: string }
    expect(json.success).toBe(true)
    expect(json.action).toBe("cancelled")
  })

  it("atualiza appointment.status para confirmed na transação atômica", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())
    const req = makeRequest({ action: "confirmed" })
    await POST(req, routeContext)

    // Verifica que a transação foi chamada com um array de 2 operações
    expect(mockTransaction).toHaveBeenCalledOnce()
    const transactionArg = mockTransaction.mock.calls[0][0] as unknown[]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(2)
  })

  it("funciona sem autenticação (rota pública)", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())
    // Sem cabeçalho Authorization
    const req = new NextRequest(`http://localhost/api/confirm/${TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirmed" }),
    })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(200)
  })
})
