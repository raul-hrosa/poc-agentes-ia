import { notFound } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getAppointmentById } from "@/features/appointments/queries/getAppointmentById"
import { AppointmentDetails } from "@/features/appointments/components/AppointmentDetails"
import { AppointmentPaymentSection } from "@/features/payments/components/AppointmentPaymentSection"
import { ReminderSection } from "@/features/reminders/components/ReminderSection"

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

        {/* Seção de lembrete — antes das ações de status */}
        <div className="mt-4">
          <ReminderSection appointmentId={appointment.id} userId={user.id} />
        </div>

        {/* Seção de pagamento — visível apenas para consultas realizadas (AC-13) */}
        <div className="mt-4">
          <AppointmentPaymentSection
            appointmentId={appointment.id}
            userId={user.id}
            appointmentStatus={appointment.status}
            patientName={appointment.patientName}
            scheduledAt={appointment.scheduledAt}
            durationMinutes={appointment.durationMinutes}
          />
        </div>
      </div>
    </div>
  )
}
