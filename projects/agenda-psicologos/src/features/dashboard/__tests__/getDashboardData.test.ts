import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    appointment: {
      count: vi.fn(),
    },
  },
}))

import { prisma } from "@/shared/lib/prisma"
import {
  getPendingConfirmationCount,
  getWeeklySummary,
} from "../queries/getDashboardData"

const USER_ID = "user-abc"

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getPendingConfirmationCount
// ---------------------------------------------------------------------------
describe("getPendingConfirmationCount", () => {
  it("retorna a contagem de consultas pendentes de confirmação", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(3)

    const result = await getPendingConfirmationCount(USER_ID)

    expect(result).toBe(3)
    expect(prisma.appointment.count).toHaveBeenCalledOnce()
  })

  it("filtra por userId correto", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    await getPendingConfirmationCount(USER_ID)

    const callArg = vi.mocked(prisma.appointment.count).mock.calls[0][0]
    expect(callArg?.where?.userId).toBe(USER_ID)
  })

  it("filtra por status 'scheduled'", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    await getPendingConfirmationCount(USER_ID)

    const callArg = vi.mocked(prisma.appointment.count).mock.calls[0][0]
    expect(callArg?.where?.status).toBe("scheduled")
  })

  it("filtra scheduledAt entre agora e 7 dias à frente", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    const before = new Date()
    await getPendingConfirmationCount(USER_ID)
    const after = new Date()

    const callArg = vi.mocked(prisma.appointment.count).mock.calls[0][0]
    const { gte, lte } = callArg?.where?.scheduledAt as { gte: Date; lte: Date }

    expect(gte.getTime()).toBeGreaterThanOrEqual(before.getTime() - 100)
    expect(gte.getTime()).toBeLessThanOrEqual(after.getTime() + 100)

    const expectedMax = before.getTime() + 7 * 24 * 60 * 60 * 1000
    expect(lte.getTime()).toBeGreaterThanOrEqual(expectedMax - 100)
    expect(lte.getTime()).toBeLessThanOrEqual(expectedMax + 7000) // tolerância de 7s
  })

  it("exclui consultas com token confirmado (action=confirmed, usedAt not null)", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    await getPendingConfirmationCount(USER_ID)

    const callArg = vi.mocked(prisma.appointment.count).mock.calls[0][0]
    const tokenFilter = callArg?.where?.appointmentTokens
    expect(tokenFilter).toEqual({
      none: {
        action: "confirmed",
        usedAt: { not: null },
      },
    })
  })

  it("retorna 0 quando userId inválido (sem resultados)", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    const result = await getPendingConfirmationCount("usuario-inexistente")

    expect(result).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getWeeklySummary
// ---------------------------------------------------------------------------
describe("getWeeklySummary", () => {
  it("retorna total, confirmed e cancelled corretos", async () => {
    vi.mocked(prisma.appointment.count)
      .mockResolvedValueOnce(5) // total
      .mockResolvedValueOnce(3) // confirmed
      .mockResolvedValueOnce(1) // cancelled

    const weekStart = new Date(2026, 4, 5, 0, 0, 0, 0) // segunda 05/05/2026 local
    const result = await getWeeklySummary(USER_ID, weekStart)

    expect(result).toEqual({ total: 5, confirmed: 3, cancelled: 1 })
  })

  it("chama prisma.appointment.count três vezes", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    const weekStart = new Date(2026, 4, 5, 0, 0, 0, 0)
    await getWeeklySummary(USER_ID, weekStart)

    expect(prisma.appointment.count).toHaveBeenCalledTimes(3)
  })

  it("filtra por userId em todas as queries", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    const weekStart = new Date(2026, 4, 5, 0, 0, 0, 0)
    await getWeeklySummary(USER_ID, weekStart)

    const calls = vi.mocked(prisma.appointment.count).mock.calls
    calls.forEach((call) => {
      expect(call[0]?.where?.userId).toBe(USER_ID)
    })
  })

  it("weekEnd é weekStart + 6 dias às 23:59:59", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    // Usar data local para evitar diferença de fuso horário
    const weekStart = new Date(2026, 4, 5, 0, 0, 0, 0) // segunda 05/05/2026 local
    await getWeeklySummary(USER_ID, weekStart)

    // total query (1ª chamada) deve ter scheduledAt.lte = domingo 23:59:59
    const callArg = vi.mocked(prisma.appointment.count).mock.calls[0][0]
    const { lte } = callArg?.where?.scheduledAt as { gte: Date; lte: Date }

    // weekEnd deve ser weekStart + 6 dias = domingo 11/05/2026
    const expectedDate = new Date(weekStart)
    expectedDate.setDate(weekStart.getDate() + 6)

    expect(lte.getDate()).toBe(expectedDate.getDate())
    expect(lte.getHours()).toBe(23)
    expect(lte.getMinutes()).toBe(59)
    expect(lte.getSeconds()).toBe(59)
  })

  it("retorna zeros quando não há consultas na semana", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    const weekStart = new Date(2026, 4, 5, 0, 0, 0, 0)
    const result = await getWeeklySummary(USER_ID, weekStart)

    expect(result).toEqual({ total: 0, confirmed: 0, cancelled: 0 })
  })

  it("segunda query filtra por status 'confirmed'", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    const weekStart = new Date(2026, 4, 5, 0, 0, 0, 0)
    await getWeeklySummary(USER_ID, weekStart)

    const confirmedCallArg = vi.mocked(prisma.appointment.count).mock.calls[1][0]
    expect(confirmedCallArg?.where?.status).toBe("confirmed")
  })

  it("terceira query filtra por status 'cancelled'", async () => {
    vi.mocked(prisma.appointment.count).mockResolvedValue(0)

    const weekStart = new Date(2026, 4, 5, 0, 0, 0, 0)
    await getWeeklySummary(USER_ID, weekStart)

    const cancelledCallArg = vi.mocked(prisma.appointment.count).mock.calls[2][0]
    expect(cancelledCallArg?.where?.status).toBe("cancelled")
  })
})
