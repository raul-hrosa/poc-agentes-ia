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
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { createSessionPayment } from "../actions/createSessionPayment"
import { updateSessionPayment } from "../actions/updateSessionPayment"

const USER_ID = "a1b2c3d4-1234-4abc-8def-000000000001"
const APPOINTMENT_ID = "a1b2c3d4-1234-4abc-8def-000000000002"
const PAYMENT_ID = "a1b2c3d4-1234-4abc-8def-000000000003"

const VALID_CREATE_INPUT = {
  appointmentId: APPOINTMENT_ID,
  amountBRL: "150,00",
  status: "paid" as const,
  paymentMethod: "pix" as const,
  notes: null,
}

const VALID_UPDATE_INPUT = {
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
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    plan: "pro",
  } as never)
  vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
    id: APPOINTMENT_ID,
    status: "completed",
  } as never)
  vi.mocked(prisma.sessionPayment.findUnique).mockResolvedValue(null)
  vi.mocked(prisma.sessionPayment.create).mockResolvedValue({} as never)
})

// ---------------------------------------------------------------------------
// createSessionPayment
// ---------------------------------------------------------------------------
describe("createSessionPayment", () => {
  it("cria pagamento com status paid e paidAt preenchido", async () => {
    vi.mocked(prisma.sessionPayment.create).mockResolvedValue({} as never)

    const result = await createSessionPayment(VALID_CREATE_INPUT)

    expect(result).toEqual({ success: true })
    const createCall = vi.mocked(prisma.sessionPayment.create).mock.calls[0][0]
    expect(createCall.data.amountCents).toBe(15000)
    expect(createCall.data.paidAt).not.toBeNull()
    expect(createCall.data.status).toBe("paid")
  })

  it("cria pagamento com status pending e paidAt null", async () => {
    const result = await createSessionPayment({
      ...VALID_CREATE_INPUT,
      status: "pending",
    })

    expect(result).toEqual({ success: true })
    const createCall = vi.mocked(prisma.sessionPayment.create).mock.calls[0][0]
    expect(createCall.data.paidAt).toBeNull()
    expect(createCall.data.status).toBe("pending")
  })

  it("retorna plan_required para usuário com plano free (RN-01)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as never)

    const result = await createSessionPayment(VALID_CREATE_INPUT)

    expect(result).toEqual({ error: "plan_required" })
  })

  it("retorna not_found quando consulta não existe ou pertence a outro usuário", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

    const result = await createSessionPayment(VALID_CREATE_INPUT)

    expect(result).toEqual({ error: "not_found" })
  })

  it("retorna invalid_status quando consulta não está completed (RN-02, CE-03)", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: APPOINTMENT_ID,
      status: "scheduled",
    } as never)

    const result = await createSessionPayment(VALID_CREATE_INPUT)

    expect(result).toEqual({ error: "invalid_status" })
  })

  it("retorna fieldErrors quando amountBRL está vazio", async () => {
    const result = await createSessionPayment({
      ...VALID_CREATE_INPUT,
      amountBRL: "",
    })

    expect(result).toHaveProperty("fieldErrors")
    expect((result as { fieldErrors: Record<string, string[]> }).fieldErrors.amountBRL).toContain(
      "O valor da sessão é obrigatório"
    )
  })

  it("retorna fieldErrors quando amountBRL é zero", async () => {
    const result = await createSessionPayment({
      ...VALID_CREATE_INPUT,
      amountBRL: "0",
    })

    expect(result).toHaveProperty("fieldErrors")
    expect((result as { fieldErrors: Record<string, string[]> }).fieldErrors.amountBRL).toContain(
      "O valor deve ser maior que zero"
    )
  })

  it("lança exceção quando usuário não está autenticado", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(createSessionPayment(VALID_CREATE_INPUT)).rejects.toThrow("Não autenticado")
  })

  it("calcula amountCents corretamente com Math.round (RN-04)", async () => {
    await createSessionPayment({ ...VALID_CREATE_INPUT, amountBRL: "150,50" })

    const createCall = vi.mocked(prisma.sessionPayment.create).mock.calls[0][0]
    expect(createCall.data.amountCents).toBe(15050)
  })

  it("verifica ownership da consulta com userId no where (AC-27)", async () => {
    await createSessionPayment(VALID_CREATE_INPUT)

    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID }),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// updateSessionPayment
// ---------------------------------------------------------------------------
describe("updateSessionPayment", () => {
  beforeEach(() => {
    vi.mocked(prisma.sessionPayment.findFirst).mockResolvedValue({
      id: PAYMENT_ID,
      appointmentId: APPOINTMENT_ID,
    } as never)
    vi.mocked(prisma.sessionPayment.update).mockResolvedValue({} as never)
  })

  it("atualiza pagamento com amountCents calculado corretamente", async () => {
    const result = await updateSessionPayment(VALID_UPDATE_INPUT)

    expect(result).toEqual({ success: true })
    const updateCall = vi.mocked(prisma.sessionPayment.update).mock.calls[0][0]
    expect(updateCall.data.amountCents).toBe(15000)
  })

  it("preenche paidAt ao mudar de pending para paid (RN-05)", async () => {
    const result = await updateSessionPayment({ ...VALID_UPDATE_INPUT, status: "paid" })

    expect(result).toEqual({ success: true })
    const updateCall = vi.mocked(prisma.sessionPayment.update).mock.calls[0][0]
    expect(updateCall.data.paidAt).not.toBeNull()
  })

  it("zera paidAt ao mudar de paid para pending (AC-23)", async () => {
    const result = await updateSessionPayment({ ...VALID_UPDATE_INPUT, status: "pending" })

    expect(result).toEqual({ success: true })
    const updateCall = vi.mocked(prisma.sessionPayment.update).mock.calls[0][0]
    expect(updateCall.data.paidAt).toBeNull()
  })

  it("retorna not_found quando pagamento não existe ou pertence a outro usuário", async () => {
    vi.mocked(prisma.sessionPayment.findFirst).mockResolvedValue(null)

    const result = await updateSessionPayment(VALID_UPDATE_INPUT)

    expect(result).toEqual({ error: "not_found" })
  })

  it("retorna plan_required para usuário com plano free (RN-01)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as never)

    const result = await updateSessionPayment(VALID_UPDATE_INPUT)

    expect(result).toEqual({ error: "plan_required" })
  })

  it("verifica ownership do pagamento com userId no where (AC-27)", async () => {
    await updateSessionPayment(VALID_UPDATE_INPUT)

    expect(prisma.sessionPayment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID }),
      })
    )
  })
})
