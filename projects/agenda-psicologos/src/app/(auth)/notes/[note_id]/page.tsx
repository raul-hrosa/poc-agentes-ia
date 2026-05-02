import { notFound } from "next/navigation"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getSessionNoteById } from "@/features/notes/queries/getSessionNoteById"
import { SessionNoteView } from "@/features/notes/components/SessionNoteView"

interface NotePageProps {
  params: Promise<{ note_id: string }>
}

export default async function NotePage({ params }: NotePageProps) {
  const user = await getCurrentUser()
  const { note_id } = await params

  const note = await getSessionNoteById(user.id, note_id)

  if (!note) {
    notFound()
  }

  return <SessionNoteView note={note} />
}
