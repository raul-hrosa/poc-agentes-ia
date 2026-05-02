import { notFound } from "next/navigation"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { getPatientSessionNotes } from "@/features/notes/queries/getPatientSessionNotes"
import { PatientNotesList } from "@/features/notes/components/PatientNotesList"

interface PatientNotesPageProps {
  params: Promise<{ patient_id: string }>
}

export default async function PatientNotesPage({
  params,
}: PatientNotesPageProps) {
  const user = await getCurrentUser()
  const { patient_id } = await params

  const patient = await prisma.patient.findFirst({
    where: { id: patient_id, userId: user.id, deletedAt: null },
    select: { id: true, name: true },
  })

  if (!patient) {
    notFound()
  }

  const notes = await getPatientSessionNotes(user.id, patient_id)

  return <PatientNotesList patient={patient} notes={notes} />
}
