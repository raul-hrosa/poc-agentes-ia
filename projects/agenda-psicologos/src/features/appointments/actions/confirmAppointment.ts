"use server"

import { z } from "zod"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"

const ConfirmAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
})

export async function confirmAppointment(
  input: z.input<typeof ConfirmAppointmentSchema>
): Promise<{ success: true }> {
  const user = await getCurrentUser()

  const validated = ConfirmAppointmentSchema.parse(input)
  const { appointmentId } = validated

  const appointment = await getAppointmentById(user.id, appointmentId)

  if (!appointment) {
    throw new Error("Consulta não encontrada")
  }

  if (appointment.status !== "scheduled") {
    throw new Error("Apenas consultas agendadas podem ser confirmadas manualmente.")
  }

  await prisma.appointment.update({
    where: { id: appointmentId, userId: user.id },
    data: { status: "confirmed" },
  })

  return { success: true }
}
