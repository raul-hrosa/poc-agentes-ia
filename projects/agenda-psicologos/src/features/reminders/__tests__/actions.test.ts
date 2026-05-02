import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/features/auth/queries/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    appointment: {
      findFirst: vi.fn(),
    },
    appointmentToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock("@/shared/lib/tokens", () => ({
  generateConfirmationToken: vi.fn(() => "a".repeat(64)),
  buildConfirmationLink: (token: string) =>
    `https://app.psiagenda.com.br/confirm/${token}`,
  getTokenExpiration: vi.fn(() => new Date(Date.now() + 72 * 60 * 60 * 1000)),
}))

vi.mock("@/shared/lib/resend", () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}))

// generateReminderToken is called inside sendReminderEmail
vi.mock("../actions/generateReminderToken", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../actions/generateReminderToken")>()
  return {
    generateReminderToken: vi.fn().mockImplementation(mod.generateReminderToken),
  }
})

import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { resend } from "@/shared/lib/resend"
import { generateReminderToken } from "../actions/generateReminderToken"
import { sendReminderEmail } from "../actions/sendReminderEmail"

const mockGetCurrentUser = getCurrentUser as ReturnType<typeof vi.fn>
const mockAppointmentFindFirst = prisma.appointment.findFirst as ReturnType<typeof vi.fn>
const mockTokenUpdateMany = prisma.appointmentToken.updateMany as ReturnType<typeof vi.fn>
const mockTokenCreate = prisma.appointmentToken.create as ReturnType<typeof vi.fn>
const mockResendSend = resend.emails.send as ReturnType<typeof vi.fn>
const mockGenerateReminderToken = generateReminderToken as ReturnType<typeof vi.fn>

const USER = { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", name: "Dr. João", email: "joao@psi.com" }
const APPOINTMENT_ID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"
const TOKEN = "a".repeat(64)

function makeAppointment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPOINTMENT_ID,
    userId: USER.id,
    patientId: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    scheduledAt: new Date("2026-05-10T09:00:00.000Z"),
    durationMinutes: 50,
    modality: "in_person",
    location: null,
    status: "scheduled",
    cancellationReason: null,
    patient: { id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33", name: "Ana Lima", phone: "11999990001", email: "ana@email.com" },
    user: { id: USER.id, name: USER.name },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCurrentUser.mockResolvedValue(USER)
})

describe("generateReminderToken", () => {
  it("lança erro se não autenticado", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Não autenticado"))
    await expect(
      generateReminderToken({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Não autenticado")
  })

  it("lança erro se consulta não encontrada", async () => {
    mockAppointmentFindFirst.mockResolvedValue(null)
    await expect(
      generateReminderToken({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Consulta não encontrada")
  })

  it("lança erro se consulta tem status terminal", async () => {
    mockAppointmentFindFirst.mockResolvedValue({ id: APPOINTMENT_ID, status: "completed" })
    await expect(
      generateReminderToken({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Não é possível gerar lembrete para esta consulta")
  })

  it("lança erro para consulta cancelada", async () => {
    mockAppointmentFindFirst.mockResolvedValue({ id: APPOINTMENT_ID, status: "cancelled" })
    await expect(
      generateReminderToken({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Não é possível gerar lembrete para esta consulta")
  })

  it("lança erro para consulta no_show", async () => {
    mockAppointmentFindFirst.mockResolvedValue({ id: APPOINTMENT_ID, status: "no_show" })
    await expect(
      generateReminderToken({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Não é possível gerar lembrete para esta consulta")
  })

  it("invalida token ativo anterior antes de criar novo", async () => {
    mockAppointmentFindFirst.mockResolvedValue({ id: APPOINTMENT_ID, status: "scheduled" })
    mockTokenUpdateMany.mockResolvedValue({ count: 1 })
    mockTokenCreate.mockResolvedValue({ id: "new-token-id" })

    await generateReminderToken({ appointmentId: APPOINTMENT_ID })

    expect(mockTokenUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ appointmentId: APPOINTMENT_ID, usedAt: null }),
      }),
    )
    expect(mockTokenCreate).toHaveBeenCalled()
  })

  it("retorna success com token e link para consulta scheduled", async () => {
    mockAppointmentFindFirst.mockResolvedValue({ id: APPOINTMENT_ID, status: "scheduled" })
    mockTokenUpdateMany.mockResolvedValue({ count: 0 })
    mockTokenCreate.mockResolvedValue({ id: "new-token-id" })

    const result = await generateReminderToken({ appointmentId: APPOINTMENT_ID })

    expect(result.success).toBe(true)
    expect(result.token).toBe(TOKEN)
    expect(result.link).toContain("/confirm/")
  })

  it("retorna success para consulta confirmed", async () => {
    mockAppointmentFindFirst.mockResolvedValue({ id: APPOINTMENT_ID, status: "confirmed" })
    mockTokenUpdateMany.mockResolvedValue({ count: 0 })
    mockTokenCreate.mockResolvedValue({ id: "new-token-id" })

    const result = await generateReminderToken({ appointmentId: APPOINTMENT_ID })
    expect(result.success).toBe(true)
  })

  it("filtra consulta por userId do usuário autenticado", async () => {
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

  it("lança erro para appointmentId inválido (não UUID)", async () => {
    await expect(
      generateReminderToken({ appointmentId: "not-a-uuid" }),
    ).rejects.toThrow()
  })
})

describe("sendReminderEmail", () => {
  beforeEach(() => {
    mockGenerateReminderToken.mockResolvedValue({
      success: true,
      token: TOKEN,
      link: `https://app.psiagenda.com.br/confirm/${TOKEN}`,
    })
    mockResendSend.mockResolvedValue({ data: { id: "email-id" }, error: null })
  })

  it("lança erro se não autenticado", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Não autenticado"))
    await expect(
      sendReminderEmail({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Não autenticado")
  })

  it("lança erro se consulta não encontrada", async () => {
    mockAppointmentFindFirst.mockResolvedValue(null)
    await expect(
      sendReminderEmail({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Consulta não encontrada")
  })

  it("lança erro se paciente não tem e-mail", async () => {
    mockAppointmentFindFirst.mockResolvedValue(
      makeAppointment({ patient: { id: "p1", name: "Ana", phone: "11999", email: null } }),
    )
    await expect(
      sendReminderEmail({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Paciente não tem e-mail cadastrado")
  })

  it("envia e-mail com remetente correto", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())

    await sendReminderEmail({ appointmentId: APPOINTMENT_ID })

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PsiAgenda <lembretes@psiagenda.com.br>",
      }),
    )
  })

  it("envia e-mail com subject correto", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())

    await sendReminderEmail({ appointmentId: APPOINTMENT_ID })

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `Lembrete: sua consulta com ${USER.name}`,
      }),
    )
  })

  it("envia e-mail para o e-mail do paciente", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())

    await sendReminderEmail({ appointmentId: APPOINTMENT_ID })

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ana@email.com",
      }),
    )
  })

  it("e-mail contém link de confirmação com ?action=confirmed", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())

    await sendReminderEmail({ appointmentId: APPOINTMENT_ID })

    const callArgs = mockResendSend.mock.calls[0][0]
    expect(callArgs.html).toContain("?action=confirmed")
    expect(callArgs.html).toContain("?action=cancelled")
  })

  it("lança erro amigável quando Resend falha", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())
    mockResendSend.mockResolvedValue({ data: null, error: { message: "API error" } })

    await expect(
      sendReminderEmail({ appointmentId: APPOINTMENT_ID }),
    ).rejects.toThrow("Falha ao enviar e-mail. Copie o link e envie manualmente.")
  })

  it("retorna success e link após envio bem-sucedido", async () => {
    mockAppointmentFindFirst.mockResolvedValue(makeAppointment())

    const result = await sendReminderEmail({ appointmentId: APPOINTMENT_ID })

    expect(result.success).toBe(true)
    expect(result.link).toContain("/confirm/")
  })
})
