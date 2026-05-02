"use server"

import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import {
  generateConfirmationToken,
  buildConfirmationLink,
  getTokenExpiration,
} from "@/shared/lib/tokens"
import { GenerateReminderSchema } from "@/features/reminders/schema"

export async function generateReminderToken(input: { appointmentId: string }): Promise<{
  success: true
  token: string
  link: string
}> {
  const user = await getCurrentUser()

  const { appointmentId } = GenerateReminderSchema.parse(input)

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
    select: { id: true, status: true },
  })

  if (!appointment) {
    throw new Error("Consulta não encontrada")
  }

  if (appointment.status !== "scheduled" && appointment.status !== "confirmed") {
    throw new Error("Não é possível gerar lembrete para esta consulta")
  }

  await prisma.appointmentToken.updateMany({
    where: {
      appointmentId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { expiresAt: new Date() },
  })

  const expiresAt = getTokenExpiration()
  const token = generateConfirmationToken(appointmentId, expiresAt)

  await prisma.appointmentToken.create({
    data: { appointmentId, token, expiresAt },
  })

  return { success: true, token, link: buildConfirmationLink(token) }
}
