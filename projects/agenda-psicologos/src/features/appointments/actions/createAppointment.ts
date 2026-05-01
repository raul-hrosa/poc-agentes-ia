"use server"

import { z } from "zod"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { AppointmentFormSchema } from "@/features/appointments/schema"
import { getConflictingAppointments } from "@/features/appointments/queries/getConflictingAppointments"
import type { AppointmentActionResult } from "@/features/appointments/types"

export async function createAppointment(
  input: z.input<typeof AppointmentFormSchema>
): Promise<AppointmentActionResult> {
  const user = await getCurrentUser()

  const validated = AppointmentFormSchema.parse(input)
  const { patientId, scheduledAt, durationMinutes, modality, location } =
    validated

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: user.id, isActive: true, deletedAt: null },
    select: { id: true, name: true },
  })

  if (!patient) {
    throw new Error("Paciente não encontrado ou inativo")
  }

  const conflicts = await getConflictingAppointments(
    user.id,
    scheduledAt,
    durationMinutes
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

  const appointment = await prisma.appointment.create({
    data: {
      userId: user.id,
      patientId,
      scheduledAt,
      durationMinutes,
      modality,
      location: location ?? null,
      status: "scheduled",
    },
    select: { id: true },
  })

  return { success: true, appointmentId: appointment.id }
}
