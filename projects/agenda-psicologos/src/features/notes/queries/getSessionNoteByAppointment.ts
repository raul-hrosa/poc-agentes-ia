import { prisma } from "@/shared/lib/prisma"
import type { SessionNoteWithContext } from "@/features/notes/types"

/**
 * Busca o prontuário de uma consulta, validando pertencimento ao psicólogo.
 * WHERE: appointmentId AND userId (isolamento por userId — AC-24)
 * INCLUDE: appointment com patient (id, name)
 * Retorna null se não existir ou se pertencer a outro userId.
 * Usado na página /notes/new para verificar nota existente antes de exibir formulário.
 */
export async function getSessionNoteByAppointment(
  userId: string,
  appointmentId: string
): Promise<SessionNoteWithContext | null> {
  const note = await prisma.sessionNote.findFirst({
    where: { appointmentId, userId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      appointmentId: true,
      userId: true,
      appointment: {
        select: {
          scheduledAt: true,
          durationMinutes: true,
          modality: true,
          patient: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  return note
}
