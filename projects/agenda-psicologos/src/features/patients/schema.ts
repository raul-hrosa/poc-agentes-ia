import { z } from "zod"

export const MAX_FREE_PATIENTS = 10

export const PatientFormSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório").max(255),
    phone: z
      .string()
      .min(1, "Telefone é obrigatório")
      .regex(/^\d{10,11}$/, "Telefone inválido. Use o formato 11999999999"),
    birthDate: z.coerce
      .date()
      .max(new Date(), "Data de nascimento não pode ser uma data futura")
      .optional()
      .nullable(),
    emergencyContactName: z.string().max(255).optional().nullable(),
    emergencyContactPhone: z
      .string()
      .regex(/^\d{10,11}$/, "Telefone inválido. Use o formato 11999999999")
      .optional()
      .nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const hasName = !!data.emergencyContactName?.trim()
      const hasPhone = !!data.emergencyContactPhone?.trim()
      return hasName === hasPhone
    },
    {
      message: "Informe também o telefone do contato de emergência",
      path: ["emergencyContactPhone"],
    }
  )
  .refine(
    (data) => {
      const hasName = !!data.emergencyContactName?.trim()
      const hasPhone = !!data.emergencyContactPhone?.trim()
      return hasName === hasPhone
    },
    {
      message: "Informe também o nome do contato de emergência",
      path: ["emergencyContactName"],
    }
  )

export type PatientFormInput = z.infer<typeof PatientFormSchema>
