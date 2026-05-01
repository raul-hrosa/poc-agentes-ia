import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getUserPlan } from "@/features/auth/queries/getUserPlan"
import { countActivePatients } from "@/features/patients/queries/countActivePatients"
import { MAX_FREE_PATIENTS } from "@/features/patients/schema"
import { PatientFormPage } from "@/features/patients/components/PatientFormPage"

export default async function NewPatientPage() {
  const user = await getCurrentUser()

  const [count, plan] = await Promise.all([
    countActivePatients(user.id),
    getUserPlan(user.id),
  ])

  const isAtLimit = plan === "free" && count >= MAX_FREE_PATIENTS

  return <PatientFormPage mode="create" isAtLimit={isAtLimit} />
}
