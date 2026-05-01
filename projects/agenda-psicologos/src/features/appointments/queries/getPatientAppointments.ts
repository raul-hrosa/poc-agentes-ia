import { prisma } from "@/shared/lib/prisma"
import { AppointmentWithPatient } from "../types"

/**
 * Retorna todas as consultas de um paciente específico.
 * WHERE: userId, patientId, deletedAt IS NULL
 * ORDER BY: scheduledAt DESC (histórico decrescente — AC-31)
 * INCLUDE: patient (id, name, phone)
 */
export async function getPatientAppointments(
  userId: string,
  patientId: string
): Promise<AppointmentWithPatient[]> {
  const rows = await prisma.appointment.findMany({
    where: {
      userId,
      patientId,
      deletedAt: null,
    },
    orderBy: { scheduledAt: "desc" },
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
