import { prisma } from "@/shared/lib/prisma"
import { AppointmentWithPatient } from "../types"

/**
 * Retorna todas as consultas de uma semana para um psicólogo.
 * Parâmetros: userId, weekStart (segunda-feira 00:00:00)
 * WHERE: userId, scheduledAt >= weekStart, scheduledAt < weekStart + 7 dias, deletedAt IS NULL
 * ORDER BY: scheduledAt ASC
 * INCLUDE: patient (id, name, phone)
 */
export async function getWeekAppointments(
  userId: string,
  weekStart: Date
): Promise<AppointmentWithPatient[]> {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const rows = await prisma.appointment.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: weekStart,
        lt: weekEnd,
      },
      deletedAt: null,
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      userId: true,
      patientId: true,
      scheduledAt: true,
      durationMinutes: true,
      modality: true,
      location: true,
      status: true,
      cancellationReason: true,
      createdAt: true,
      updatedAt: true,
      patient: {
        select: { id: true, name: true, phone: true },
      },
    },
  })

  return rows as AppointmentWithPatient[]
}
