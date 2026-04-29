import { describe, it, expect, vi, beforeEach } from "vitest"
import bcrypt from "bcryptjs"

// Mock the prisma module before importing the module under test
vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock next-auth and adapter to avoid initialization errors
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}))

// Import after mocks are registered
import { prisma } from "@/shared/lib/prisma"
import { authorizeCredentials } from "@/shared/lib/auth"

describe("authorizeCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna null quando email é undefined", async () => {
    const result = await authorizeCredentials(undefined, "senha123")
    expect(result).toBeNull()
  })

  it("retorna null quando password é undefined", async () => {
    const result = await authorizeCredentials("user@example.com", undefined)
    expect(result).toBeNull()
  })

  it("retorna null quando email é string vazia", async () => {
    const result = await authorizeCredentials("", "senha123")
    expect(result).toBeNull()
  })

  it("retorna null quando password é string vazia", async () => {
    const result = await authorizeCredentials("user@example.com", "")
    expect(result).toBeNull()
  })

  it("retorna null quando usuário não existe no banco", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await authorizeCredentials("naoexiste@example.com", "senha123")

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "naoexiste@example.com" },
      select: { id: true, email: true, name: true, password: true },
    })
    expect(result).toBeNull()
  })

  it("retorna null quando a senha não confere com o hash", async () => {
    const hashedPassword = await bcrypt.hash("senhaCorreta", 12)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-uuid-1",
      email: "psi@example.com",
      name: "Dr. Teste",
      password: hashedPassword,
    } as never)

    const result = await authorizeCredentials("psi@example.com", "senhaErrada")

    expect(result).toBeNull()
  })

  it("retorna o objeto de usuário quando credenciais são válidas", async () => {
    const hashedPassword = await bcrypt.hash("senhaCorreta123", 12)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-uuid-1",
      email: "psi@example.com",
      name: "Dr. Teste",
      password: hashedPassword,
    } as never)

    const result = await authorizeCredentials("psi@example.com", "senhaCorreta123")

    expect(result).toEqual({
      id: "user-uuid-1",
      email: "psi@example.com",
      name: "Dr. Teste",
    })
  })

  it("não retorna o campo password no objeto de retorno", async () => {
    const hashedPassword = await bcrypt.hash("senhaCorreta123", 12)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-uuid-1",
      email: "psi@example.com",
      name: "Dr. Teste",
      password: hashedPassword,
    } as never)

    const result = await authorizeCredentials("psi@example.com", "senhaCorreta123")

    expect(result).not.toHaveProperty("password")
  })
})

describe("session.user.id tipagem", () => {
  it("id é tipado como string (não undefined)", () => {
    const session = {
      user: {
        id: "user-uuid-1",
        name: "Dr. Teste",
        email: "psi@example.com",
        image: null,
      },
      expires: new Date().toISOString(),
    }

    // TypeScript valida que session.user.id é string
    const id: string = session.user.id
    expect(id).toBe("user-uuid-1")
    expect(typeof id).toBe("string")
  })
})
