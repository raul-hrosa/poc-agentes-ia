import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/features/auth/queries/getUserByEmail", () => ({
  getUserByEmail: vi.fn(),
}))
vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    passwordResetToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))
vi.mock("@/shared/lib/resend", () => ({
  resend: {
    emails: { send: vi.fn().mockResolvedValue({ id: "email-id" }) },
  },
}))
vi.mock("node:crypto", () => ({
  randomBytes: vi.fn().mockReturnValue(Buffer.from("mock-token-hex")),
}))

import { forgotPassword } from "../forgotPassword"
import { getUserByEmail } from "@/features/auth/queries/getUserByEmail"
import { prisma } from "@/shared/lib/prisma"

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
    process.env.RESEND_FROM_EMAIL = "noreply@test.com"
  })

  it("retorna success para e-mail inexistente sem enviar e-mail", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null)

    const result = await forgotPassword({ email: "inexistente@example.com" })

    expect(result).toEqual({ success: true })
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled()
  })

  it("retorna success para e-mail existente e cria token", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-id",
      email: "joao@example.com",
      name: "Dr. João",
      password: "hash",
    })
    vi.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 0 } as never)
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({} as never)

    const result = await forgotPassword({ email: "joao@example.com" })

    expect(result).toEqual({ success: true })
    expect(prisma.passwordResetToken.create).toHaveBeenCalled()
  })

  it("retorna error para e-mail inválido", async () => {
    const result = await forgotPassword({ email: "nao-e-email" })
    expect(result).toEqual({ error: "E-mail inválido" })
  })

  it("retorna success mesmo quando envio de e-mail falha", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: "user-id",
      email: "joao@example.com",
      name: "Dr. João",
      password: "hash",
    })
    vi.mocked(prisma.passwordResetToken.updateMany).mockResolvedValue({ count: 0 } as never)
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({} as never)

    const result = await forgotPassword({ email: "joao@example.com" })

    expect(result).toEqual({ success: true })
  })
})
