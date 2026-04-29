import { describe, it, expect, vi, beforeEach } from "vitest"
import { getUserByEmail } from "../getUserByEmail"

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/shared/lib/prisma"

describe("getUserByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna o usuário quando o e-mail existe", async () => {
    const mockUser = {
      id: "user-123",
      email: "joao@example.com",
      name: "Dr. João",
      password: "hashed-password",
    }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const result = await getUserByEmail("joao@example.com")

    expect(result).toEqual(mockUser)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "joao@example.com" },
      select: { id: true, email: true, name: true, password: true },
    })
  })

  it("retorna null quando o e-mail não existe", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await getUserByEmail("inexistente@example.com")

    expect(result).toBeNull()
  })
})
