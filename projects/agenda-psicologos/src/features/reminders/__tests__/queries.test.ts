import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
    },
    appointmentToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/shared/lib/tokens", () => ({
  buildConfirmationLink: (token: string) =>
    `https://app.psiagenda.com.br/confirm/${token}`,
}))

import { prisma } from "@/shared/lib/prisma"
import { getLatestReminderForAppointment } from "../queries/getLatestReminderForAppointment"
import { getTokenForConfirmPage } from "../queries/getTokenForConfirmPage"

const USER_ID = "user-aaa"
const APPOINTMENT_ID = "appt-111"
const TOKEN = "a".repeat(64)

const mockAppointmentFind = prisma.appointment.findFirst as ReturnType<typeof vi.fn>
const mockTokenFindFirst = prisma.appointmentToken.findFirst as ReturnType<typeof vi.fn>
const mockTokenFindUnique = prisma.appointmentToken.findUnique as ReturnType<typeof vi.fn>

function makeTokenRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "token-id-1",
    createdAt: new Date("2026-05-02T10:00:00.000Z"),
    appointmentId: APPOINTMENT_ID,
    token: TOKEN,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    usedAt: null,
    action: null,
    ...overrides,
  }
}

function makeAppointment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPOINTMENT_ID,
    scheduledAt: new Date("2026-05-10T09:00:00.000Z"),
    durationMinutes: 50,
    modality: "in_person",
    location: null,
    status: "scheduled",
    cancellationReason: null,
    patient: { id: "patient-1", name: "Ana Lima", phone: "11999990001" },
    user: { id: USER_ID, name: "Dr. João" },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getLatestReminderForAppointment", () => {
  it("lança erro se consulta não for encontrada", async () => {
    mockAppointmentFind.mockResolvedValue(null)
    await expect(
      getLatestReminderForAppointment(APPOINTMENT_ID, USER_ID),
    ).rejects.toThrow("Consulta não encontrada")
  })

  it("retorna null quando não há token para a consulta", async () => {
    mockAppointmentFind.mockResolvedValue({ id: APPOINTMENT_ID })
    mockTokenFindFirst.mockResolvedValue(null)

    const result = await getLatestReminderForAppointment(APPOINTMENT_ID, USER_ID)
    expect(result).toBeNull()
  })

  it("retorna ReminderInfo com status 'pending' para token sem action", async () => {
    mockAppointmentFind.mockResolvedValue({ id: APPOINTMENT_ID })
    mockTokenFindFirst.mockResolvedValue(makeTokenRecord({ action: null }))

    const result = await getLatestReminderForAppointment(APPOINTMENT_ID, USER_ID)
    expect(result).not.toBeNull()
    expect(result!.status).toBe("pending")
    expect(result!.action).toBeNull()
    expect(result!.link).toContain(TOKEN)
  })

  it("retorna status 'confirmed' quando action é 'confirmed'", async () => {
    mockAppointmentFind.mockResolvedValue({ id: APPOINTMENT_ID })
    mockTokenFindFirst.mockResolvedValue(
      makeTokenRecord({
        action: "confirmed",
        usedAt: new Date("2026-05-03T12:00:00.000Z"),
      }),
    )

    const result = await getLatestReminderForAppointment(APPOINTMENT_ID, USER_ID)
    expect(result!.status).toBe("confirmed")
    expect(result!.action).toBe("confirmed")
  })

  it("retorna status 'cancelled' quando action é 'cancelled'", async () => {
    mockAppointmentFind.mockResolvedValue({ id: APPOINTMENT_ID })
    mockTokenFindFirst.mockResolvedValue(
      makeTokenRecord({
        action: "cancelled",
        usedAt: new Date("2026-05-03T12:00:00.000Z"),
      }),
    )

    const result = await getLatestReminderForAppointment(APPOINTMENT_ID, USER_ID)
    expect(result!.status).toBe("cancelled")
    expect(result!.action).toBe("cancelled")
  })

  it("filtra consulta por userId (isolamento)", async () => {
    mockAppointmentFind.mockResolvedValue(null)

    await expect(
      getLatestReminderForAppointment(APPOINTMENT_ID, "outro-user"),
    ).rejects.toThrow("Consulta não encontrada")

    expect(mockAppointmentFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "outro-user" }),
      }),
    )
  })
})

describe("getTokenForConfirmPage", () => {
  it("retorna not_found quando token não existe", async () => {
    mockTokenFindUnique.mockResolvedValue(null)

    const result = await getTokenForConfirmPage(TOKEN)
    expect(result).toEqual({ valid: false, reason: "not_found" })
  })

  it("retorna expired quando token está expirado", async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...makeTokenRecord({ expiresAt: new Date(Date.now() - 1000) }),
      appointment: makeAppointment(),
    })

    const result = await getTokenForConfirmPage(TOKEN)
    expect(result).toEqual({ valid: false, reason: "expired" })
  })

  it("retorna used com action quando token já foi utilizado", async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...makeTokenRecord({
        usedAt: new Date("2026-05-03T12:00:00.000Z"),
        action: "confirmed",
      }),
      appointment: makeAppointment(),
    })

    const result = await getTokenForConfirmPage(TOKEN)
    expect(result).toEqual({ valid: false, reason: "used", action: "confirmed" })
  })

  it("retorna appointment_closed quando consulta está cancelada", async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...makeTokenRecord(),
      appointment: makeAppointment({ status: "cancelled" }),
    })

    const result = await getTokenForConfirmPage(TOKEN)
    expect(result).toEqual({ valid: false, reason: "appointment_closed" })
  })

  it("retorna appointment_closed quando consulta está completada", async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...makeTokenRecord(),
      appointment: makeAppointment({ status: "completed" }),
    })

    const result = await getTokenForConfirmPage(TOKEN)
    expect(result).toEqual({ valid: false, reason: "appointment_closed" })
  })

  it("retorna appointment_closed quando consulta é no_show", async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...makeTokenRecord(),
      appointment: makeAppointment({ status: "no_show" }),
    })

    const result = await getTokenForConfirmPage(TOKEN)
    expect(result).toEqual({ valid: false, reason: "appointment_closed" })
  })

  it("retorna dados válidos para token ativo com consulta agendada", async () => {
    const tokenRecord = {
      ...makeTokenRecord(),
      appointment: makeAppointment({ status: "scheduled" }),
    }
    mockTokenFindUnique.mockResolvedValue(tokenRecord)

    const result = await getTokenForConfirmPage(TOKEN)
    expect(result).toMatchObject({
      valid: true,
      token: TOKEN,
      action: null,
      patient: { name: "Ana Lima" },
      psychologist: { name: "Dr. João" },
      appointment: expect.objectContaining({
        status: "scheduled",
        modality: "in_person",
      }),
    })
  })

  it("retorna dados válidos para consulta confirmada (status confirmed)", async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...makeTokenRecord(),
      appointment: makeAppointment({ status: "confirmed" }),
    })

    const result = await getTokenForConfirmPage(TOKEN)
    expect(result).toMatchObject({ valid: true })
  })

  it("não expõe session_notes ou session_payments nos dados retornados", async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...makeTokenRecord(),
      appointment: makeAppointment(),
    })

    const result = await getTokenForConfirmPage(TOKEN)
    if (result.valid) {
      expect(result).not.toHaveProperty("session_notes")
      expect(result).not.toHaveProperty("session_payments")
      expect(result.appointment).not.toHaveProperty("session_notes")
      expect(result.appointment).not.toHaveProperty("session_payments")
    }
  })
})
