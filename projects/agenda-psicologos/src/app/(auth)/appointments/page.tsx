import { startOfWeek, addDays, parseISO, isValid } from "date-fns"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getAppointmentsForWeek } from "@/features/appointments/queries/getAppointmentsForWeek"
import { getPatientAppointments } from "@/features/appointments/queries/getPatientAppointments"
import { WeeklyCalendar } from "@/features/appointments/components/WeeklyCalendar"
import type { AppointmentWithPatient } from "@/features/appointments/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AppointmentsPageProps {
  searchParams: {
    week?: string
    patient?: string
  }
}

/**
 * Calcula o início da semana (segunda-feira 00:00:00) a partir de um parâmetro
 * opcional no formato YYYY-MM-DD. Se ausente ou inválido, usa a semana atual.
 */
function resolveWeekStart(weekParam?: string): Date {
  if (weekParam) {
    const parsed = parseISO(weekParam)
    if (isValid(parsed)) {
      return startOfWeek(parsed, { weekStartsOn: 1 })
    }
  }
  return startOfWeek(new Date(), { weekStartsOn: 1 })
}

export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const user = await getCurrentUser()

  // Modo de listagem de paciente: exibe histórico de consultas em ordem decrescente
  if (searchParams.patient) {
    const patientId = searchParams.patient
    const appointments = await getPatientAppointments(user.id, patientId)

    return (
      <PatientAppointmentsList
        appointments={appointments}
        patientName={
          appointments[0]?.patient.name ?? "Paciente"
        }
      />
    )
  }

  // Modo semanal padrão
  const weekStart = resolveWeekStart(searchParams.week)
  const weekEnd = addDays(weekStart, 6)
  const appointments = await getAppointmentsForWeek(user.id, weekStart, weekEnd)

  return (
    <WeeklyCalendar appointments={appointments} weekStart={weekStart} />
  )
}

interface PatientAppointmentsListProps {
  appointments: AppointmentWithPatient[]
  patientName: string
}

function PatientAppointmentsList({
  appointments,
  patientName,
}: PatientAppointmentsListProps) {
  return (
    <div className="min-h-screen bg-secondary">
      <div className="bg-background border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-foreground">
            Consultas de {patientName}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma consulta registrada para este paciente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-lg bg-background border border-border px-4 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(
                        new Date(appointment.scheduledAt),
                        "EEEE, d 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(appointment.scheduledAt), "HH:mm")} •{" "}
                      {appointment.durationMinutes} min •{" "}
                      {appointment.modality === "in_person"
                        ? "Presencial"
                        : "Online"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {/* StatusBadge inline para evitar import client em server component */}
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Badge de status simplificado (Server Component — sem "use client")
function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentWithPatient["status"]
}) {
  const config: Record<
    string,
    { label: string; className: string; lineThrough?: boolean }
  > = {
    scheduled: { label: "agendada", className: "bg-primary/10 text-primary" },
    confirmed: { label: "confirmada", className: "bg-green-100 text-green-700" },
    completed: { label: "realizada", className: "bg-secondary text-secondary-foreground" },
    cancelled: {
      label: "cancelada",
      className: "bg-red-100 text-red-700",
      lineThrough: true,
    },
    no_show: { label: "falta", className: "bg-muted text-muted-foreground" },
  }

  const c = config[status] ?? config.scheduled

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.className}`}
      style={c.lineThrough ? { textDecoration: "line-through" } : undefined}
    >
      {c.label}
    </span>
  )
}
