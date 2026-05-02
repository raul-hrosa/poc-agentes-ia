import { getSessionPaymentByAppointment } from "@/features/payments/queries/getSessionPaymentByAppointment"
import { AppointmentPaymentSectionClient } from "./AppointmentPaymentSectionClient"

type AppointmentPaymentSectionProps = {
  appointmentId: string
  userId: string
  appointmentStatus: string
  patientName: string
  scheduledAt: Date
  durationMinutes: number
}

export async function AppointmentPaymentSection({
  appointmentId,
  userId,
  appointmentStatus,
  patientName,
  scheduledAt,
  durationMinutes,
}: AppointmentPaymentSectionProps) {
  if (appointmentStatus !== "completed") {
    return null
  }

  const payment = await getSessionPaymentByAppointment(userId, appointmentId)

  return (
    <AppointmentPaymentSectionClient
      appointmentId={appointmentId}
      patientName={patientName}
      scheduledAt={scheduledAt}
      durationMinutes={durationMinutes}
      payment={payment}
    />
  )
}
