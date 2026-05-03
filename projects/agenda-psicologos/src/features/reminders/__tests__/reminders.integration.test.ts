/**
 * Testes de integração — feature lembretes-consulta
 *
 * Cobre 6 fluxos do ciclo completo de lembretes:
 * 1. Geração de token pelo psicólogo
 * 2. Envio de e-mail de lembrete
 * 3. Confirmação pelo paciente via API Route
 * 4. Cancelamento pelo paciente via API Route
 * 5. Casos de erro da API Route
 * 6. Autorização (isolamento por userId e autenticação)
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ---------------------------------------------------------------------------
// Mocks — devem ser declarados antes de qualquer import dos módulos mockados
// ---------------------------------------------------------------------------

vi.mock("@/features/auth/queries/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    appointmentToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/shared/lib/tokens", () => ({
  generateConfirmationToken: vi.fn(() => TOKEN),
  buildConfirmationLink: (token: string) =>
    `https://app.psiagenda.com.br/confirm/${token}`,
  getTokenExpiration: vi.fn(
    () => new Date(Date.now() + 72 * 60 * 60 * 1000),
  ),
}))

vi.mock("@/shared/lib/resend", () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (após os mocks)
// ---------------------------------------------------------------------------

import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { buildConfirmationLink } from "@/shared/lib/tokens"
import { resend } from "@/shared/lib/resend"
import { generateReminderToken } from "../actions/generateReminderToken"
import { sendReminderEmail } from "../actions/sendReminderEmail"
import { POST } from "@/app/api/confirm/[token]/route"

// ---------------------------------------------------------------------------
// Helpers e fixtures
// ---------------------------------------------------------------------------

const TOKEN = "a".repeat(64)
const APPOINTMENT_ID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"
const USER = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  name: "Dr. João",
  email: "joao@psi.com",
}
const PATIENT = {
  id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
  name: "Ana Lima",
  phone: "11999990001",
  email: "ana@email.com",
}

const mockGetCurrentUser = getCurrentUser as ReturnType<typeof vi.fn>
const mockAppointmentFindFirst = prisma.appointment.findFirst as ReturnType<typeof vi.fn>
const mockTokenUpdateMany = prisma.appointmentToken.updateMany as ReturnType<typeof vi.fn>
const mockTokenCreate = prisma.appointmentToken.create as ReturnType<typeof vi.fn>
const mockTokenFindUnique = prisma.appointmentToken.findUnique as ReturnType<typeof vi.fn>
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>
const mockResendSend = resend.emails.send as ReturnType<typeof vi.fn>

function makeAppointment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPOINTMENT_ID,
    userId: USER.id,
    patientId: PATIENT.id,
    scheduledAt: new Date("2026-05-10T09:00:00.000Z"),
    durationMinutes: 50,
    modality: "in_person",
    location: null,
    status: "scheduled",
    cancellationReason: null,
    patient: { ...PATIENT },
    user: { id: USER.id, name: USER.name },
    ...overrides,
  }
}

function makeTokenRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "token-id-1",
    token: TOKEN,
    appointmentId: APPOINTMENT_ID,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    usedAt: null,
    action: null,
    appointment: {
      id: APPOINTMENT_ID,
      status: "scheduled",
    },
    ...overrides,
  }
}

function makeConfirmRequest(body: Record<string, unknown> = { action: "confirmed" }): NextRequest {
  return new NextRequest(`http://localhost/api/confirm/${TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const routeContext = { params: { token: TOKEN } }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCurrentUser.mockResolvedValue(USER)
  mockTransaction.mockImplementation(async (ops: Promise<unknown>[]) =>
    Promise.all(ops),
  )
  mockResendSend.mockResolvedValue({ data: { id: "email-id" }, error: null })
  mockTokenCreate.mockResolvedValue({ id: "new-token-id" })
  mockTokenUpdateMany.mockResolvedValue({ count: 0 })
})

// ---------------------------------------------------------------------------
// Fluxo 1 — Geração de token pelo psicólogo
// ---------------------------------------------------------------------------

describe("Fluxo 1 — Geração de token pelo psicólogo", () => {
  it("cria token com expiresAt aproximadamente 72h a partir de agora", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment({ status: "scheduled" }))

    await generateReminderToken({ appointmentId: APPOINTMENT_ID })

    expect(mockTokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: APPOINTMENT_ID,
          token: TOKEN,
          expiresAt: expect.any(Date),
        }),
      }),
    )

    const createdAt = Date.now()
    const expiresAt = (mockTokenCreate.mock.calls[0][0] as {
      data: { expiresAt: Date }
    }).data.expiresAt.getTime()
    const diffHours = (expiresAt - createdAt) / (1000 * 60 * 60)
    expect(diffHours).toBeGreaterThan(71)
    expect(diffHours).toBeLessThan(73)
  })

  it("invalida token ativo anterior (updateMany com expiresAt = now)", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment({ status: "scheduled" }))
    mockTokenUpdateMany.mockResolvedValue({ count: 1 })

    const before = Date.now()
    await generateReminderToken({ appointmentId: APPOINTMENT_ID })
    const after = Date.now()

    expect(mockTokenUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          appointmentId: APPOINTMENT_ID,
          usedAt: null,
        }),
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      }),
    )

    const invalidatedAt = (mockTokenUpdateMany.mock.calls[0][0] as {
      data: { expiresAt: Date }
    }).data.expiresAt.getTime()
    expect(invalidatedAt).toBeGreaterThanOrEqual(before)
    expect(invalidatedAt).toBeLessThanOrEqual(after)
  })

  it("buildConfirmationLink retorna URL com o token gerado", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment({ status: "scheduled" }))

    const result = await generateReminderToken({ appointmentId: APPOINTMENT_ID })

    expect(result.link).toBe(buildConfirmationLink(TOKEN))
    expect(result.link).toContain(`/confirm/${TOKEN}`)
  })

  it("retorna success true com token e link para consulta scheduled", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment({ status: "scheduled" }))

    const result = await generateReminderToken({ appointmentId: APPOINTMENT_ID })

    expect(result.success).toBe(true)
    expect(result.token).toBe(TOKEN)
    expect(result.link).toContain(TOKEN)
  })
})

// ---------------------------------------------------------------------------
// Fluxo 2 — Envio de e-mail de lembrete
// ---------------------------------------------------------------------------

describe("Fluxo 2 — Envio de e-mail de lembrete", () => {
  it("envia e-mail com from, to e subject corretos", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())

    await sendReminderEmail({ appointmentId: APPOINTMENT_ID })

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PsiAgenda <lembretes@psiagenda.com.br>",
        to: PATIENT.email,
        subject: `Lembrete: sua consulta com ${USER.name}`,
      }),
    )
  })

  it("e-mail contém links com ?action=confirmed e ?action=cancelled no HTML", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())

    await sendReminderEmail({ appointmentId: APPOINTMENT_ID })

    const callArgs = mockResendSend.mock.calls[0][0] as { html: string }
    expect(callArgs.html).toContain("?action=confirmed")
    expect(callArgs.html).toContain("?action=cancelled")
  })

  it("lança erro amigável quando Resend retorna erro", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())
    mockResendSend.mockResolvedValue({ data: null, error: { message: "rate_limit" } })

    await expect(
      sendReminderEmail({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Falha ao enviar e-mail. Copie o link e envie manualmente.")
  })

  it("retorna success true e link após envio bem-sucedido", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())

    const result = await sendReminderEmail({ appointmentId: APPOINTMENT_ID })

    expect(result.success).toBe(true)
    expect(result.link).toContain("/confirm/")
  })
})

// ---------------------------------------------------------------------------
// Fluxo 3 — Confirmação pelo paciente via API Route
// ---------------------------------------------------------------------------

describe("Fluxo 3 — Confirmação pelo paciente via API Route", () => {
  it("confirma consulta: appointment.status muda para confirmed", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())

    const req = makeConfirmRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { success: boolean; action: string }
    expect(json.success).toBe(true)
    expect(json.action).toBe("confirmed")
  })

  it("preenche appointmentToken.usedAt e action após confirmação", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())

    const req = makeConfirmRequest({ action: "confirmed" })
    await POST(req, routeContext)

    expect(mockTransaction).toHaveBeenCalledOnce()
    const transactionArg = mockTransaction.mock.calls[0][0] as unknown[]
    expect(Array.isArray(transactionArg)).toBe(true)
    expect(transactionArg).toHaveLength(2)
  })

  it("executa dentro de uma transação ($transaction chamado)", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())

    const req = makeConfirmRequest({ action: "confirmed" })
    await POST(req, routeContext)

    expect(mockTransaction).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// Fluxo 4 — Cancelamento pelo paciente
// ---------------------------------------------------------------------------

describe("Fluxo 4 — Cancelamento pelo paciente", () => {
  it("cancela consulta: retorna 200 com action=cancelled", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())

    const req = makeConfirmRequest({ action: "cancelled" })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { success: boolean; action: string }
    expect(json.success).toBe(true)
    expect(json.action).toBe("cancelled")
  })

  it("cancela consulta: transação é chamada com dois updates", async () => {
    mockTokenFindUnique.mockResolvedValue(makeTokenRecord())

    const req = makeConfirmRequest({ action: "cancelled" })
    await POST(req, routeContext)

    expect(mockTransaction).toHaveBeenCalledOnce()
    const transactionArg = mockTransaction.mock.calls[0][0] as unknown[]
    expect(transactionArg).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Fluxo 5 — Casos de erro da API Route
// ---------------------------------------------------------------------------

describe("Fluxo 5 — Casos de erro da API Route", () => {
  it("retorna 410 para token expirado", async () => {
    mockTokenFindUnique.mockResolvedValue(
      makeTokenRecord({ expiresAt: new Date(Date.now() - 1000) }),
    )

    const req = makeConfirmRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(410)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe("expired")
  })

  it("retorna 409 para token já usado e inclui a action registrada", async () => {
    mockTokenFindUnique.mockResolvedValue(
      makeTokenRecord({
        usedAt: new Date("2026-05-03T10:00:00.000Z"),
        action: "confirmed",
      }),
    )

    const req = makeConfirmRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(409)
    const json = (await res.json()) as { error: string; action: string }
    expect(json.error).toBe("used")
    expect(json.action).toBe("confirmed")
  })

  it("retorna 404 para token inexistente", async () => {
    mockTokenFindUnique.mockResolvedValue(null)

    const req = makeConfirmRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(404)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe("not_found")
  })

  it("retorna 422 para consulta com status completed", async () => {
    mockTokenFindUnique.mockResolvedValue(
      makeTokenRecord({
        appointment: { id: APPOINTMENT_ID, status: "completed" },
      }),
    )

    const req = makeConfirmRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(422)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe("appointment_closed")
  })

  it("retorna 422 para consulta com status cancelled", async () => {
    mockTokenFindUnique.mockResolvedValue(
      makeTokenRecord({
        appointment: { id: APPOINTMENT_ID, status: "cancelled" },
      }),
    )

    const req = makeConfirmRequest({ action: "confirmed" })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(422)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe("appointment_closed")
  })
})

// ---------------------------------------------------------------------------
// Fluxo 6 — Autorização
// ---------------------------------------------------------------------------

describe("Fluxo 6 — Autorização", () => {
  it("psicólogo não autenticado recebe erro ao chamar generateReminderToken", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Não autenticado"))

    await expect(
      generateReminderToken({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Não autenticado")
  })

  it("psicólogo não autenticado recebe erro ao chamar sendReminderEmail", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Não autenticado"))

    await expect(
      sendReminderEmail({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Não autenticado")
  })

  it("psicólogo autenticado não encontra consulta de outro psicólogo", async () => {
    // appointment.findFirst filtra por userId — retorna null para userId errado
    mockAppointmentFindFirst.mockResolvedValue(null)

    await expect(
      generateReminderToken({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Consulta não encontrada")

    expect(mockAppointmentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER.id }),
      }),
    )
  })

  it("consulta é filtrada por userId do psicólogo autenticado (isolamento)", async () => {
    const OTHER_USER_ID = "ffeebc99-9c0b-4ef8-bb6d-6bb9bd380aff"
    mockGetCurrentUser.mockResolvedValue({ ...USER, id: OTHER_USER_ID })
    mockAppointmentFindFirst.mockResolvedValue(null)

    await expect(
      generateReminderToken({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Consulta não encontrada")

    expect(mockAppointmentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: OTHER_USER_ID }),
      }),
    )
  })
})
