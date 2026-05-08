import { describe, it, expect } from "vitest"
import { SessionPaymentFormSchema } from "../schema"

const VALID_APPOINTMENT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

describe("SessionPaymentFormSchema", () => {
  it("valida input correto com status paid", () => {
    const result = SessionPaymentFormSchema.safeParse({
      appointmentId: VALID_APPOINTMENT_ID,
      amountBRL: "150,00",
      status: "paid",
      paymentMethod: "pix",
      notes: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amountBRL).toBe(150)
    }
  })

  it("valida input correto com status pending e sem forma de pagamento", () => {
    const result = SessionPaymentFormSchema.safeParse({
      appointmentId: VALID_APPOINTMENT_ID,
      amountBRL: "200.50",
      status: "pending",
      paymentMethod: null,
      notes: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amountBRL).toBeCloseTo(200.5)
    }
  })

  it("rejeita amountBRL vazio com mensagem correta", () => {
    const result = SessionPaymentFormSchema.safeParse({
      appointmentId: VALID_APPOINTMENT_ID,
      amountBRL: "",
      status: "pending",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message)
      expect(msgs).toContain("O valor da sessão é obrigatório")
    }
  })

  it("rejeita amountBRL zero com mensagem correta", () => {
    const result = SessionPaymentFormSchema.safeParse({
      appointmentId: VALID_APPOINTMENT_ID,
      amountBRL: "0",
      status: "pending",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message)
      expect(msgs).toContain("O valor deve ser maior que zero")
    }
  })

  it("rejeita amountBRL negativo com mensagem correta", () => {
    const result = SessionPaymentFormSchema.safeParse({
      appointmentId: VALID_APPOINTMENT_ID,
      amountBRL: "-10",
      status: "pending",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message)
      expect(msgs).toContain("O valor deve ser maior que zero")
    }
  })

  it("rejeita amountBRL não numérico com mensagem correta", () => {
    const result = SessionPaymentFormSchema.safeParse({
      appointmentId: VALID_APPOINTMENT_ID,
      amountBRL: "abc",
      status: "pending",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message)
      expect(msgs).toContain("Informe um valor válido em reais")
    }
  })

  it("rejeita appointmentId inválido (não UUID)", () => {
    const result = SessionPaymentFormSchema.safeParse({
      appointmentId: "not-a-uuid",
      amountBRL: "100",
      status: "pending",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message)
      expect(msgs).toContain("ID da consulta inválido")
    }
  })

  it("converte amountBRL com vírgula decimal corretamente", () => {
    const result = SessionPaymentFormSchema.safeParse({
      appointmentId: VALID_APPOINTMENT_ID,
      amountBRL: "150,50",
      status: "paid",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amountBRL).toBeCloseTo(150.5)
    }
  })
})
