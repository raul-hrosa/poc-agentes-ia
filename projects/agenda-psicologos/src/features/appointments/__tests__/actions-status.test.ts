import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/features/auth/queries/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    appointment: {
      update: vi.fn(),
    },
  },
}))

vi.mock("@/features/appointments/queries/getAppointmentById", () => ({
  getAppointmentById: vi.fn(),
}))

import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"
import { cancelAppointment } from "../actions/cancelAppointment"
import { completeAppointment } from "../actions/completeAppointment"
import { markNoShow } from "../actions/markNoShow"

const MOCK_USER = { id: "user-1", name: "Dr. Ana", email: "ana@example.com" }

const APPT_UUID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"
const PATIENT_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

function makeAppointment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPT_UUID,
    userId: "user-1",
    patientId: PATIENT_UUID,
    scheduledAt: new Date("2026-05-10T09:00:00.000Z"),
    durationMinutes: 50,
    modality: "in_person",
    location: null,
    status: "scheduled",
    cancellationReason: null,
    createdAt: new Date("2026-05-01T08:00:00.000Z"),
    updatedAt: new Date("2026-05-01T08:00:00.000Z"),
    patient: { id: "patient-1", name: "João Silva", phone: "11999990001" },
    hasNote: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
})

// ---------------------------------------------------------------------------
// cancelAppointment
// ---------------------------------------------------------------------------
describe("cancelAppointment", () => {
  it("cancela consulta 'scheduled' com motivo — success, cancellationReason preenchido", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "scheduled" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await cancelAppointment({
      appointmentId: APPT_UUID,
      cancellationReason: "Paciente solicitou cancelamento",
    })

    expect(result).toEqual({ success: true })
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APPT_UUID, userId: MOCK_USER.id },
        data: {
          status: "cancelled",
          cancellationReason: "Paciente solicitou cancelamento",
        },
      })
    )
  })

  it("cancela consulta 'scheduled' sem motivo — success, cancellationReason = null", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "scheduled" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await cancelAppointment({
      appointmentId: APPT_UUID,
    })

    expect(result).toEqual({ success: true })
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "cancelled",
          cancellationReason: null,
        },
      })
    )
  })

  it("cancela consulta 'confirmed' — success", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "confirmed" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await cancelAppointment({ appointmentId: APPT_UUID })

    expect(result).toEqual({ success: true })
  })

  it("lança erro ao cancelar consulta com status 'completed'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "completed" }) as any
    )

    await expect(cancelAppointment({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Esta consulta não pode ser cancelada."
    )
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("lança erro ao cancelar consulta com status 'cancelled'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "cancelled" }) as any
    )

    await expect(cancelAppointment({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Esta consulta não pode ser cancelada."
    )
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("lança erro ao cancelar consulta com status 'no_show'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "no_show" }) as any
    )

    await expect(cancelAppointment({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Esta consulta não pode ser cancelada."
    )
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("lança erro quando consulta não é encontrada", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(null)

    await expect(cancelAppointment({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Consulta não encontrada"
    )
  })

  it("NÃO preenche deletedAt ao cancelar (RN-08)", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "scheduled" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    await cancelAppointment({ appointmentId: APPT_UUID })

    const callArgs = vi.mocked(prisma.appointment.update).mock.calls[0][0]
    expect(callArgs.data).not.toHaveProperty("deletedAt")
  })
})

// ---------------------------------------------------------------------------
// completeAppointment
// ---------------------------------------------------------------------------
describe("completeAppointment", () => {
  it("completa consulta 'scheduled' — success, status = 'completed'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "scheduled" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await completeAppointment({ appointmentId: APPT_UUID })

    expect(result).toEqual({ success: true })
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APPT_UUID, userId: MOCK_USER.id },
        data: { status: "completed" },
      })
    )
  })

  it("completa consulta 'confirmed' — success", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "confirmed" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await completeAppointment({ appointmentId: APPT_UUID })

    expect(result).toEqual({ success: true })
  })

  it("lança erro ao completar consulta com status 'cancelled'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "cancelled" }) as any
    )

    await expect(
      completeAppointment({ appointmentId: APPT_UUID })
    ).rejects.toThrow("Não é possível marcar esta consulta como realizada.")
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("lança erro ao completar consulta com status 'completed'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "completed" }) as any
    )

    await expect(
      completeAppointment({ appointmentId: APPT_UUID })
    ).rejects.toThrow("Não é possível marcar esta consulta como realizada.")
  })

  it("lança erro ao completar consulta com status 'no_show'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "no_show" }) as any
    )

    await expect(
      completeAppointment({ appointmentId: APPT_UUID })
    ).rejects.toThrow("Não é possível marcar esta consulta como realizada.")
  })

  it("lança erro quando consulta não é encontrada", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(null)

    await expect(
      completeAppointment({ appointmentId: APPT_UUID })
    ).rejects.toThrow("Consulta não encontrada")
  })
})

// ---------------------------------------------------------------------------
// markNoShow
// ---------------------------------------------------------------------------
describe("markNoShow", () => {
  it("registra no-show de consulta 'scheduled' — success, status = 'no_show'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "scheduled" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await markNoShow({ appointmentId: APPT_UUID })

    expect(result).toEqual({ success: true })
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: APPT_UUID, userId: MOCK_USER.id },
        data: { status: "no_show" },
      })
    )
  })

  it("registra no-show de consulta 'confirmed' — success", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "confirmed" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await markNoShow({ appointmentId: APPT_UUID })

    expect(result).toEqual({ success: true })
  })

  it("lança erro ao registrar no-show de consulta com status 'no_show'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "no_show" }) as any
    )

    await expect(markNoShow({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Não é possível registrar falta nesta consulta."
    )
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("lança erro ao registrar no-show de consulta com status 'cancelled'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "cancelled" }) as any
    )

    await expect(markNoShow({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Não é possível registrar falta nesta consulta."
    )
  })

  it("lança erro ao registrar no-show de consulta com status 'completed'", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "completed" }) as any
    )

    await expect(markNoShow({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Não é possível registrar falta nesta consulta."
    )
  })

  it("lança erro quando consulta não é encontrada", async () => {
    vi.mocked(getAppointmentById).mockResolvedValue(null)

    await expect(markNoShow({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Consulta não encontrada"
    )
  })
})
