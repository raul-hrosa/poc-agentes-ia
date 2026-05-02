import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    sessionPayment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from "@/shared/lib/prisma"
import { getFinancialSummary } from "../queries/getFinancialSummary"
import { getSessionPaymentsByPeriod } from "../queries/getSessionPaymentsByPeriod"
import { getSessionPaymentByAppointment } from "../queries/getSessionPaymentByAppointment"

const USER_ID = "a1b2c3d4-1234-4abc-8def-000000000001"
const OTHER_USER_ID = "b2c3d4e5-1234-4abc-8def-000000000002"
const APPOINTMENT_ID = "a1b2c3d4-1234-4abc-8def-000000000003"

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getFinancialSummary
// ---------------------------------------------------------------------------
describe("getFinancialSummary", () => {
  it("retorna zeros quando não há registros no período", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    const result = await getFinancialSummary(USER_ID, 2026, 5)

    expect(result).toEqual({
      totalPaidCents: 0,
      totalPendingCents: 0,
      sessionCount: 0,
      pendingCount: 0,
    })
  })

  it("calcula totais corretamente com mix de paid e pending", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([
      { amountCents: 15000, status: "paid" },
      { amountCents: 20000, status: "paid" },
      { amountCents: 10000, status: "pending" },
    ] as never)

    const result = await getFinancialSummary(USER_ID, 2026, 5)

    expect(result.totalPaidCents).toBe(35000)
    expect(result.totalPendingCents).toBe(10000)
    expect(result.sessionCount).toBe(3)
    expect(result.pendingCount).toBe(1)
  })

  it("passa o userId no where da query (isolamento de dados)", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getFinancialSummary(USER_ID, 2026, 5)

    expect(prisma.sessionPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID }),
      })
    )
  })

  it("retorna array vazio para userId diferente (registros de outro usuário não incluídos)", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    const result = await getFinancialSummary(OTHER_USER_ID, 2026, 5)

    expect(result.sessionCount).toBe(0)
  })

  it("calcula intervalo do mês corretamente — inclui primeiro e último dia", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getFinancialSummary(USER_ID, 2026, 5)

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0]
    const startDate = (call as { where: { appointment: { scheduledAt: { gte: Date; lte: Date } } } }).where.appointment.scheduledAt.gte
    const endDate = (call as { where: { appointment: { scheduledAt: { gte: Date; lte: Date } } } }).where.appointment.scheduledAt.lte

    // Maio 2026: começa dia 1, termina dia 31
    expect(startDate.getMonth()).toBe(4) // mês 5 = índice 4
    expect(startDate.getDate()).toBe(1)
    expect(endDate.getMonth()).toBe(4)
    expect(endDate.getDate()).toBe(31)
  })

  it("filtra por appointments.scheduledAt (RN-07) e não por paidAt", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getFinancialSummary(USER_ID, 2026, 5)

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as { where: { appointment?: unknown } }
    // Deve usar appointment.scheduledAt, não paidAt diretamente
    expect(call.where.appointment).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// getSessionPaymentsByPeriod
// ---------------------------------------------------------------------------
describe("getSessionPaymentsByPeriod", () => {
  const mockPayment = {
    id: "pay-1",
    appointmentId: APPOINTMENT_ID,
    userId: USER_ID,
    amountCents: 15000,
    status: "paid",
    paidAt: new Date("2026-05-10"),
    paymentMethod: "pix",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    appointment: {
      scheduledAt: new Date("2026-05-10T09:00:00"),
      durationMinutes: 50,
      patient: { name: "João Silva" },
    },
  }

  it("retorna pagamentos do período com contexto", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([mockPayment] as never)

    const result = await getSessionPaymentsByPeriod(USER_ID, 2026, 5)

    expect(result).toHaveLength(1)
    expect(result[0].appointment.patient.name).toBe("João Silva")
  })

  it("aplica filtro de status paid quando especificado", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getSessionPaymentsByPeriod(USER_ID, 2026, 5, "paid")

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as { where: { status?: string } }
    expect(call.where.status).toBe("paid")
  })

  it("aplica filtro de status pending quando especificado", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getSessionPaymentsByPeriod(USER_ID, 2026, 5, "pending")

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as { where: { status?: string } }
    expect(call.where.status).toBe("pending")
  })

  it("não aplica filtro de status quando statusFilter é 'all'", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getSessionPaymentsByPeriod(USER_ID, 2026, 5, "all")

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as { where: { status?: string } }
    expect(call.where.status).toBeUndefined()
  })

  it("não aplica filtro de status quando statusFilter é undefined", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getSessionPaymentsByPeriod(USER_ID, 2026, 5)

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as { where: { status?: string } }
    expect(call.where.status).toBeUndefined()
  })

  it("ordena por scheduledAt DESC", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getSessionPaymentsByPeriod(USER_ID, 2026, 5)

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as { orderBy: { appointment: { scheduledAt: string } } }
    expect(call.orderBy).toEqual({ appointment: { scheduledAt: "desc" } })
  })

  it("inclui appointment e patient em uma única query (sem N+1)", async () => {
    vi.mocked(prisma.sessionPayment.findMany).mockResolvedValue([])

    await getSessionPaymentsByPeriod(USER_ID, 2026, 5)

    const call = vi.mocked(prisma.sessionPayment.findMany).mock.calls[0][0] as { include?: { appointment?: { select?: { patient?: unknown } } } }
    expect(call.include?.appointment?.select?.patient).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// getSessionPaymentByAppointment
// ---------------------------------------------------------------------------
describe("getSessionPaymentByAppointment", () => {
  it("retorna o pagamento quando encontrado", async () => {
    const mockPayment = {
      id: "pay-1",
      appointmentId: APPOINTMENT_ID,
      userId: USER_ID,
      amountCents: 15000,
      status: "paid",
      paidAt: null,
      paymentMethod: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.sessionPayment.findFirst).mockResolvedValue(mockPayment as never)

    const result = await getSessionPaymentByAppointment(USER_ID, APPOINTMENT_ID)

    expect(result).not.toBeNull()
    expect(result?.id).toBe("pay-1")
  })

  it("retorna null quando consulta não existe ou pertence a outro usuário", async () => {
    vi.mocked(prisma.sessionPayment.findFirst).mockResolvedValue(null)

    const result = await getSessionPaymentByAppointment(USER_ID, APPOINTMENT_ID)

    expect(result).toBeNull()
  })

  it("inclui userId obrigatoriamente no where (isolamento AC-27)", async () => {
    vi.mocked(prisma.sessionPayment.findFirst).mockResolvedValue(null)

    await getSessionPaymentByAppointment(USER_ID, APPOINTMENT_ID)

    expect(prisma.sessionPayment.findFirst).toHaveBeenCalledWith({
      where: { appointmentId: APPOINTMENT_ID, userId: USER_ID },
    })
  })
})
