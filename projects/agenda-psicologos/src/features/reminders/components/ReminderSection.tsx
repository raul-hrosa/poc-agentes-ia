import { getAppointmentForReminder } from "@/features/reminders/queries/getAppointmentForReminder"
import { ReminderSectionClient } from "./ReminderSectionClient"

interface ReminderSectionProps {
  appointmentId: string
  userId: string
}

export async function ReminderSection({
  appointmentId,
  userId,
}: ReminderSectionProps) {
  const appointment = await getAppointmentForReminder(appointmentId, userId)

  if (!appointment) {
    return null
  }

  const isTerminal =
    appointment.status === "completed" ||
    appointment.status === "cancelled" ||
    appointment.status === "no_show"

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900">Lembrete</h2>
      </div>
      <div className="px-6 py-5">
        <ReminderSectionClient
          appointmentId={appointmentId}
          patientEmail={appointment.patient.email}
          latestReminder={appointment.latestReminder}
          appointmentStatus={appointment.status}
          isTerminal={isTerminal}
        />
      </div>
    </div>
  )
}
