import { prisma } from "@/shared/lib/prisma"
import { AppointmentWithPatient } from "../types"

type AppointmentWithNote = AppointmentWithPatient & { hasNote: boolean }

/**
 * Busca uma consulta pelo id validando pertencimento ao psicólogo.
 * WHERE: id = appointmentId AND userId (segurança — AC-35)
 * INCLUDE: patient (id, name, phone), sessionNote (id — para verificar hasNote)
 * Retorna null se não existir OU pertencer a outro userId.
 */
export async function getAppointmentById(
  userId: string,
  appointmentId: string
): Promise<AppointmentWithNote | null> {
  const row = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
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
      sessionNote: {
        select: { id: true },
      },
    },
  })

  if (!row) return null

  const { sessionNote, ...appointment } = row

  return {
    ...appointment,
    hasNote: sessionNote !== null,
  } as AppointmentWithNote
}
