import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  generateConfirmationToken,
  buildConfirmationLink,
  getTokenExpiration,
} from "../tokens"

describe("generateConfirmationToken", () => {
  beforeEach(() => {
    process.env.APP_SECRET = "test-secret-32-chars-long-minimum"
    process.env.NEXT_PUBLIC_APP_URL = "https://app.psiagenda.com.br"
  })

  it("retorna token hexadecimal de 64 caracteres", () => {
    const expiresAt = new Date("2026-05-05T00:00:00.000Z")
    const token = generateConfirmationToken("appointment-id-123", expiresAt)
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it("é determinístico — mesmo payload gera mesmo token", () => {
    const expiresAt = new Date("2026-05-05T00:00:00.000Z")
    const appointmentId = "appointment-id-123"
    const token1 = generateConfirmationToken(appointmentId, expiresAt)
    const token2 = generateConfirmationToken(appointmentId, expiresAt)
    expect(token1).toBe(token2)
  })

  it("gera tokens diferentes para appointments diferentes", () => {
    const expiresAt = new Date("2026-05-05T00:00:00.000Z")
    const token1 = generateConfirmationToken("appointment-id-aaa", expiresAt)
    const token2 = generateConfirmationToken("appointment-id-bbb", expiresAt)
    expect(token1).not.toBe(token2)
  })

  it("gera tokens diferentes para datas de expiração diferentes", () => {
    const appointmentId = "appointment-id-123"
    const token1 = generateConfirmationToken(
      appointmentId,
      new Date("2026-05-05T00:00:00.000Z"),
    )
    const token2 = generateConfirmationToken(
      appointmentId,
      new Date("2026-05-06T00:00:00.000Z"),
    )
    expect(token1).not.toBe(token2)
  })
})

describe("buildConfirmationLink", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.psiagenda.com.br"
  })

  it("retorna URL com token no path", () => {
    const token = "a".repeat(64)
    const link = buildConfirmationLink(token)
    expect(link).toBe(`https://app.psiagenda.com.br/confirm/${token}`)
  })
})

describe("getTokenExpiration", () => {
  it("retorna data 72 horas no futuro", () => {
    const before = Date.now()
    const expiresAt = getTokenExpiration()
    const after = Date.now()

    const expectedMs = 72 * 60 * 60 * 1000
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + expectedMs)
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + expectedMs)
  })

  it("retorna instância de Date", () => {
    expect(getTokenExpiration()).toBeInstanceOf(Date)
  })
})
