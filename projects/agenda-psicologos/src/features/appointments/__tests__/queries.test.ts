import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    appointment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from "@/shared/lib/prisma"
import { getConflictingAppointments } from "../queries/getConflictingAppointments"
import { getAppointmentById } from "../queries/getAppointmentById"

const USER_A = "user-a"
const USER_B = "user-b"

function makeAppointment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "appt-1",
    userId: USER_A,
    patientId: "patient-1",
    scheduledAt: new Date("2026-05-01T09:00:00.000Z"),
    durationMinutes: 50,
    modality: "in_person",
    location: null,
    status: "scheduled",
    cancellationReason: null,
    createdAt: new Date("2026-05-01T08:00:00.000Z"),
    updatedAt: new Date("2026-05-01T08:00:00.000Z"),
    patient: { id: "patient-1", name: "Ana Lima", phone: "11999990001" },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getConflictingAppointments
// ---------------------------------------------------------------------------
describe("getConflictingAppointments", () => {
  it("retorna conflito quando existe sobreposição de horário", async () => {
    // consulta existente: 09:00–09:50
    const existing = makeAppointment({
      scheduledAt: new Date("2026-05-01T09:00:00.000Z"),
      durationMinutes: 50,
    })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([existing] as any)

    // nova consulta: 09:30–10:20 — sobrepõe
    const result = await getConflictingAppointments(
      USER_A,
      new Date("2026-05-01T09:30:00.000Z"),
      50
    )

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("appt-1")
  })

  it("retorna vazio quando não há sobreposição de horário", async () => {
    // consulta existente: 09:00–09:50
    const existing = makeAppointment({
      scheduledAt: new Date("2026-05-01T09:00:00.000Z"),
      durationMinutes: 50,
    })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([existing] as any)

    // nova consulta: 10:00–10:50 — sem sobreposição
    const result = await getConflictingAppointments(
      USER_A,
      new Date("2026-05-01T10:00:00.000Z"),
      50
    )

    expect(result).toHaveLength(0)
  })

  it("exclui a própria consulta quando excludeId é fornecido", async () => {
    // consulta existente com id "appt-1": 09:00–09:50
    const existing = makeAppointment({
      id: "appt-1",
      scheduledAt: new Date("2026-05-01T09:00:00.000Z"),
      durationMinutes: 50,
    })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([existing] as any)

    // editando a mesma consulta no mesmo horário — não deve conflitar consigo mesma
    const result = await getConflictingAppointments(
      USER_A,
      new Date("2026-05-01T09:00:00.000Z"),
      50,
      "appt-1"
    )

    expect(result).toHaveLength(0)
  })

  it("ignora consultas com status cancelled na verificação de conflito", async () => {
    // consulta cancelada: 09:00–09:50
    const cancelled = makeAppointment({
      status: "cancelled",
      scheduledAt: new Date("2026-05-01T09:00:00.000Z"),
      durationMinutes: 50,
    })
    // Prisma já filtra status != cancelled no where — mock retorna vazio
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([])

    const result = await getConflictingAppointments(
      USER_A,
      new Date("2026-05-01T09:00:00.000Z"),
      50
    )

    expect(result).toHaveLength(0)
    // Verifica que a query Prisma inclui filtro de status
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: "cancelled" },
        }),
      })
    )

    // Suprime warning de variável não utilizada — cancelled foi usado para documentar o cenário
    void cancelled
  })

  it("verifica que o where inclui userId para isolamento", async () => {
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([])

    await getConflictingAppointments(
      USER_A,
      new Date("2026-05-01T09:00:00.000Z"),
      50
    )

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_A }),
      })
    )
  })
})

// ---------------------------------------------------------------------------
// getAppointmentById
// ---------------------------------------------------------------------------
describe("getAppointmentById", () => {
  it("retorna consulta com hasNote = true quando sessionNote existe", async () => {
    const row = {
      ...makeAppointment(),
      sessionNote: { id: "note-1" },
    }
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(row as any)

    const result = await getAppointmentById(USER_A, "appt-1")

    expect(result).not.toBeNull()
    expect(result?.hasNote).toBe(true)
    expect(result).not.toHaveProperty("sessionNote")
  })

  it("retorna consulta com hasNote = false quando sessionNote é null", async () => {
    const row = {
      ...makeAppointment(),
      sessionNote: null,
    }
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(row as any)

    const result = await getAppointmentById(USER_A, "appt-1")

    expect(result).not.toBeNull()
    expect(result?.hasNote).toBe(false)
  })

  it("retorna null quando consulta não existe", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

    const result = await getAppointmentById(USER_A, "appt-inexistente")

    expect(result).toBeNull()
  })

  it("retorna null quando appointmentId pertence a outro userId (isolamento — AC-35)", async () => {
    // Prisma retorna null porque where inclui userId — registro não bate
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

    const result = await getAppointmentById(USER_B, "appt-1")

    expect(result).toBeNull()
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_B }),
      })
    )
  })

  it("verifica que a query inclui userId e appointmentId no where", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

    await getAppointmentById(USER_A, "appt-1")

    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "appt-1", userId: USER_A },
      })
    )
  })
})
