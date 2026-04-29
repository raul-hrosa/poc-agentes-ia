import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/features/auth/queries/getUserByEmail", () => ({
  getUserByEmail: vi.fn(),
}))
vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(),
    },
  },
}))
vi.mock("@/shared/lib/auth", () => ({
  signIn: vi.fn(),
}))
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}))

import { registerUser } from "../registerUser"
import { getUserByEmail } from "@/features/auth/queries/getUserByEmail"
import { prisma } from "@/shared/lib/prisma"
import { signIn } from "@/shared/lib/auth"

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validInput = {
    name: "Dr. João",
    email: "joao@example.com",
    password: "senha1234",
    confirmPassword: "senha1234",
  }

  it("cria usuário e retorna success quando dados são válidos", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({} as any)
    vi.mocked(signIn).mockResolvedValue(undefined as any)

    const result = await registerUser(validInput)

    expect(result).toEqual({ success: true })
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Dr. João",
        email: "joao@example.com",
        password: "hashed-password",
      },
    })
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "joao@example.com",
      password: "senha1234",
      redirect: false,
    })
  })

  it("retorna fieldErrors quando e-mail já está cadastrado", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "existing-id",
      email: "joao@example.com",
      name: "Existing",
      password: "hash",
    })

    const result = await registerUser(validInput)

    expect(result).toEqual({
      fieldErrors: {
        email: ["Este e-mail já está cadastrado. Tente fazer login."],
      },
    })
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("retorna fieldErrors quando senha é muito curta", async () => {
    const result = await registerUser({
      ...validInput,
      password: "123",
      confirmPassword: "123",
    })

    expect(result).toHaveProperty("fieldErrors")
    const r = result as { fieldErrors: Record<string, string[]> }
    expect(r.fieldErrors.password).toContain(
      "A senha deve ter pelo menos 8 caracteres"
    )
  })

  it("retorna fieldErrors quando senhas não conferem", async () => {
    const result = await registerUser({
      ...validInput,
      confirmPassword: "diferente",
    })

    expect(result).toHaveProperty("fieldErrors")
    const r = result as { fieldErrors: Record<string, string[]> }
    expect(r.fieldErrors.confirmPassword).toContain("As senhas não conferem")
  })

  it("retorna fieldErrors quando nome está vazio", async () => {
    const result = await registerUser({ ...validInput, name: "" })

    expect(result).toHaveProperty("fieldErrors")
    const r = result as { fieldErrors: Record<string, string[]> }
    expect(r.fieldErrors.name).toContain("Nome é obrigatório")
  })
})
