export type SessionNoteWithContext = {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  appointmentId: string
  userId: string
  appointment: {
    scheduledAt: Date
    durationMinutes: number
    modality: string
    patient: {
      id: string
      name: string
    }
  }
}

export type SessionNoteListItem = {
  id: string
  content: string
  createdAt: Date
  appointment: {
    scheduledAt: Date
  }
}

// Tipo de retorno das Server Actions
export type NoteActionResult =
  | { success: true; noteId: string }
  | { error: string }
