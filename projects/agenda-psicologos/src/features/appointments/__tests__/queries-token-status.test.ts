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
import { getAppointmentsForWeek } from "../queries/getAppointmentsForWeek"
import { getAppointmentById } from "../queries/getAppointmentById"

const USER_A = "user-a"
const USER_B = "user-b"

const WEEK_START = new Date("2026-05-04T00:00:00.000Z")
const WEEK_END = new Date("2026-05-10T23:59:59.999Z")

function makeAppointmentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "appt-1",
    userId: USER_A,
    patientId: "patient-1",
    scheduledAt: new Date("2026-05-05T09:00:00.000Z"),
    durationMinutes: 50,
    modality: "in_person",
    location: null,
    status: "scheduled",
    cancellationReason: null,
    createdAt: new Date("2026-05-01T08:00:00.000Z"),
    updatedAt: new Date("2026-05-01T08:00:00.000Z"),
    patient: { id: "patient-1", name: "Ana Lima" },
    appointmentTokens: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// computeCancellationOrigin — via getAppointmentsForWeek (comportamento da lógica)
// ---------------------------------------------------------------------------
describe("getAppointmentsForWeek — cancellationOrigin", () => {
  it("retorna cancellationOrigin = null para consulta com status scheduled sem tokens", async () => {
    const row = makeAppointmentRow({ status: "scheduled", appointmentTokens: [] })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([row] as any)

    const result = await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(result).toHaveLength(1)
    expect(result[0].cancellationOrigin).toBeNull()
    expect(result[0].latestToken).toBeNull()
  })

  it("retorna cancellationOrigin = null para consulta confirmada (token action=confirmed, usedAt preenchido)", async () => {
    const row = makeAppointmentRow({
      status: "confirmed",
      appointmentTokens: [
        {
          action: "confirmed",
          usedAt: new Date("2026-05-04T10:00:00.000Z"),
          expiresAt: new Date("2026-05-07T00:00:00.000Z"),
        },
      ],
    })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([row] as any)

    const result = await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(result[0].cancellationOrigin).toBeNull()
    expect(result[0].latestToken?.action).toBe("confirmed")
    expect(result[0].latestToken?.usedAt).toBeInstanceOf(Date)
  })

  it("retorna cancellationOrigin = 'patient' quando status=cancelled e token action=cancelled com usedAt preenchido", async () => {
    const row = makeAppointmentRow({
      status: "cancelled",
      appointmentTokens: [
        {
          action: "cancelled",
          usedAt: new Date("2026-05-04T11:00:00.000Z"),
          expiresAt: new Date("2026-05-07T00:00:00.000Z"),
        },
      ],
    })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([row] as any)

    const result = await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(result[0].cancellationOrigin).toBe("patient")
    expect(result[0].latestToken?.action).toBe("cancelled")
  })

  it("retorna cancellationOrigin = 'psychologist' quando status=cancelled e sem token action=cancelled", async () => {
    const row = makeAppointmentRow({
      status: "cancelled",
      appointmentTokens: [],
    })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([row] as any)

    const result = await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(result[0].cancellationOrigin).toBe("psychologist")
    expect(result[0].latestToken).toBeNull()
  })

  it("retorna cancellationOrigin = 'psychologist' quando status=cancelled e token action=confirmed (não cancelou pelo paciente)", async () => {
    const row = makeAppointmentRow({
      status: "cancelled",
      appointmentTokens: [
        {
          action: "confirmed",
          usedAt: new Date("2026-05-04T10:00:00.000Z"),
          expiresAt: new Date("2026-05-07T00:00:00.000Z"),
        },
      ],
    })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([row] as any)

    const result = await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(result[0].cancellationOrigin).toBe("psychologist")
  })

  it("retorna array vazio quando semana não tem consultas", async () => {
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([])

    const result = await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(result).toHaveLength(0)
  })

  it("verifica que a query inclui userId no where (isolamento)", async () => {
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([])

    await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_A }),
      })
    )
  })

  it("verifica que a query usa include em appointmentTokens (sem N+1)", async () => {
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([])

    await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          appointmentTokens: expect.objectContaining({ take: 1 }),
        }),
      })
    )
  })

  it("mapeia patientName a partir de patient.name", async () => {
    const row = makeAppointmentRow({
      patient: { id: "patient-1", name: "Carlos Souza" },
    })
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([row] as any)

    const result = await getAppointmentsForWeek(USER_A, WEEK_START, WEEK_END)

    expect(result[0].patientName).toBe("Carlos Souza")
  })
})

// ---------------------------------------------------------------------------
// getAppointmentById — com latestToken e cancellationOrigin
// ---------------------------------------------------------------------------
describe("getAppointmentById — com token e cancellationOrigin", () => {
  function makeByIdRow(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: "appt-1",
      userId: USER_A,
      patientId: "patient-1",
      scheduledAt: new Date("2026-05-05T09:00:00.000Z"),
      durationMinutes: 50,
      modality: "in_person",
      location: null,
      status: "scheduled",
      cancellationReason: null,
      createdAt: new Date("2026-05-01T08:00:00.000Z"),
      updatedAt: new Date("2026-05-01T08:00:00.000Z"),
      patient: { id: "patient-1", name: "Ana Lima", phone: "11999990001" },
      sessionNote: null,
      appointmentTokens: [],
      ...overrides,
    }
  }

  it("retorna latestToken = null e cancellationOrigin = null quando não há tokens", async () => {
    const row = makeByIdRow({ appointmentTokens: [] })
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(row as any)

    const result = await getAppointmentById(USER_A, "appt-1")

    expect(result).not.toBeNull()
    expect(result?.latestToken).toBeNull()
    expect(result?.cancellationOrigin).toBeNull()
  })

  it("retorna latestToken com dados do token mais recente quando há token", async () => {
    const tokenData = {
      action: "confirmed",
      usedAt: new Date("2026-05-04T10:00:00.000Z"),
      expiresAt: new Date("2026-05-07T00:00:00.000Z"),
    }
    const row = makeByIdRow({
      status: "confirmed",
      appointmentTokens: [tokenData],
    })
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(row as any)

    const result = await getAppointmentById(USER_A, "appt-1")

    expect(result?.latestToken?.action).toBe("confirmed")
    expect(result?.latestToken?.usedAt).toEqual(tokenData.usedAt)
    expect(result?.latestToken?.expiresAt).toEqual(tokenData.expiresAt)
    expect(result?.cancellationOrigin).toBeNull()
  })

  it("retorna cancellationOrigin = 'patient' quando cancelada pelo paciente", async () => {
    const row = makeByIdRow({
      status: "cancelled",
      appointmentTokens: [
        {
          action: "cancelled",
          usedAt: new Date("2026-05-04T11:00:00.000Z"),
          expiresAt: new Date("2026-05-07T00:00:00.000Z"),
        },
      ],
    })
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(row as any)

    const result = await getAppointmentById(USER_A, "appt-1")

    expect(result?.cancellationOrigin).toBe("patient")
  })

  it("retorna cancellationOrigin = 'psychologist' quando cancelada pelo psicólogo (sem token cancelled)", async () => {
    const row = makeByIdRow({
      status: "cancelled",
      appointmentTokens: [],
    })
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(row as any)

    const result = await getAppointmentById(USER_A, "appt-1")

    expect(result?.cancellationOrigin).toBe("psychologist")
  })

  it("retorna null quando consulta pertence a outro userId (isolamento)", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

    const result = await getAppointmentById(USER_B, "appt-1")

    expect(result).toBeNull()
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_B }),
      })
    )
  })

  it("verifica que a query inclui appointmentTokens no select", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

    await getAppointmentById(USER_A, "appt-1")

    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          appointmentTokens: expect.objectContaining({ take: 1 }),
        }),
      })
    )
  })
})
