import { prisma } from "@/shared/lib/prisma"
import { AppointmentWithPatient } from "../types"

/**
 * Retorna todas as consultas de um dia específico.
 * Parâmetros: userId, date (hora ignorada — range é 00:00:00–23:59:59)
 * WHERE: userId, scheduledAt >= início do dia, scheduledAt <= fim do dia, deletedAt IS NULL
 * ORDER BY: scheduledAt ASC
 * INCLUDE: patient (id, name, phone)
 */
export async function getDayAppointments(
  userId: string,
  date: Date
): Promise<AppointmentWithPatient[]> {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const rows = await prisma.appointment.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: dayStart,
        lte: dayEnd,
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
