"use server"

import { z } from "zod"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { AppointmentFormSchema } from "@/features/appointments/schema"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"
import { getConflictingAppointments } from "@/features/appointments/queries/getConflictingAppointments"
import type { AppointmentActionResult } from "@/features/appointments/types"

const TERMINAL_STATUSES = ["completed", "cancelled", "no_show"] as const

const UpdateAppointmentInputSchema = AppointmentFormSchema.extend({
  appointmentId: z.string().uuid("ID de consulta inválido"),
})

export async function updateAppointment(
  input: z.input<typeof UpdateAppointmentInputSchema>
): Promise<AppointmentActionResult> {
  const user = await getCurrentUser()

  const { appointmentId, ...fields } =
    UpdateAppointmentInputSchema.parse(input)

  const existing = await getAppointmentById(user.id, appointmentId)

  if (!existing) {
    throw new Error("Consulta não encontrada")
  }

  if (TERMINAL_STATUSES.includes(existing.status as (typeof TERMINAL_STATUSES)[number])) {
    return {
      success: false,
      error: "Consultas finalizadas não podem ser editadas.",
    }
  }

  const { patientId, scheduledAt, durationMinutes, modality, location } = fields

  const timeChanged =
    scheduledAt.getTime() !== existing.scheduledAt.getTime() ||
    durationMinutes !== existing.durationMinutes

  if (timeChanged) {
    const conflicts = await getConflictingAppointments(
      user.id,
      scheduledAt,
      durationMinutes,
      appointmentId
    )

    if (conflicts.length > 0) {
      const conflict = conflicts[0]
      const time = conflict.scheduledAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      return {
        success: false,
        error: {
          type: "conflict",
          message: `Horário conflita com a consulta de ${conflict.patient.name} às ${time}`,
        },
      }
    }
  }

  await prisma.appointment.update({
    where: { id: appointmentId, userId: user.id },
    data: {
      patientId,
      scheduledAt,
      durationMinutes,
      modality,
      location: location ?? null,
    },
  })

  return { success: true, appointmentId }
}
