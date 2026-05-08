import Link from "next/link"
import { getDayAppointments } from "@/features/appointments/queries/getDayAppointments"
import { AppointmentStatusBadge } from "@/features/appointments/components/AppointmentStatusBadge"

function formatTimeHHmm(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

interface TodayAppointmentsSectionProps {
  userId: string
  today: Date
}

export async function TodayAppointmentsSection({
  userId,
  today,
}: TodayAppointmentsSectionProps) {
  const todayAppointments = await getDayAppointments(userId, today)

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-base font-semibold">Agenda de hoje</h2>
      </div>
      <div className="p-4">
        {todayAppointments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <svg
              className="h-10 w-10 text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="font-medium">Sem consultas hoje</p>
            <Link
              href="/appointments"
              className="text-sm text-primary hover:underline min-h-[44px] inline-flex items-center"
            >
              Ver agenda da semana
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {todayAppointments.map((appointment) => (
              <Link
                key={appointment.id}
                href={`/appointments/${appointment.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors min-h-[44px]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {appointment.patientName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeHHmm(new Date(appointment.scheduledAt))}
                  </span>
                </div>
                <AppointmentStatusBadge
                  status={appointment.status}
                  cancellationOrigin={appointment.cancellationOrigin}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
