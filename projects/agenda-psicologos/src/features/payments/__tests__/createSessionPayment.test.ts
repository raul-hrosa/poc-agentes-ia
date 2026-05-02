/**
 * Testes de integração — createSessionPayment (TASK-07)
 * Cenários de negócio conforme spec controle-financeiro.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/features/auth/queries/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    appointment: { findFirst: vi.fn() },
    sessionPayment: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { createSessionPayment } from "../actions/createSessionPayment"

const USER_ID = "a1b2c3d4-1234-4abc-8def-000000000001"
const APPOINTMENT_ID = "a1b2c3d4-1234-4abc-8def-000000000002"

const VALID_INPUT = {
  appointmentId: APPOINTMENT_ID,
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
  vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
    id: APPOINTMENT_ID,
    status: "completed",
  } as never)
  vi.mocked(prisma.sessionPayment.findUnique).mockResolvedValue(null)
  vi.mocked(prisma.sessionPayment.create).mockResolvedValue({} as never)
})

describe("createSessionPayment — integração", () => {
  it("criação bem-sucedida com status paid: paidAt preenchido e amountCents = Math.round(amountBRL * 100)", async () => {
    const result = await createSessionPayment(VALID_INPUT)

    expect(result).toEqual({ success: true })
    const createData = vi.mocked(prisma.sessionPayment.create).mock.calls[0][0].data
    expect(createData.amountCents).toBe(15000)
    expect(createData.paidAt).not.toBeNull()
    expect(createData.paidAt).toBeInstanceOf(Date)
  })

  it("criação bem-sucedida com status pending: paidAt é null", async () => {
    const result = await createSessionPayment({ ...VALID_INPUT, status: "pending" })

    expect(result).toEqual({ success: true })
    const createData = vi.mocked(prisma.sessionPayment.create).mock.calls[0][0].data
    expect(createData.paidAt).toBeNull()
  })

  it("usuário com plano free retorna { error: 'plan_required' }", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as never)

    const result = await createSessionPayment(VALID_INPUT)

    expect(result).toEqual({ error: "plan_required" })
    expect(prisma.sessionPayment.create).not.toHaveBeenCalled()
  })

  it("consulta não encontrada ou de outro usuário retorna { error: 'not_found' }", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

    const result = await createSessionPayment(VALID_INPUT)

    expect(result).toEqual({ error: "not_found" })
  })

  it("consulta com status !== 'completed' retorna { error: 'invalid_status' }", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: APPOINTMENT_ID,
      status: "scheduled",
    } as never)

    const result = await createSessionPayment(VALID_INPUT)

    expect(result).toEqual({ error: "invalid_status" })
  })

  it("amountBRL vazio retorna { fieldErrors: { amountBRL: ['O valor da sessão é obrigatório'] } }", async () => {
    const result = await createSessionPayment({ ...VALID_INPUT, amountBRL: "" })

    expect(result).toHaveProperty("fieldErrors")
    const errors = (result as { fieldErrors: Record<string, string[]> }).fieldErrors
    expect(errors.amountBRL).toContain("O valor da sessão é obrigatório")
  })

  it("amountBRL zero retorna { fieldErrors: { amountBRL: ['O valor deve ser maior que zero'] } }", async () => {
    const result = await createSessionPayment({ ...VALID_INPUT, amountBRL: "0" })

    expect(result).toHaveProperty("fieldErrors")
    const errors = (result as { fieldErrors: Record<string, string[]> }).fieldErrors
    expect(errors.amountBRL).toContain("O valor deve ser maior que zero")
  })

  it("usuário não autenticado lança exceção 'Não autenticado'", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(createSessionPayment(VALID_INPUT)).rejects.toThrow("Não autenticado")
  })
})
