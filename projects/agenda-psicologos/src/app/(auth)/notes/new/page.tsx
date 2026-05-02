import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { getSessionNoteByAppointment } from "@/features/notes/queries/getSessionNoteByAppointment"
import { SessionNoteForm } from "@/features/notes/components/SessionNoteForm"
import { AppointmentNotCompletedError } from "@/features/notes/components/AppointmentNotCompletedError"

interface NewNotePageProps {
  searchParams: Promise<{ appointment?: string }>
}

export default async function NewNotePage({
  searchParams,
}: NewNotePageProps) {
  const user = await getCurrentUser()
  const { appointment: appointmentId } = await searchParams

  if (!appointmentId) {
    notFound()
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      durationMinutes: true,
      modality: true,
      patient: {
        select: { id: true, name: true },
      },
    },
  })

  if (!appointment) {
    notFound()
  }

  if (appointment.status !== "completed") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <AppointmentNotCompletedError appointmentId={appointment.id} />
        </div>
      </div>
    )
  }

  const existingNote = await getSessionNoteByAppointment(user.id, appointmentId)
  if (existingNote) {
    redirect(`/notes/${existingNote.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Registrar prontuário
          </h1>
        </div>
        <SessionNoteForm appointment={appointment} />
      </div>
    </div>
  )
}
