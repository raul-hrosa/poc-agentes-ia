"use server"

import { z } from "zod"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"

const MarkNoShowSchema = z.object({
  appointmentId: z.string().uuid(),
})

const ALLOWED_STATUSES = ["scheduled", "confirmed"] as const

export async function markNoShow(
  input: z.input<typeof MarkNoShowSchema>
): Promise<{ success: true }> {
  const user = await getCurrentUser()

  const validated = MarkNoShowSchema.parse(input)
  const { appointmentId } = validated

  const appointment = await getAppointmentById(user.id, appointmentId)

  if (!appointment) {
    throw new Error("Consulta não encontrada")
  }

  if (!(ALLOWED_STATUSES as readonly string[]).includes(appointment.status)) {
    throw new Error("Não é possível registrar falta nesta consulta.")
  }

  await prisma.appointment.update({
    where: { id: appointmentId, userId: user.id },
    data: { status: "no_show" },
  })

  return { success: true }
}
