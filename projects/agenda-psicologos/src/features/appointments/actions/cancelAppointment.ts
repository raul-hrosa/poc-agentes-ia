"use server"

import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { CancelAppointmentSchema } from "@/features/appointments/schema"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"
import type { z } from "zod"

const TERMINAL_STATUSES = ["completed", "cancelled", "no_show"] as const

export async function cancelAppointment(
  input: z.input<typeof CancelAppointmentSchema>
): Promise<{ success: true }> {
  const user = await getCurrentUser()

  const validated = CancelAppointmentSchema.parse(input)
  const { appointmentId, cancellationReason } = validated

  const appointment = await getAppointmentById(user.id, appointmentId)

  if (!appointment) {
    throw new Error("Consulta não encontrada")
  }

  if ((TERMINAL_STATUSES as readonly string[]).includes(appointment.status)) {
    throw new Error("Esta consulta não pode ser cancelada.")
  }

  await prisma.appointment.update({
    where: { id: appointmentId, userId: user.id },
    data: { status: "cancelled", cancellationReason: cancellationReason ?? null },
  })

  return { success: true }
}
