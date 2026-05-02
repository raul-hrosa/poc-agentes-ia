import { prisma } from "@/shared/lib/prisma"
import type { ConfirmPageData, ConfirmPageError } from "@/features/reminders/types"

export async function getTokenForConfirmPage(
  token: string,
): Promise<ConfirmPageData | ConfirmPageError> {
  const tokenRecord = await prisma.appointmentToken.findUnique({
    where: { token },
    include: {
      appointment: {
        include: {
          patient: true,
          user: true,
        },
      },
    },
  })

  if (!tokenRecord) {
    return { valid: false, reason: "not_found" }
  }

  if (tokenRecord.expiresAt <= new Date()) {
    return { valid: false, reason: "expired" }
  }

  if (tokenRecord.usedAt !== null) {
    return {
      valid: false,
      reason: "used",
      action: tokenRecord.action as "confirmed" | "cancelled",
    }
  }

  const { status } = tokenRecord.appointment
  if (status === "completed" || status === "cancelled" || status === "no_show") {
    return { valid: false, reason: "appointment_closed" }
  }

  return {
    valid: true,
    appointment: {
      scheduledAt: tokenRecord.appointment.scheduledAt,
      durationMinutes: tokenRecord.appointment.durationMinutes,
      modality: tokenRecord.appointment.modality,
      location: tokenRecord.appointment.location,
      status: tokenRecord.appointment.status,
    },
    patient: {
      name: tokenRecord.appointment.patient.name,
    },
    psychologist: {
      name: tokenRecord.appointment.user.name,
    },
    token: tokenRecord.token,
    action: null,
  }
}
