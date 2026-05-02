import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    sessionNote: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/shared/lib/prisma"
import { getSessionNoteByAppointment } from "../getSessionNoteByAppointment"
import { getSessionNoteById } from "../getSessionNoteById"
import { getPatientSessionNotes } from "../getPatientSessionNotes"

const USER_A = "a1b2c3d4-1234-4abc-8def-000000000001"
const USER_B = "a1b2c3d4-1234-4abc-8def-000000000002"
const APPOINTMENT_ID = "a1b2c3d4-1234-4abc-8def-000000000003"
const NOTE_ID = "a1b2c3d4-1234-4abc-8def-000000000004"
const PATIENT_ID = "a1b2c3d4-1234-4abc-8def-000000000005"

function makeNoteWithContext(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: NOTE_ID,
    content: "Conteúdo da sessão",
    createdAt: new Date("2026-05-01T09:00:00.000Z"),
    updatedAt: new Date("2026-05-01T09:00:00.000Z"),
    appointmentId: APPOINTMENT_ID,
    userId: USER_A,
    appointment: {
      scheduledAt: new Date("2026-05-01T09:00:00.000Z"),
      durationMinutes: 50,
      modality: "in_person",
      patient: { id: PATIENT_ID, name: "Ana Lima" },
    },
    ...overrides,
  }
}

function makeNoteListItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: NOTE_ID,
    content: "Conteúdo da sessão",
    createdAt: new Date("2026-05-01T09:00:00.000Z"),
    appointment: { scheduledAt: new Date("2026-05-01T09:00:00.000Z") },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getSessionNoteByAppointment
// ---------------------------------------------------------------------------
describe("getSessionNoteByAppointment", () => {
  it("retorna nota quando existe para o appointmentId e userId corretos", async () => {
    const note = makeNoteWithContext()
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue(note as never)

    const result = await getSessionNoteByAppointment(USER_A, APPOINTMENT_ID)

    expect(result).toEqual(note)
    expect(prisma.sessionNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { appointmentId: APPOINTMENT_ID, userId: USER_A },
      })
    )
  })

  it("retorna null quando nota não existe para o appointmentId", async () => {
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue(null)

    const result = await getSessionNoteByAppointment(USER_A, APPOINTMENT_ID)

    expect(result).toBeNull()
  })

  it("retorna null quando userId é diferente (isolamento de dados)", async () => {
    // Prisma retorna null porque o where inclui userId do USER_B
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue(null)

    const result = await getSessionNoteByAppointment(USER_B, APPOINTMENT_ID)

    expect(result).toBeNull()
    expect(prisma.sessionNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { appointmentId: APPOINTMENT_ID, userId: USER_B },
      })
    )
  })
})

// ---------------------------------------------------------------------------
// getSessionNoteById
// ---------------------------------------------------------------------------
describe("getSessionNoteById", () => {
  it("retorna nota quando existe para o noteId e userId corretos", async () => {
    const note = makeNoteWithContext()
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue(note as never)

    const result = await getSessionNoteById(USER_A, NOTE_ID)

    expect(result).toEqual(note)
    expect(prisma.sessionNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTE_ID, userId: USER_A },
      })
    )
  })

  it("retorna null quando nota não existe para o noteId", async () => {
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue(null)

    const result = await getSessionNoteById(USER_A, "id-inexistente")

    expect(result).toBeNull()
  })

  it("retorna null quando nota pertence a outro psicólogo (AC-24)", async () => {
    // Prisma retorna null porque o where filtra por userId = USER_B
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue(null)

    const result = await getSessionNoteById(USER_B, NOTE_ID)

    expect(result).toBeNull()
    expect(prisma.sessionNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTE_ID, userId: USER_B },
      })
    )
  })
})

// ---------------------------------------------------------------------------
// getPatientSessionNotes
// ---------------------------------------------------------------------------
describe("getPatientSessionNotes", () => {
  it("retorna lista de notas para o paciente correto", async () => {
    const notes = [
      makeNoteListItem({ id: "note-1" }),
      makeNoteListItem({ id: "note-2" }),
    ]
    vi.mocked(prisma.sessionNote.findMany).mockResolvedValue(notes as never)

    const result = await getPatientSessionNotes(USER_A, PATIENT_ID)

    expect(result).toHaveLength(2)
    expect(prisma.sessionNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_A, appointment: { patientId: PATIENT_ID } },
      })
    )
  })

  it("retorna lista vazia quando paciente não tem notas", async () => {
    vi.mocked(prisma.sessionNote.findMany).mockResolvedValue([])

    const result = await getPatientSessionNotes(USER_A, PATIENT_ID)

    expect(result).toEqual([])
  })

  it("não retorna notas de pacientes de outro psicólogo (filtro userId)", async () => {
    // Prisma retorna vazio porque where inclui userId do USER_B
    vi.mocked(prisma.sessionNote.findMany).mockResolvedValue([])

    const result = await getPatientSessionNotes(USER_B, PATIENT_ID)

    expect(result).toEqual([])
    expect(prisma.sessionNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_B, appointment: { patientId: PATIENT_ID } },
      })
    )
  })

  it("ordena notas por scheduledAt descendente", async () => {
    vi.mocked(prisma.sessionNote.findMany).mockResolvedValue([])

    await getPatientSessionNotes(USER_A, PATIENT_ID)

    expect(prisma.sessionNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { appointment: { scheduledAt: "desc" } },
      })
    )
  })
})
