import { notFound } from "next/navigation"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getPatientById } from "@/features/patients/queries/getPatientById"
import { PatientProfilePage } from "@/features/patients/components/PatientProfilePage"

interface PatientPageProps {
  params: { id: string }
}

export default async function PatientPage({ params }: PatientPageProps) {
  const user = await getCurrentUser()
  const patient = await getPatientById(user.id, params.id)

  if (!patient) {
    notFound()
  }

  return <PatientProfilePage patient={patient!} />
}
