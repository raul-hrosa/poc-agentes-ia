import { notFound } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"
import { AppointmentDetails } from "@/features/appointments/components/AppointmentDetails"

interface AppointmentPageProps {
  params: { id: string }
}

export default async function AppointmentPage({
  params,
}: AppointmentPageProps) {
  const user = await getCurrentUser()
  const appointment = await getAppointmentById(user.id, params.id)

  if (!appointment) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Link Voltar */}
        <div className="mb-4">
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <span aria-hidden="true">←</span> Voltar
          </Link>
        </div>

        <AppointmentDetails appointment={appointment} />
      </div>
    </div>
  )
}
