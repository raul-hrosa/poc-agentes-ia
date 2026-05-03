"use server"

import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { CancelAppointmentSchema } from "@/features/appointments/schema"
import type { z } from "zod"

const TERMINAL_STATUSES = ["completed", "cancelled", "no_show"] as const

export async function cancelAppointment(
  input: z.input<typeof CancelAppointmentSchema>
): Promise<{ success: true }> {
  const user = await getCurrentUser()

  const validated = CancelAppointmentSchema.parse(input)
  const { appointmentId, cancellationReason } = validated

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, userId: true, status: true },
  })

  if (!appointment || appointment.userId !== user.id) {
    throw new Error("Consulta não encontrada")
  }

  if ((TERMINAL_STATUSES as readonly string[]).includes(appointment.status)) {
    throw new Error("Não é possível cancelar esta consulta")
  }

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "cancelled",
        cancellationReason: cancellationReason ?? null,
      },
    }),
    prisma.appointmentToken.updateMany({
      where: {
        appointmentId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() },
    }),
  ])

  return { success: true }
}
