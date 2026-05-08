import { notFound } from "next/navigation"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"
import { prisma } from "@/shared/lib/prisma"
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm"

interface EditAppointmentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAppointmentPage({
  params,
}: EditAppointmentPageProps) {
  const user = await getCurrentUser()
  const { id } = await params

  const appointment = await getAppointmentById(user.id, id)

  if (!appointment) {
    notFound()
  }

  const patients = await prisma.patient.findMany({
    where: { userId: user.id, isActive: true, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return <AppointmentForm patients={patients} appointment={appointment} />
}
