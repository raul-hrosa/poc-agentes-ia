"use server"

import { z } from "zod"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"

const CompleteAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
})

const ALLOWED_STATUSES = ["scheduled", "confirmed"] as const

export async function completeAppointment(
  input: z.input<typeof CompleteAppointmentSchema>
): Promise<{ success: true }> {
  const user = await getCurrentUser()

  const validated = CompleteAppointmentSchema.parse(input)
  const { appointmentId } = validated

  const appointment = await getAppointmentById(user.id, appointmentId)

  if (!appointment) {
    throw new Error("Consulta não encontrada")
  }

  if (!(ALLOWED_STATUSES as readonly string[]).includes(appointment.status)) {
    throw new Error("Não é possível marcar esta consulta como realizada.")
  }

  await prisma.appointment.update({
    where: { id: appointmentId, userId: user.id },
    data: { status: "completed" },
  })

  return { success: true }
}
