import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    patient: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { prisma } from "@/shared/lib/prisma"
import { getActivePatients } from "../getActivePatients"
import { getArchivedPatients } from "../getArchivedPatients"
import { getPatientById } from "../getPatientById"
import { countActivePatients } from "../countActivePatients"

const USER_A = "user-a"
const USER_B = "user-b"

const activePatient = {
  id: "patient-1",
  name: "Ana Lima",
  phone: "11999990001",
  isActive: true,
}

const archivedPatient = {
  id: "patient-2",
  name: "Bruno Souza",
  phone: "11999990002",
  isActive: false,
}

const fullProfile = {
  id: "patient-1",
  name: "Ana Lima",
  phone: "11999990001",
  birthDate: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  notes: null,
  isActive: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getActivePatients
// ---------------------------------------------------------------------------
describe("getActivePatients", () => {
  it("retorna lista vazia quando não há pacientes ativos", async () => {
    vi.mocked(prisma.patient.findMany).mockResolvedValue([])

    const result = await getActivePatients(USER_A)

    expect(result).toEqual([])
    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: { userId: USER_A, isActive: true, deletedAt: null },
      select: { id: true, name: true, phone: true, isActive: true },
      orderBy: { name: "asc" },
    })
  })

  it("retorna lista com pacientes ativos do userId informado", async () => {
    vi.mocked(prisma.patient.findMany).mockResolvedValue([activePatient] as any)

    const result = await getActivePatients(USER_A)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(activePatient)
  })

  it("filtra por userId — não retorna pacientes de outro usuário", async () => {
    vi.mocked(prisma.patient.findMany).mockResolvedValue([])

    await getActivePatients(USER_B)

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: USER_B }) })
    )
  })
})

// ---------------------------------------------------------------------------
// getArchivedPatients
// ---------------------------------------------------------------------------
describe("getArchivedPatients", () => {
  it("retorna lista vazia quando não há pacientes arquivados", async () => {
    vi.mocked(prisma.patient.findMany).mockResolvedValue([])

    const result = await getArchivedPatients(USER_A)

    expect(result).toEqual([])
    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: { userId: USER_A, isActive: false, deletedAt: null },
      select: { id: true, name: true, phone: true, isActive: true },
      orderBy: { name: "asc" },
    })
  })

  it("retorna lista com pacientes arquivados do userId informado", async () => {
    vi.mocked(prisma.patient.findMany).mockResolvedValue([archivedPatient] as any)

    const result = await getArchivedPatients(USER_A)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(archivedPatient)
  })

  it("filtra por userId — não retorna arquivados de outro usuário", async () => {
    vi.mocked(prisma.patient.findMany).mockResolvedValue([])

    await getArchivedPatients(USER_B)

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: USER_B }) })
    )
  })

  it("busca apenas pacientes com isActive = false", async () => {
    vi.mocked(prisma.patient.findMany).mockResolvedValue([])

    await getArchivedPatients(USER_A)

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: false }) })
    )
  })
})

// ---------------------------------------------------------------------------
// getPatientById
// ---------------------------------------------------------------------------
describe("getPatientById", () => {
  it("retorna o perfil quando paciente existe e pertence ao userId", async () => {
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(fullProfile as any)

    const result = await getPatientById(USER_A, "patient-1")

    expect(result).toEqual(fullProfile)
    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: { id: "patient-1", userId: USER_A, deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        birthDate: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  })

  it("retorna null quando paciente não existe", async () => {
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    const result = await getPatientById(USER_A, "patient-inexistente")

    expect(result).toBeNull()
  })

  it("retorna null quando patientId pertence a outro userId (isolamento)", async () => {
    // Prisma retorna null porque o where inclui userId — o registro não bate
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    const result = await getPatientById(USER_B, "patient-1")

    expect(result).toBeNull()
    expect(prisma.patient.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: USER_B }) })
    )
  })

  it("retorna null quando paciente tem deletedAt preenchido (filtra por deletedAt: null)", async () => {
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    const result = await getPatientById(USER_A, "patient-deleted")

    expect(result).toBeNull()
    expect(prisma.patient.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) })
    )
  })
})

// ---------------------------------------------------------------------------
// countActivePatients
// ---------------------------------------------------------------------------
describe("countActivePatients", () => {
  it("retorna 0 quando psicólogo não tem pacientes ativos", async () => {
    vi.mocked(prisma.patient.count).mockResolvedValue(0)

    const result = await countActivePatients(USER_A)

    expect(result).toBe(0)
    expect(prisma.patient.count).toHaveBeenCalledWith({
      where: { userId: USER_A, isActive: true, deletedAt: null },
    })
  })

  it("retorna a contagem correta de pacientes ativos", async () => {
    vi.mocked(prisma.patient.count).mockResolvedValue(7)

    const result = await countActivePatients(USER_A)

    expect(result).toBe(7)
  })

  it("filtra por userId — contabiliza apenas pacientes do usuário informado", async () => {
    vi.mocked(prisma.patient.count).mockResolvedValue(3)

    await countActivePatients(USER_B)

    expect(prisma.patient.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: USER_B }) })
    )
  })
})
