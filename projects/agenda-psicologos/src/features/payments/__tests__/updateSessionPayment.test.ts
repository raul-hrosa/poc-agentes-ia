/**
 * Testes de integração — updateSessionPayment (TASK-07)
 * Cenários de negócio conforme spec controle-financeiro.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/features/auth/queries/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    sessionPayment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { updateSessionPayment } from "../actions/updateSessionPayment"

const USER_ID = "a1b2c3d4-1234-4abc-8def-000000000001"
const APPOINTMENT_ID = "a1b2c3d4-1234-4abc-8def-000000000002"
const PAYMENT_ID = "a1b2c3d4-1234-4abc-8def-000000000003"

const VALID_INPUT = {
  paymentId: PAYMENT_ID,
  amountBRL: "150,00",
  status: "paid" as const,
  paymentMethod: "pix" as const,
  notes: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: USER_ID,
    name: "Dr. Teste",
    email: "teste@example.com",
  })
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "pro" } as never)
  vi.mocked(prisma.sessionPayment.findFirst).mockResolvedValue({
    id: PAYMENT_ID,
    appointmentId: APPOINTMENT_ID,
  } as never)
  vi.mocked(prisma.sessionPayment.update).mockResolvedValue({} as never)
})

describe("updateSessionPayment — integração", () => {
  it("atualização válida: amountCents calculado corretamente", async () => {
    const result = await updateSessionPayment(VALID_INPUT)

    expect(result).toEqual({ success: true })
    const updateData = vi.mocked(prisma.sessionPayment.update).mock.calls[0][0].data
    expect(updateData.amountCents).toBe(15000)
  })

  it("mudança de pending para paid: paidAt é preenchido com data atual", async () => {
    const result = await updateSessionPayment({ ...VALID_INPUT, status: "paid" })

    expect(result).toEqual({ success: true })
    const updateData = vi.mocked(prisma.sessionPayment.update).mock.calls[0][0].data
    expect(updateData.paidAt).not.toBeNull()
    expect(updateData.paidAt).toBeInstanceOf(Date)
  })

  it("mudança de paid para pending: paidAt é zerado para null (AC-23)", async () => {
    const result = await updateSessionPayment({ ...VALID_INPUT, status: "pending" })

    expect(result).toEqual({ success: true })
    const updateData = vi.mocked(prisma.sessionPayment.update).mock.calls[0][0].data
    expect(updateData.paidAt).toBeNull()
  })

  it("registro não encontrado ou de outro usuário retorna { error: 'not_found' }", async () => {
    vi.mocked(prisma.sessionPayment.findFirst).mockResolvedValue(null)

    const result = await updateSessionPayment(VALID_INPUT)

    expect(result).toEqual({ error: "not_found" })
    expect(prisma.sessionPayment.update).not.toHaveBeenCalled()
  })

  it("usuário com plano free retorna { error: 'plan_required' } (RN-01)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as never)

    const result = await updateSessionPayment(VALID_INPUT)

    expect(result).toEqual({ error: "plan_required" })
    expect(prisma.sessionPayment.update).not.toHaveBeenCalled()
  })
})
