import { prisma } from "@/shared/lib/prisma"
import type { SessionNoteListItem } from "@/features/notes/types"

/**
 * Lista todos os prontuários de um paciente, ordenados da sessão mais recente para a mais antiga.
 * WHERE: userId AND appointment.patientId — garante isolamento duplo (psicólogo e paciente).
 * Sem queries N+1 — relação appointment carregada no mesmo select.
 * Usado na página /patients/[patient_id]/notes.
 */
export async function getPatientSessionNotes(
  userId: string,
  patientId: string
): Promise<SessionNoteListItem[]> {
  const notes = await prisma.sessionNote.findMany({
    where: { userId, appointment: { patientId } },
    select: {
      id: true,
      content: true,
      createdAt: true,
      appointment: { select: { scheduledAt: true } },
    },
    orderBy: { appointment: { scheduledAt: "desc" } },
  })

  return notes
}
