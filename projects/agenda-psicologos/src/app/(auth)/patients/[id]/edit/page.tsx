import { notFound } from "next/navigation"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getPatientById } from "@/features/patients/queries/getPatientById"
import { PatientFormPage } from "@/features/patients/components/PatientFormPage"

interface EditPatientPageProps {
  params: { id: string }
}

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const user = await getCurrentUser()
  const patient = await getPatientById(user.id, params.id)

  if (!patient) {
    notFound()
  }

  return <PatientFormPage mode="edit" isAtLimit={false} patient={patient} />
}
