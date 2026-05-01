import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/features/auth/queries/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    patient: {
      findFirst: vi.fn(),
    },
    appointment: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("@/features/appointments/queries/getConflictingAppointments", () => ({
  getConflictingAppointments: vi.fn(),
}))

vi.mock("@/features/appointments/queries/getAppointmentById", () => ({
  getAppointmentById: vi.fn(),
}))

import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { getConflictingAppointments } from "@/features/appointments/queries/getConflictingAppointments"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"
import { createAppointment } from "../actions/createAppointment"
import { updateAppointment } from "../actions/updateAppointment"

const MOCK_USER = { id: "user-1", name: "Dr. Ana", email: "ana@example.com" }

const MOCK_PATIENT = {
  id: "patient-1",
  name: "João Silva",
  phone: "11999990001",
}

const PATIENT_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
const APPT_UUID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"

const VALID_FORM_INPUT = {
  patientId: PATIENT_UUID,
  scheduledAt: new Date("2026-05-10T09:00:00.000Z"),
  durationMinutes: 50,
  modality: "in_person" as const,
  location: null,
}

function makeAppointment(
  overrides: Partial<Record<string, unknown>> = {}
) {
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
})

// ---------------------------------------------------------------------------
// createAppointment
// ---------------------------------------------------------------------------
describe("createAppointment", () => {
  it("lança erro quando getCurrentUser lança (não autenticado)", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(createAppointment(VALID_FORM_INPUT)).rejects.toThrow(
      "Não autenticado"
    )
  })

  it("lança erro quando paciente está inativo ou não pertence ao psicólogo", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    await expect(createAppointment(VALID_FORM_INPUT)).rejects.toThrow(
      "Paciente não encontrado ou inativo"
    )
    expect(prisma.appointment.create).not.toHaveBeenCalled()
  })

  it("busca paciente filtrando por isActive e userId", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    await expect(createAppointment(VALID_FORM_INPUT)).rejects.toThrow()

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: {
        id: VALID_FORM_INPUT.patientId,
        userId: MOCK_USER.id,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true },
    })
  })

  it("retorna conflict quando há conflito de horário", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(MOCK_PATIENT as any)

    const conflictingAppt = makeAppointment({
      id: "conflict-appt",
      scheduledAt: new Date("2026-05-10T08:30:00.000Z"),
      patient: { id: "patient-2", name: "Maria Santos", phone: "11988880002" },
    })
    vi.mocked(getConflictingAppointments).mockResolvedValue([conflictingAppt] as any)

    const result = await createAppointment(VALID_FORM_INPUT)

    expect(result).toMatchObject({
      success: false,
      error: {
        type: "conflict",
        message: expect.stringContaining("Maria Santos"),
      },
    })
    expect(prisma.appointment.create).not.toHaveBeenCalled()
  })

  it("mensagem de conflito inclui nome do paciente conflitante", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(MOCK_PATIENT as any)

    const conflictingAppt = makeAppointment({
      scheduledAt: new Date("2026-05-10T09:00:00.000Z"),
      patient: { id: "patient-2", name: "Ana Beatriz", phone: "11977770003" },
    })
    vi.mocked(getConflictingAppointments).mockResolvedValue([conflictingAppt] as any)

    const result = await createAppointment(VALID_FORM_INPUT)

    expect(result).toMatchObject({
      success: false,
      error: {
        type: "conflict",
        message: expect.stringContaining("Ana Beatriz"),
      },
    })
  })

  it("cria consulta com status 'scheduled' quando dados são válidos", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(MOCK_PATIENT as any)
    vi.mocked(getConflictingAppointments).mockResolvedValue([])
    vi.mocked(prisma.appointment.create).mockResolvedValue({
      id: "new-appt-1",
    } as any)

    const result = await createAppointment(VALID_FORM_INPUT)

    expect(result).toEqual({ success: true, appointmentId: "new-appt-1" })
    expect(prisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "scheduled",
          userId: MOCK_USER.id,
        }),
      })
    )
  })

  it("não verifica conflitos quando paciente é inválido", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    await expect(createAppointment(VALID_FORM_INPUT)).rejects.toThrow()

    expect(getConflictingAppointments).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// updateAppointment
// ---------------------------------------------------------------------------
describe("updateAppointment", () => {
  const VALID_UPDATE_INPUT = {
    appointmentId: APPT_UUID,
    ...VALID_FORM_INPUT,
  }

  it("lança erro quando getCurrentUser lança (não autenticado)", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(updateAppointment(VALID_UPDATE_INPUT)).rejects.toThrow(
      "Não autenticado"
    )
  })

  it("lança erro quando consulta não é encontrada", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(getAppointmentById).mockResolvedValue(null)

    await expect(updateAppointment(VALID_UPDATE_INPUT)).rejects.toThrow(
      "Consulta não encontrada"
    )
  })

  it("retorna erro para consulta com status 'completed'", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "completed" }) as any
    )

    const result = await updateAppointment(VALID_UPDATE_INPUT)

    expect(result).toEqual({
      success: false,
      error: "Consultas finalizadas não podem ser editadas.",
    })
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("retorna erro para consulta com status 'cancelled'", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "cancelled" }) as any
    )

    const result = await updateAppointment(VALID_UPDATE_INPUT)

    expect(result).toEqual({
      success: false,
      error: "Consultas finalizadas não podem ser editadas.",
    })
  })

  it("retorna erro para consulta com status 'no_show'", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "no_show" }) as any
    )

    const result = await updateAppointment(VALID_UPDATE_INPUT)

    expect(result).toEqual({
      success: false,
      error: "Consultas finalizadas não podem ser editadas.",
    })
  })

  it("verifica conflito passando excludeId quando horário muda", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({
        scheduledAt: new Date("2026-05-10T08:00:00.000Z"),
      }) as any
    )
    vi.mocked(getConflictingAppointments).mockResolvedValue([])
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    await updateAppointment(VALID_UPDATE_INPUT)

    expect(getConflictingAppointments).toHaveBeenCalledWith(
      MOCK_USER.id,
      VALID_FORM_INPUT.scheduledAt,
      VALID_FORM_INPUT.durationMinutes,
      VALID_UPDATE_INPUT.appointmentId
    )
  })

  it("retorna conflito quando novo horário conflita (com excludeId correto)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({
        scheduledAt: new Date("2026-05-10T08:00:00.000Z"),
      }) as any
    )

    const conflictingAppt = makeAppointment({
      id: "other-appt",
      patient: { id: "patient-3", name: "Carlos Souza", phone: "11966660004" },
    })
    vi.mocked(getConflictingAppointments).mockResolvedValue([conflictingAppt] as any)

    const result = await updateAppointment(VALID_UPDATE_INPUT)

    expect(result).toMatchObject({
      success: false,
      error: {
        type: "conflict",
        message: expect.stringContaining("Carlos Souza"),
      },
    })
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("não verifica conflito quando horário não muda", async () => {
    const existingAppt = makeAppointment({
      scheduledAt: VALID_FORM_INPUT.scheduledAt,
      durationMinutes: VALID_FORM_INPUT.durationMinutes,
    })
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(getAppointmentById).mockResolvedValue(existingAppt as any)
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    await updateAppointment(VALID_UPDATE_INPUT)

    expect(getConflictingAppointments).not.toHaveBeenCalled()
  })

  it("atualiza consulta com sucesso quando dados são válidos", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER)
    vi.mocked(getAppointmentById).mockResolvedValue(makeAppointment() as any)
    vi.mocked(getConflictingAppointments).mockResolvedValue([])
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await updateAppointment(VALID_UPDATE_INPUT)

    expect(result).toEqual({
      success: true,
      appointmentId: VALID_UPDATE_INPUT.appointmentId,
    })
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: VALID_UPDATE_INPUT.appointmentId,
          userId: MOCK_USER.id,
        },
      })
    )
  })
})
