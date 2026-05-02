import { prisma } from "@/shared/lib/prisma"
import { getLatestReminderForAppointment } from "./getLatestReminderForAppointment"
import type { AppointmentWithReminderData } from "@/features/reminders/types"

export async function getAppointmentForReminder(
  appointmentId: string,
  userId: string,
): Promise<AppointmentWithReminderData | null> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    select: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
      modality: true,
      location: true,
      status: true,
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!appointment) {
    return null
  }

  const latestReminder = await getLatestReminderForAppointment(
    appointmentId,
    userId,
  )

  return {
    id: appointment.id,
    scheduledAt: appointment.scheduledAt,
    durationMinutes: appointment.durationMinutes,
    modality: appointment.modality,
    location: appointment.location,
    status: appointment.status,
    patient: {
      id: appointment.patient.id,
      name: appointment.patient.name,
      email: appointment.patient.email,
    },
    user: {
      id: appointment.user.id,
      name: appointment.user.name,
    },
    latestReminder,
  }
}
