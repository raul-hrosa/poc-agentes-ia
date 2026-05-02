"use server"

import { z } from "zod"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { DeleteSessionNoteSchema } from "@/features/notes/schema"

type DeleteNoteResult =
  | { success: true; appointmentId: string }
  | { error: string }

export async function deleteSessionNote(
  input: z.input<typeof DeleteSessionNoteSchema>
): Promise<DeleteNoteResult> {
  const user = await getCurrentUser()

  const validated = DeleteSessionNoteSchema.parse(input)

  const note = await prisma.sessionNote.findFirst({
    where: { id: validated.noteId, userId: user.id },
    select: { id: true, appointmentId: true },
  })

  if (!note) {
    throw new Error("Prontuário não encontrado")
  }

  await prisma.sessionNote.delete({ where: { id: validated.noteId } })

  return { success: true, appointmentId: note.appointmentId }
}
