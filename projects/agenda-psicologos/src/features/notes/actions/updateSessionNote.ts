"use server"

import { z } from "zod"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { UpdateSessionNoteSchema } from "@/features/notes/schema"
import type { NoteActionResult } from "@/features/notes/types"

export async function updateSessionNote(
  input: z.input<typeof UpdateSessionNoteSchema>
): Promise<NoteActionResult> {
  const user = await getCurrentUser()

  const validated = UpdateSessionNoteSchema.parse(input)

  const existingNote = await prisma.sessionNote.findFirst({
    where: { id: validated.noteId, userId: user.id },
    select: { id: true },
  })

  if (!existingNote) {
    throw new Error("Prontuário não encontrado")
  }

  await prisma.sessionNote.update({
    where: { id: validated.noteId },
    data: { content: validated.content },
  })

  return { success: true, noteId: validated.noteId }
}
