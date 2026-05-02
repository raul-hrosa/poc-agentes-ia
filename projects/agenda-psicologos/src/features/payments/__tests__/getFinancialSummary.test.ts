/**
 * Testes de integração — getFinancialSummary (TASK-07)
 * Cenários de negócio conforme spec controle-financeiro.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    sessionPayment: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/shared/lib/prisma"
import { getFinancialSummary } from "../queries/getFinancialSummary"

const USER_ID = "a1b2c3d4-1234-4abc-8def-000000000001"
const OTHER_USER_ID = "b2c3d4e5-1234-4abc-8def-000000000002"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getFinancialSummary — integração", () => {
  it("período sem registros: retorna todos os campos zerados", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    const result = await getFinancialSummary(USER_ID, 2026, 5)

    expect(result).toEqual({
      totalPaidCents: 0,
      totalPendingCents: 0,
      sessionCount: 0,
      pendingCount: 0,
    })
  })

  it("período com mix de paid e pending: totais calculados corretamente", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([
      { amountCents: 15000, status: "paid" },
      { amountCents: 20000, status: "paid" },
      { amountCents: 12000, status: "pending" },
      { amountCents: 8000, status: "pending" },
    ] as never)

    const result = await getFinancialSummary(USER_ID, 2026, 5)

    expect(result.totalPaidCents).toBe(35000)
    expect(result.totalPendingCents).toBe(20000)
    expect(result.sessionCount).toBe(4)
    expect(result.pendingCount).toBe(2)
  })

  it("registros de outro usuário não são incluídos: mock retorna array vazio para userId diferente", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    const result = await getFinancialSummary(OTHER_USER_ID, 2026, 5)

    expect(result.sessionCount).toBe(0)
    // O userId passado na query deve ser o OTHER_USER_ID
    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as { where: { userId: string } }
    expect(call.where.userId).toBe(OTHER_USER_ID)
  })

  it("cálculo do intervalo do mês: primeiro dia incluído (startDate = dia 1 do mês)", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getFinancialSummary(USER_ID, 2026, 5)

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as {
      where: { appointment: { scheduledAt: { gte: Date; lte: Date } } }
    }
    const startDate = call.where.appointment.scheduledAt.gte
    expect(startDate.getDate()).toBe(1)
    expect(startDate.getMonth()).toBe(4) // maio = índice 4
    expect(startDate.getFullYear()).toBe(2026)
  })

  it("cálculo do intervalo do mês: último dia incluído (endDate = último dia do mês)", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    // Fevereiro 2026 tem 28 dias
    await getFinancialSummary(USER_ID, 2026, 2)

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as {
      where: { appointment: { scheduledAt: { gte: Date; lte: Date } } }
    }
    const endDate = call.where.appointment.scheduledAt.lte
    expect(endDate.getDate()).toBe(28)
    expect(endDate.getMonth()).toBe(1) // fevereiro = índice 1
  })
})
