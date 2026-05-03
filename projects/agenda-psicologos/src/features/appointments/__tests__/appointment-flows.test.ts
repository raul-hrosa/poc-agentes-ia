import { describe, it, expect, vi, beforeEach } from "vitest"

// Mocks declarados antes de qualquer import — obrigatório no Vitest
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
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    appointmentToken: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
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
import { cancelAppointment } from "../actions/cancelAppointment"
import { completeAppointment } from "../actions/completeAppointment"
import { markNoShow } from "../actions/markNoShow"

// ---------------------------------------------------------------------------
// Constantes de teste
// ---------------------------------------------------------------------------
const USER_1 = { id: "user-1", name: "Dr. Ana", email: "ana@example.com" }
const USER_2 = { id: "user-2", name: "Dr. Pedro", email: "pedro@example.com" }

const PATIENT_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
const APPT_UUID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"
const CONFLICT_APPT_UUID = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33"

const MOCK_PATIENT = {
  id: PATIENT_UUID,
  name: "João Silva",
  phone: "11999990001",
}

const VALID_FORM_INPUT = {
  patientId: PATIENT_UUID,
  scheduledAt: new Date("2026-05-10T09:00:00.000Z"),
  durationMinutes: 50,
  modality: "in_person" as const,
  location: null,
}

function makeAppointment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPT_UUID,
    userId: USER_1.id,
    patientId: PATIENT_UUID,
    scheduledAt: new Date("2026-05-10T09:00:00.000Z"),
    durationMinutes: 50,
    modality: "in_person",
    location: null,
    status: "scheduled",
    cancellationReason: null,
    createdAt: new Date("2026-05-01T08:00:00.000Z"),
    updatedAt: new Date("2026-05-01T08:00:00.000Z"),
    patient: { id: PATIENT_UUID, name: "João Silva", phone: "11999990001" },
    hasNote: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// Fluxo 1 — Criação de consulta
// ===========================================================================
describe("Fluxo 1 — Criação de consulta", () => {
  it("criar válido → appointments.create chamado com status = 'scheduled'", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
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
          userId: USER_1.id,
        }),
      })
    )
  })

  it("criar com paciente inativo → lança erro 'Paciente não encontrado ou inativo'", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    await expect(createAppointment(VALID_FORM_INPUT)).rejects.toThrow(
      "Paciente não encontrado ou inativo"
    )
    expect(prisma.appointment.create).not.toHaveBeenCalled()
  })

  it("criar com conflito de horário → retorna { type: 'conflict', message } com nome do paciente conflitante", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(MOCK_PATIENT as any)

    const conflictingAppt = makeAppointment({
      id: CONFLICT_APPT_UUID,
      scheduledAt: new Date("2026-05-10T08:30:00.000Z"),
      patient: { id: "patient-2", name: "Maria Santos", phone: "11988880002" },
    })
    vi.mocked(getConflictingAppointments).mockResolvedValue(
      [conflictingAppt] as any
    )

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

  it("criar sem autenticação → lança erro 'Não autenticado'", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(createAppointment(VALID_FORM_INPUT)).rejects.toThrow(
      "Não autenticado"
    )
    expect(prisma.patient.findFirst).not.toHaveBeenCalled()
    expect(prisma.appointment.create).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// Fluxo 2 — Edição de consulta
// ===========================================================================
describe("Fluxo 2 — Edição de consulta", () => {
  const VALID_UPDATE_INPUT = {
    appointmentId: APPT_UUID,
    ...VALID_FORM_INPUT,
  }

  it("editar 'scheduled' → appointments.update chamado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({ status: "scheduled" }) as any
    )
    vi.mocked(getConflictingAppointments).mockResolvedValue([])
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await updateAppointment(VALID_UPDATE_INPUT)

    expect(result).toEqual({
      success: true,
      appointmentId: VALID_UPDATE_INPUT.appointmentId,
    })
    expect(prisma.appointment.update).toHaveBeenCalled()
  })

  it("editar 'completed' → retorna erro 'Consultas finalizadas não podem ser editadas.'", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
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

  it("editar com novo horário conflitante → retorna conflito com excludeId correto", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({
        scheduledAt: new Date("2026-05-10T08:00:00.000Z"),
      }) as any
    )

    const conflictingAppt = makeAppointment({
      id: CONFLICT_APPT_UUID,
      patient: { id: "patient-3", name: "Carlos Souza", phone: "11966660004" },
    })
    vi.mocked(getConflictingAppointments).mockResolvedValue(
      [conflictingAppt] as any
    )

    const result = await updateAppointment(VALID_UPDATE_INPUT)

    expect(result).toMatchObject({
      success: false,
      error: {
        type: "conflict",
        message: expect.stringContaining("Carlos Souza"),
      },
    })
    // Verifica que excludeId foi passado corretamente
    expect(getConflictingAppointments).toHaveBeenCalledWith(
      USER_1.id,
      VALID_FORM_INPUT.scheduledAt,
      VALID_FORM_INPUT.durationMinutes,
      VALID_UPDATE_INPUT.appointmentId
    )
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("editar com novo horário sem conflito → sucesso", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
    vi.mocked(getAppointmentById).mockResolvedValue(
      makeAppointment({
        scheduledAt: new Date("2026-05-10T08:00:00.000Z"),
      }) as any
    )
    vi.mocked(getConflictingAppointments).mockResolvedValue([])
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await updateAppointment(VALID_UPDATE_INPUT)

    expect(result).toEqual({
      success: true,
      appointmentId: VALID_UPDATE_INPUT.appointmentId,
    })
  })
})

// ===========================================================================
// Fluxo 3 — Cancelamento
// ===========================================================================
describe("Fluxo 3 — Cancelamento", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
    vi.mocked(prisma.$transaction).mockImplementation(
      async (ops: unknown) => {
        if (Array.isArray(ops)) {
          return Promise.all(ops)
        }
        return (ops as () => Promise<unknown>)()
      }
    )
    vi.mocked(prisma.appointmentToken.updateMany).mockResolvedValue({ count: 0 } as any)
  })

  it("cancelar 'scheduled' com motivo → status = 'cancelled', cancellationReason preenchido", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
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
        where: { id: APPT_UUID },
        data: {
          status: "cancelled",
          cancellationReason: "Paciente solicitou cancelamento",
        },
      })
    )
  })

  it("cancelar 'scheduled' sem motivo → cancellationReason = null", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      makeAppointment({ status: "scheduled" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    const result = await cancelAppointment({ appointmentId: APPT_UUID })

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

  it("cancelar 'completed' → lança erro", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      makeAppointment({ status: "completed" }) as any
    )

    await expect(cancelAppointment({ appointmentId: APPT_UUID })).rejects.toThrow(
      "Não é possível cancelar esta consulta"
    )
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("deletedAt NÃO é preenchido ao cancelar (RN-08)", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      makeAppointment({ status: "scheduled" }) as any
    )
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

    await cancelAppointment({ appointmentId: APPT_UUID })

    const callArgs = vi.mocked(prisma.appointment.update).mock.calls[0][0]
    expect(callArgs.data).not.toHaveProperty("deletedAt")
  })
})

// ===========================================================================
// Fluxo 4 — Transições de status
// ===========================================================================
describe("Fluxo 4 — Transições de status", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue(USER_1)
  })

  describe("completeAppointment", () => {
    it("completar 'scheduled' → sucesso", async () => {
      vi.mocked(getAppointmentById).mockResolvedValue(
        makeAppointment({ status: "scheduled" }) as any
      )
      vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

      const result = await completeAppointment({ appointmentId: APPT_UUID })

      expect(result).toEqual({ success: true })
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "completed" },
        })
      )
    })

    it("completar 'confirmed' → sucesso", async () => {
      vi.mocked(getAppointmentById).mockResolvedValue(
        makeAppointment({ status: "confirmed" }) as any
      )
      vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

      const result = await completeAppointment({ appointmentId: APPT_UUID })

      expect(result).toEqual({ success: true })
    })

    it("completar 'cancelled' → lança erro", async () => {
      vi.mocked(getAppointmentById).mockResolvedValue(
        makeAppointment({ status: "cancelled" }) as any
      )

      await expect(
        completeAppointment({ appointmentId: APPT_UUID })
      ).rejects.toThrow("Não é possível marcar esta consulta como realizada.")
      expect(prisma.appointment.update).not.toHaveBeenCalled()
    })
  })

  describe("markNoShow", () => {
    it("no-show de 'scheduled' → sucesso", async () => {
      vi.mocked(getAppointmentById).mockResolvedValue(
        makeAppointment({ status: "scheduled" }) as any
      )
      vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

      const result = await markNoShow({ appointmentId: APPT_UUID })

      expect(result).toEqual({ success: true })
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "no_show" },
        })
      )
    })

    it("no-show de 'no_show' → lança erro", async () => {
      vi.mocked(getAppointmentById).mockResolvedValue(
        makeAppointment({ status: "no_show" }) as any
      )

      await expect(
        markNoShow({ appointmentId: APPT_UUID })
      ).rejects.toThrow("Não é possível registrar falta nesta consulta.")
      expect(prisma.appointment.update).not.toHaveBeenCalled()
    })
  })
})

// ===========================================================================
// Fluxo 5 — Isolamento de dados
// ===========================================================================
describe("Fluxo 5 — Isolamento de dados", () => {
  it("cancelAppointment com consulta pertencente a outro psicólogo → lança 'Consulta não encontrada'", async () => {
    // Simula o que acontece quando a consulta pertence ao USER_1 mas USER_2 tenta cancelar:
    // prisma.appointment.findUnique retorna a consulta com userId = USER_1
    // a action verifica appointment.userId !== user.id e lança erro
    vi.mocked(getCurrentUser).mockResolvedValue(USER_2)
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(
      makeAppointment({ userId: USER_1.id, status: "scheduled" }) as any
    )

    await expect(
      cancelAppointment({ appointmentId: APPT_UUID })
    ).rejects.toThrow("Consulta não encontrada")

    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.appointment.update).not.toHaveBeenCalled()
  })

  it("criar consulta com patientId de outro psicólogo → lança erro 'Paciente não encontrado ou inativo'", async () => {
    // USER_2 está autenticado mas o patientId pertence ao USER_1 — patient.findFirst retorna null
    vi.mocked(getCurrentUser).mockResolvedValue(USER_2)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    await expect(createAppointment(VALID_FORM_INPUT)).rejects.toThrow(
      "Paciente não encontrado ou inativo"
    )
    // Verifica que a busca usa userId do usuário autenticado (USER_2), não o do paciente
    expect(prisma.patient.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: USER_2.id,
          id: VALID_FORM_INPUT.patientId,
        }),
      })
    )
    expect(prisma.appointment.create).not.toHaveBeenCalled()
  })
})
