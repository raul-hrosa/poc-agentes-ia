import { prisma } from "@/shared/lib/prisma"
import { buildConfirmationLink } from "@/shared/lib/tokens"
import type { ReminderInfo, ReminderStatus } from "@/features/reminders/types"

export async function getLatestReminderForAppointment(
  appointmentId: string,
  userId: string,
): Promise<ReminderInfo | null> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    select: { id: true },
  })

  if (!appointment) {
    throw new Error("Consulta não encontrada")
  }

  const tokenRecord = await prisma.appointmentToken.findFirst({
    where: { appointmentId },
    orderBy: { createdAt: "desc" },
  })

  if (!tokenRecord) {
    return null
  }

  let status: ReminderStatus
  if (tokenRecord.action === "confirmed") {
    status = "confirmed"
  } else if (tokenRecord.action === "cancelled") {
    status = "cancelled"
  } else {
    status = "pending"
  }

  return {
    tokenId: tokenRecord.id,
    createdAt: tokenRecord.createdAt,
    expiresAt: tokenRecord.expiresAt,
    usedAt: tokenRecord.usedAt,
    action: tokenRecord.action as "confirmed" | "cancelled" | null,
    status,
    link: buildConfirmationLink(tokenRecord.token),
  }
}
