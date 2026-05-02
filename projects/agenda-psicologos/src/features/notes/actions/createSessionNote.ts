"use server"

import { z } from "zod"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { SessionNoteFormSchema } from "@/features/notes/schema"
import type { NoteActionResult } from "@/features/notes/types"

export async function createSessionNote(
  input: z.input<typeof SessionNoteFormSchema>
): Promise<NoteActionResult> {
  const user = await getCurrentUser()

  const validated = SessionNoteFormSchema.parse(input)

  const appointment = await prisma.appointment.findFirst({
    where: { id: validated.appointmentId, userId: user.id },
    select: { id: true, status: true },
  })

  if (!appointment) {
    throw new Error("Consulta não encontrada")
  }

  if (appointment.status !== "completed") {
    return {
      error: "Prontuário só pode ser registrado para sessões realizadas",
    }
  }

  const existingNote = await prisma.sessionNote.findUnique({
    where: { appointmentId: validated.appointmentId },
    select: { id: true },
  })

  if (existingNote) {
    return { success: true, noteId: existingNote.id }
  }

  const newNote = await prisma.sessionNote.create({
    data: {
      appointmentId: validated.appointmentId,
      userId: user.id,
      content: validated.content,
    },
    select: { id: true },
  })

  return { success: true, noteId: newNote.id }
}
