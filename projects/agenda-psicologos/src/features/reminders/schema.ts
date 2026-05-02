import { z } from "zod"

export const GenerateReminderSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
})

export const SendReminderEmailSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
})

export const ConfirmActionSchema = z.object({
  token: z.string().length(64, "Token inválido"),
  action: z.enum(["confirmed", "cancelled"]),
})
