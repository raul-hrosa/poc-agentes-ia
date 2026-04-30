import { describe, it, expect } from "vitest"
import { PatientFormSchema, MAX_FREE_PATIENTS } from "../schema"

describe("PatientFormSchema", () => {
  const validBase = {
    name: "Maria Silva",
    phone: "11999999999",
  }

  describe("name", () => {
    it("aceita nome válido", () => {
      const result = PatientFormSchema.safeParse(validBase)
      expect(result.success).toBe(true)
    })

    it("rejeita nome vazio com mensagem 'Nome é obrigatório'", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, name: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const nameErrors = result.error.issues.filter((e) => e.path[0] === "name")
        expect(nameErrors[0].message).toBe("Nome é obrigatório")
      }
    })
  })

  describe("phone", () => {
    it("aceita telefone com 10 dígitos", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, phone: "1133334444" })
      expect(result.success).toBe(true)
    })

    it("aceita telefone com 11 dígitos", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, phone: "11999999999" })
      expect(result.success).toBe(true)
    })

    it("rejeita telefone vazio com mensagem 'Telefone é obrigatório'", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, phone: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const phoneErrors = result.error.issues.filter((e) => e.path[0] === "phone")
        expect(phoneErrors[0].message).toBe("Telefone é obrigatório")
      }
    })

    it("rejeita telefone com menos de 10 dígitos", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, phone: "119999999" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const phoneErrors = result.error.issues.filter((e) => e.path[0] === "phone")
        expect(phoneErrors[0].message).toBe(
          "Telefone inválido. Use o formato 11999999999"
        )
      }
    })

    it("rejeita telefone com mais de 11 dígitos", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, phone: "119999999990" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const phoneErrors = result.error.issues.filter((e) => e.path[0] === "phone")
        expect(phoneErrors[0].message).toBe(
          "Telefone inválido. Use o formato 11999999999"
        )
      }
    })

    it("rejeita telefone com letras", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, phone: "1199999ABCD" })
      expect(result.success).toBe(false)
    })
  })

  describe("birthDate", () => {
    it("aceita data de nascimento no passado", () => {
      const result = PatientFormSchema.safeParse({
        ...validBase,
        birthDate: new Date("1990-01-01"),
      })
      expect(result.success).toBe(true)
    })

    it("rejeita data de nascimento futura com mensagem correta", () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = PatientFormSchema.safeParse({
        ...validBase,
        birthDate: futureDate,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const birthErrors = result.error.issues.filter(
          (e) => e.path[0] === "birthDate"
        )
        expect(birthErrors[0].message).toBe(
          "Data de nascimento não pode ser uma data futura"
        )
      }
    })

    it("aceita birthDate null", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, birthDate: null })
      expect(result.success).toBe(true)
    })

    it("aceita birthDate undefined (campo opcional)", () => {
      const result = PatientFormSchema.safeParse(validBase)
      expect(result.success).toBe(true)
    })
  })

  describe("contato de emergência", () => {
    it("aceita quando ambos nome e telefone são preenchidos", () => {
      const result = PatientFormSchema.safeParse({
        ...validBase,
        emergencyContactName: "João Silva",
        emergencyContactPhone: "11988887777",
      })
      expect(result.success).toBe(true)
    })

    it("aceita quando ambos nome e telefone são omitidos", () => {
      const result = PatientFormSchema.safeParse(validBase)
      expect(result.success).toBe(true)
    })

    it("aceita quando ambos nome e telefone são null", () => {
      const result = PatientFormSchema.safeParse({
        ...validBase,
        emergencyContactName: null,
        emergencyContactPhone: null,
      })
      expect(result.success).toBe(true)
    })

    it("rejeita quando apenas nome do contato é preenchido (sem telefone)", () => {
      const result = PatientFormSchema.safeParse({
        ...validBase,
        emergencyContactName: "João Silva",
        emergencyContactPhone: null,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues
        const phoneError = errors.find(
          (e) => e.path[0] === "emergencyContactPhone"
        )
        expect(phoneError?.message).toBe(
          "Informe também o telefone do contato de emergência"
        )
      }
    })

    it("rejeita quando apenas telefone do contato é preenchido (sem nome)", () => {
      const result = PatientFormSchema.safeParse({
        ...validBase,
        emergencyContactName: null,
        emergencyContactPhone: "11988887777",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues
        const nameError = errors.find(
          (e) => e.path[0] === "emergencyContactName"
        )
        expect(nameError?.message).toBe(
          "Informe também o nome do contato de emergência"
        )
      }
    })

    it("rejeita telefone do contato com formato inválido", () => {
      const result = PatientFormSchema.safeParse({
        ...validBase,
        emergencyContactName: "João Silva",
        emergencyContactPhone: "9999",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.issues.filter(
          (e) => e.path[0] === "emergencyContactPhone"
        )
        expect(errors[0].message).toBe(
          "Telefone inválido. Use o formato 11999999999"
        )
      }
    })
  })

  describe("notes", () => {
    it("aceita notes preenchida", () => {
      const result = PatientFormSchema.safeParse({
        ...validBase,
        notes: "Paciente com histórico de ansiedade.",
      })
      expect(result.success).toBe(true)
    })

    it("aceita notes null", () => {
      const result = PatientFormSchema.safeParse({ ...validBase, notes: null })
      expect(result.success).toBe(true)
    })
  })
})

describe("MAX_FREE_PATIENTS", () => {
  it("deve ser 10", () => {
    expect(MAX_FREE_PATIENTS).toBe(10)
  })
})
