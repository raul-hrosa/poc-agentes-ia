import { z } from "zod"

export const AppointmentFormSchema = z.object({
  patientId: z.string().uuid("Selecione um paciente"),
  scheduledAt: z.coerce.date({
    error: "Data e horário são obrigatórios",
  }),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duração deve ser de pelo menos 1 minuto")
    .default(50),
  modality: z.enum(["in_person", "online"], {
    error: "Selecione a modalidade",
  }),
  location: z.string().max(500).optional().nullable(),
})

export const CancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid("ID de consulta inválido"),
  cancellationReason: z
    .string()
    .max(500, "Motivo deve ter no máximo 500 caracteres")
    .optional(),
})

export const UpdateStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["completed", "no_show"]),
})
