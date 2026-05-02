import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
    },
    sessionNote: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/features/auth/queries/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}))

import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { createSessionNote } from "../createSessionNote"
import { updateSessionNote } from "../updateSessionNote"
import { deleteSessionNote } from "../deleteSessionNote"

const USER_ID = "a1b2c3d4-1234-4abc-8def-000000000001"
const APPOINTMENT_ID = "a1b2c3d4-1234-4abc-8def-000000000002"
const NOTE_ID = "a1b2c3d4-1234-4abc-8def-000000000003"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: USER_ID,
    name: "Dr. Teste",
    email: "teste@example.com",
  })
})

// ---------------------------------------------------------------------------
// createSessionNote
// ---------------------------------------------------------------------------
describe("createSessionNote", () => {
  it("retorna erro quando appointment.status !== completed (RN-01, CE-02)", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: APPOINTMENT_ID,
      status: "scheduled",
    } as never)

    const result = await createSessionNote({
      appointmentId: APPOINTMENT_ID,
      content: "Conteúdo da sessão",
    })

    expect(result).toEqual({
      error: "Prontuário só pode ser registrado para sessões realizadas",
    })
  })

  it("retorna success com noteId existente quando já existe nota (RN-02, AC-07, CE-03)", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: APPOINTMENT_ID,
      status: "completed",
    } as never)
    vi.mocked(prisma.sessionNote.findUnique).mockResolvedValue({
      id: NOTE_ID,
    } as never)

    const result = await createSessionNote({
      appointmentId: APPOINTMENT_ID,
      content: "Conteúdo",
    })

    expect(result).toEqual({ success: true, noteId: NOTE_ID })
    expect(prisma.sessionNote.create).not.toHaveBeenCalled()
  })

  it("lança erro quando appointment pertence a outro psicólogo (CE-01, AC-25)", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

    await expect(
      createSessionNote({
        appointmentId: APPOINTMENT_ID,
        content: "Conteúdo",
      })
    ).rejects.toThrow("Consulta não encontrada")
  })

  it("cria nota e retorna success com noteId quando válido", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: APPOINTMENT_ID,
      status: "completed",
    } as never)
    vi.mocked(prisma.sessionNote.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.sessionNote.create).mockResolvedValue({
      id: NOTE_ID,
    } as never)

    const result = await createSessionNote({
      appointmentId: APPOINTMENT_ID,
      content: "Conteúdo da sessão",
    })

    expect(result).toEqual({ success: true, noteId: NOTE_ID })
    expect(prisma.sessionNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: APPOINTMENT_ID,
          userId: USER_ID,
          content: "Conteúdo da sessão",
        }),
      })
    )
  })

  it("faz trim do conteúdo antes de salvar", async () => {
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: APPOINTMENT_ID,
      status: "completed",
    } as never)
    vi.mocked(prisma.sessionNote.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.sessionNote.create).mockResolvedValue({
      id: NOTE_ID,
    } as never)

    await createSessionNote({
      appointmentId: APPOINTMENT_ID,
      content: "  Conteúdo com espaços  ",
    })

    expect(prisma.sessionNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: "Conteúdo com espaços" }),
      })
    )
  })

  it("lança erro Zod quando content é apenas espaços em branco", async () => {
    await expect(
      createSessionNote({
        appointmentId: APPOINTMENT_ID,
        content: "   ",
      })
    ).rejects.toThrow()
  })

  it("lança erro Zod quando appointmentId não é UUID válido", async () => {
    await expect(
      createSessionNote({
        appointmentId: "id-invalido",
        content: "Conteúdo",
      })
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// updateSessionNote
// ---------------------------------------------------------------------------
describe("updateSessionNote", () => {
  it("lança erro quando nota não existe ou pertence a outro psicólogo (AC-24, CE-04)", async () => {
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue(null)

    await expect(
      updateSessionNote({
        noteId: NOTE_ID,
        content: "Novo conteúdo",
      })
    ).rejects.toThrow("Prontuário não encontrado")
  })

  it("atualiza nota e retorna success", async () => {
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue({
      id: NOTE_ID,
    } as never)
    vi.mocked(prisma.sessionNote.update).mockResolvedValue({
      id: NOTE_ID,
    } as never)

    const result = await updateSessionNote({
      noteId: NOTE_ID,
      content: "Novo conteúdo atualizado",
    })

    expect(result).toEqual({ success: true, noteId: NOTE_ID })
    expect(prisma.sessionNote.update).toHaveBeenCalledWith({
      where: { id: NOTE_ID },
      data: { content: "Novo conteúdo atualizado" },
    })
  })

  it("faz trim do conteúdo antes de atualizar", async () => {
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue({
      id: NOTE_ID,
    } as never)
    vi.mocked(prisma.sessionNote.update).mockResolvedValue({
      id: NOTE_ID,
    } as never)

    await updateSessionNote({
      noteId: NOTE_ID,
      content: "  Conteúdo  ",
    })

    expect(prisma.sessionNote.update).toHaveBeenCalledWith({
      where: { id: NOTE_ID },
      data: { content: "Conteúdo" },
    })
  })

  it("valida noteId como UUID", async () => {
    await expect(
      updateSessionNote({
        noteId: "id-invalido",
        content: "Conteúdo",
      })
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// deleteSessionNote
// ---------------------------------------------------------------------------
describe("deleteSessionNote", () => {
  it("lança erro quando nota não existe ou pertence a outro psicólogo (AC-24, CE-04)", async () => {
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue(null)

    await expect(
      deleteSessionNote({ noteId: NOTE_ID })
    ).rejects.toThrow("Prontuário não encontrado")
  })

  it("executa hard delete e retorna appointmentId para redirecionamento (AC-17, RN-04)", async () => {
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue({
      id: NOTE_ID,
      appointmentId: APPOINTMENT_ID,
    } as never)
    vi.mocked(prisma.sessionNote.delete).mockResolvedValue({} as never)

    const result = await deleteSessionNote({ noteId: NOTE_ID })

    expect(result).toEqual({ success: true, appointmentId: APPOINTMENT_ID })
    expect(prisma.sessionNote.delete).toHaveBeenCalledWith({
      where: { id: NOTE_ID },
    })
  })

  it("filtra por userId para evitar acesso não autorizado", async () => {
    vi.mocked(prisma.sessionNote.findFirst).mockResolvedValue({
      id: NOTE_ID,
      appointmentId: APPOINTMENT_ID,
    } as never)
    vi.mocked(prisma.sessionNote.delete).mockResolvedValue({} as never)

    await deleteSessionNote({ noteId: NOTE_ID })

    expect(prisma.sessionNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTE_ID, userId: USER_ID },
      })
    )
  })

  it("valida noteId como UUID", async () => {
    await expect(
      deleteSessionNote({ noteId: "id-invalido" })
    ).rejects.toThrow()
  })
})
