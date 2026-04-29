import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    passwordResetToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))
vi.mock("@/shared/lib/auth", () => ({
  signIn: vi.fn(),
}))
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("new-hashed-password"),
  },
}))

import { resetPassword } from "../resetPassword"
import { prisma } from "@/shared/lib/prisma"
import { signIn } from "@/shared/lib/auth"

const futureDate = new Date(Date.now() + 60 * 60 * 1000)
const pastDate = new Date(Date.now() - 60 * 60 * 1000)

const validToken = {
  id: "token-id",
  createdAt: new Date(),
  email: "joao@example.com",
  token: "valid-token",
  expiresAt: futureDate,
  usedAt: null,
}

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(async (ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops.map((op: unknown) => op))
      }
      return (ops as () => Promise<unknown>)()
    })
  })

  it("redefine a senha com sucesso para token válido", async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(validToken)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    vi.mocked(prisma.passwordResetToken.update).mockResolvedValue({} as never)
    vi.mocked(signIn).mockResolvedValue(undefined as never)

    const result = await resetPassword({
      token: "valid-token",
      password: "novaSenha123",
      confirmPassword: "novaSenha123",
    })

    expect(result).toEqual({ success: true })
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "joao@example.com",
      password: "novaSenha123",
      redirect: false,
    })
  })

  it("retorna error para token inexistente", async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null)

    const result = await resetPassword({
      token: "fake-token",
      password: "novaSenha123",
      confirmPassword: "novaSenha123",
    })

    expect(result).toEqual({ error: "Token inválido" })
  })

  it("retorna error para token expirado", async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      ...validToken,
      expiresAt: pastDate,
    })

    const result = await resetPassword({
      token: "expired-token",
      password: "novaSenha123",
      confirmPassword: "novaSenha123",
    })

    expect(result).toEqual({ error: "Token expirado" })
  })

  it("retorna error para token já utilizado", async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      ...validToken,
      usedAt: new Date(),
    })

    const result = await resetPassword({
      token: "used-token",
      password: "novaSenha123",
      confirmPassword: "novaSenha123",
    })

    expect(result).toEqual({ error: "Token já utilizado" })
  })

  it("retorna fieldErrors para senha muito curta", async () => {
    const result = await resetPassword({
      token: "some-token",
      password: "123",
      confirmPassword: "123",
    })

    expect(result).toHaveProperty("fieldErrors")
    const r = result as { fieldErrors: Record<string, string[]> }
    expect(r.fieldErrors.password).toContain(
      "A senha deve ter pelo menos 8 caracteres"
    )
  })
})
