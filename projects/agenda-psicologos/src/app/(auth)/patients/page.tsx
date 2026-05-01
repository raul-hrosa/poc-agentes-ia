import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getActivePatients } from "@/features/patients/queries/getActivePatients"
import { getArchivedPatients } from "@/features/patients/queries/getArchivedPatients"
import { PatientsPage } from "@/features/patients/components/PatientsPage"

export default async function Page() {
  const user = await getCurrentUser()
  const [active, archived] = await Promise.all([
    getActivePatients(user.id),
    getArchivedPatients(user.id),
  ])
  return <PatientsPage activePatients={active} archivedPatients={archived} />
}
