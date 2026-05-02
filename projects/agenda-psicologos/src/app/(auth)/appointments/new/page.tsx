import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm"

interface NewAppointmentPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function NewAppointmentPage({
  searchParams,
}: NewAppointmentPageProps) {
  const user = await getCurrentUser()
  const { date } = await searchParams

  const patients = await prisma.patient.findMany({
    where: { userId: user.id, isActive: true, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return <AppointmentForm patients={patients} defaultDate={date} />
}
