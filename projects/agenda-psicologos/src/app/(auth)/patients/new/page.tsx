import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { countActivePatients } from "@/features/patients/queries/countActivePatients"
import { MAX_FREE_PATIENTS } from "@/features/patients/schema"
import { PatientFormPage } from "@/features/patients/components/PatientFormPage"
import { prisma } from "@/shared/lib/prisma"

export default async function NewPatientPage() {
  const user = await getCurrentUser()

  const [count, dbUser] = await Promise.all([
    countActivePatients(user.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    }),
  ])

  const plan = dbUser?.plan ?? "free"
  const isAtLimit = plan === "free" && count >= MAX_FREE_PATIENTS

  return <PatientFormPage mode="create" isAtLimit={isAtLimit} />
}
