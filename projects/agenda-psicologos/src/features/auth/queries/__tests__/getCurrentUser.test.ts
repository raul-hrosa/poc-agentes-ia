import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCurrentUser } from "../getCurrentUser"

vi.mock("@/shared/lib/auth", () => ({
  auth: vi.fn(),
}))

import { auth } from "@/shared/lib/auth"

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna o usuário quando a sessão é válida", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", name: "Dr. João", email: "joao@example.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any)

    const user = await getCurrentUser()

    expect(user).toEqual({
      id: "user-123",
      name: "Dr. João",
      email: "joao@example.com",
    })
  })

  it("lança erro quando não há sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(getCurrentUser()).rejects.toThrow("Não autenticado")
  })

  it("lança erro quando session.user.id está ausente", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { name: "Dr. João", email: "joao@example.com" } as any,
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any)

    await expect(getCurrentUser()).rejects.toThrow("Não autenticado")
  })
})
