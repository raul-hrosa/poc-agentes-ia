import { notFound } from "next/navigation"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"
import { prisma } from "@/shared/lib/prisma"
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm"

const TERMINAL_STATUSES = ["completed", "cancelled", "no_show"] as const

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

  if (
    TERMINAL_STATUSES.includes(
      appointment.status as (typeof TERMINAL_STATUSES)[number]
    )
  ) {
    return (
      <div className="mx-auto max-w-lg w-full px-4 py-6">
        <div
          role="alert"
          className="rounded-md bg-yellow-50 border border-yellow-200 p-4"
        >
          <p className="text-sm text-yellow-800">
            Consultas finalizadas não podem ser editadas.
          </p>
          <a
            href={`/appointments/${id}`}
            className="mt-2 inline-block text-sm font-medium text-yellow-900 underline min-h-[44px] flex items-center"
          >
            Voltar para a consulta
          </a>
        </div>
      </div>
    )
  }

  const patients = await prisma.patient.findMany({
    where: { userId: user.id, isActive: true, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return <AppointmentForm patients={patients} appointment={appointment} />
}
