import { prisma } from "@/shared/lib/prisma"
import type { SessionNoteWithContext } from "@/features/notes/types"

/**
 * Busca um prontuário pelo id, validando pertencimento ao psicólogo.
 * WHERE: id = noteId AND userId (isolamento por userId — AC-24)
 * INCLUDE: appointment com patient (id, name)
 * Retorna null se não existir ou se pertencer a outro userId.
 * A camada de chamada (Server Component ou Action) é responsável por retornar 404 quando null.
 * Usado na página /notes/[note_id].
 */
export async function getSessionNoteById(
  userId: string,
  noteId: string
): Promise<SessionNoteWithContext | null> {
  const note = await prisma.sessionNote.findFirst({
    where: { id: noteId, userId },
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
