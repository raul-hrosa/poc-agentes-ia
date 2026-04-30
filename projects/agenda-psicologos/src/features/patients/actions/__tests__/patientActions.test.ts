import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/features/auth/queries/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    patient: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("@/features/patients/queries/countActivePatients", () => ({
  countActivePatients: vi.fn(),
}))

import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { countActivePatients } from "@/features/patients/queries/countActivePatients"
import {
  createPatient,
  updatePatient,
  archivePatient,
  restorePatient,
} from "../patientActions"

const mockUser = { id: "user-1", name: "Dr. Ana", email: "ana@example.com" }

const validInput = {
  name: "João Silva",
  phone: "11999990001",
  birthDate: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  notes: null,
}

const validInputFull = {
  name: "Maria Oliveira",
  phone: "11988880002",
  birthDate: new Date("1990-05-15"),
  emergencyContactName: "Carlos Oliveira",
  emergencyContactPhone: "11977770003",
  notes: "Paciente com histórico de ansiedade",
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// createPatient
// ---------------------------------------------------------------------------
describe("createPatient", () => {
  it("lança erro quando getCurrentUser lança (não autenticado)", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(createPatient(validInput)).rejects.toThrow("Não autenticado")
  })

  it("cria paciente com sucesso para plano pro (sem limite)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "pro" } as any)
    vi.mocked(prisma.patient.create).mockResolvedValue({
      id: "patient-new",
    } as any)

    const result = await createPatient(validInput)

    expect(result).toEqual({ success: true, patientId: "patient-new" })
    expect(countActivePatients).not.toHaveBeenCalled()
  })

  it("cria paciente com todos os campos preenchidos para plano free abaixo do limite", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)
    vi.mocked(countActivePatients).mockResolvedValue(5)
    vi.mocked(prisma.patient.create).mockResolvedValue({
      id: "patient-full",
    } as any)

    const result = await createPatient(validInputFull)

    expect(result).toEqual({ success: true, patientId: "patient-full" })
    expect(prisma.patient.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        name: "Maria Oliveira",
        phone: "11988880002",
        birthDate: new Date("1990-05-15"),
        emergencyContactName: "Carlos Oliveira",
        emergencyContactPhone: "11977770003",
        notes: "Paciente com histórico de ansiedade",
        isActive: true,
      },
    })
  })

  it("retorna erro de limite quando plano free com 10 pacientes ativos", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)
    vi.mocked(countActivePatients).mockResolvedValue(10)

    const result = await createPatient(validInput)

    expect(result).toEqual({
      error:
        "Você atingiu o limite de 10 pacientes no plano grátis. Arquive um paciente ou faça upgrade para o plano Pro.",
    })
    expect(prisma.patient.create).not.toHaveBeenCalled()
  })

  it("não aplica limite para plano pro com 10+ pacientes ativos", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "pro" } as any)
    vi.mocked(prisma.patient.create).mockResolvedValue({
      id: "patient-pro",
    } as any)

    const result = await createPatient(validInput)

    expect(result).toEqual({ success: true, patientId: "patient-pro" })
    expect(countActivePatients).not.toHaveBeenCalled()
  })

  it("lança ZodError quando name está vazio", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)

    await expect(
      createPatient({ ...validInput, name: "" })
    ).rejects.toThrow()
  })

  it("lança ZodError quando phone tem formato inválido (9 dígitos)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)

    await expect(
      createPatient({ ...validInput, phone: "119999900" })
    ).rejects.toThrow()
  })

  it("lança ZodError quando birthDate é uma data futura", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)

    await expect(
      createPatient({ ...validInput, birthDate: new Date("2099-01-01") })
    ).rejects.toThrow()
  })

  it("lança ZodError quando emergencyContactName preenchido sem emergencyContactPhone", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)

    await expect(
      createPatient({
        ...validInput,
        emergencyContactName: "Carlos",
        emergencyContactPhone: null,
      })
    ).rejects.toThrow()
  })

  it("lança ZodError quando emergencyContactPhone preenchido sem emergencyContactName", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)

    await expect(
      createPatient({
        ...validInput,
        emergencyContactName: null,
        emergencyContactPhone: "11999990001",
      })
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// updatePatient
// ---------------------------------------------------------------------------
describe("updatePatient", () => {
  it("lança erro quando getCurrentUser lança (não autenticado)", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(updatePatient("patient-1", validInput)).rejects.toThrow(
      "Não autenticado"
    )
  })

  it("atualiza paciente com sucesso quando dados são válidos", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue({
      id: "patient-1",
    } as any)
    vi.mocked(prisma.patient.update).mockResolvedValue({} as any)

    const result = await updatePatient("patient-1", validInput)

    expect(result).toEqual({ success: true, patientId: "patient-1" })
    expect(prisma.patient.update).toHaveBeenCalledWith({
      where: { id: "patient-1" },
      data: {
        name: validInput.name,
        phone: validInput.phone,
        birthDate: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        notes: null,
      },
    })
  })

  it("retorna erro quando patientId pertence a outro userId", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    const result = await updatePatient("patient-de-outro", validInput)

    expect(result).toEqual({ error: "Paciente não encontrado" })
    expect(prisma.patient.update).not.toHaveBeenCalled()
  })

  it("retorna erro quando patientId não existe", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    const result = await updatePatient("patient-inexistente", validInput)

    expect(result).toEqual({ error: "Paciente não encontrado" })
  })

  it("busca paciente filtrando por userId do usuário autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    await updatePatient("patient-1", validInput)

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: { id: "patient-1", userId: mockUser.id, deletedAt: null },
    })
  })

  it("lança ZodError quando name está vazio", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

    await expect(
      updatePatient("patient-1", { ...validInput, name: "" })
    ).rejects.toThrow()
  })

  it("lança ZodError quando phone tem formato inválido", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

    await expect(
      updatePatient("patient-1", { ...validInput, phone: "123" })
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// archivePatient
// ---------------------------------------------------------------------------
describe("archivePatient", () => {
  it("lança erro quando getCurrentUser lança (não autenticado)", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(archivePatient("patient-1")).rejects.toThrow("Não autenticado")
  })

  it("arquiva paciente com sucesso — define isActive como false", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue({
      id: "patient-1",
    } as any)
    vi.mocked(prisma.patient.update).mockResolvedValue({} as any)

    const result = await archivePatient("patient-1")

    expect(result).toEqual({ success: true })
    expect(prisma.patient.update).toHaveBeenCalledWith({
      where: { id: "patient-1" },
      data: { isActive: false },
    })
  })

  it("não altera deletedAt ao arquivar", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue({
      id: "patient-1",
    } as any)
    vi.mocked(prisma.patient.update).mockResolvedValue({} as any)

    await archivePatient("patient-1")

    const updateCall = vi.mocked(prisma.patient.update).mock.calls[0][0]
    expect(updateCall.data).not.toHaveProperty("deletedAt")
  })

  it("retorna erro quando patientId não encontrado para o userId", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    const result = await archivePatient("patient-inexistente")

    expect(result).toEqual({ error: "Paciente não encontrado" })
    expect(prisma.patient.update).not.toHaveBeenCalled()
  })

  it("busca paciente filtrando por userId do usuário autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    await archivePatient("patient-1")

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: { id: "patient-1", userId: mockUser.id, deletedAt: null },
    })
  })
})

// ---------------------------------------------------------------------------
// restorePatient
// ---------------------------------------------------------------------------
describe("restorePatient", () => {
  it("lança erro quando getCurrentUser lança (não autenticado)", async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Não autenticado"))

    await expect(restorePatient("patient-1")).rejects.toThrow("Não autenticado")
  })

  it("restaura paciente com sucesso quando plano free abaixo do limite", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue({
      id: "patient-1",
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)
    vi.mocked(countActivePatients).mockResolvedValue(5)
    vi.mocked(prisma.patient.update).mockResolvedValue({} as any)

    const result = await restorePatient("patient-1")

    expect(result).toEqual({ success: true })
    expect(prisma.patient.update).toHaveBeenCalledWith({
      where: { id: "patient-1" },
      data: { isActive: true },
    })
  })

  it("retorna erro de limite quando plano free com 10 pacientes ativos", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue({
      id: "patient-1",
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free" } as any)
    vi.mocked(countActivePatients).mockResolvedValue(10)

    const result = await restorePatient("patient-1")

    expect(result).toEqual({
      error:
        "Limite de pacientes atingido. Arquive outro paciente ou faça upgrade para o plano Pro.",
    })
    expect(prisma.patient.update).not.toHaveBeenCalled()
  })

  it("restaura paciente para plano pro independente da contagem", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue({
      id: "patient-1",
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "pro" } as any)
    vi.mocked(prisma.patient.update).mockResolvedValue({} as any)

    const result = await restorePatient("patient-1")

    expect(result).toEqual({ success: true })
    expect(countActivePatients).not.toHaveBeenCalled()
  })

  it("retorna erro quando patientId não encontrado para o userId", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    const result = await restorePatient("patient-inexistente")

    expect(result).toEqual({ error: "Paciente não encontrado" })
    expect(prisma.patient.update).not.toHaveBeenCalled()
  })

  it("busca paciente filtrando por userId do usuário autenticado", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

    await restorePatient("patient-1")

    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: { id: "patient-1", userId: mockUser.id, deletedAt: null },
    })
  })
})
