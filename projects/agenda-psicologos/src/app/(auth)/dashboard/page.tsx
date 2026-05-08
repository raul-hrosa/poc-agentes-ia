import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/shared/lib/auth"
import { getWeekAppointments } from "@/features/appointments/queries/getWeekAppointments"
import { countActivePatients } from "@/features/patients/queries/countActivePatients"
import { getFinancialSummary } from "@/features/payments/queries/getFinancialSummary"
import { startOfWeek } from "date-fns"

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

const statusLabel: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show: "Falta",
}

const statusClasses: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-orange-100 text-orange-700",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })

  const [weekAppointments, activePatients, financialSummary] = await Promise.all([
    getWeekAppointments(userId, weekStart),
    countActivePatients(userId),
    getFinancialSummary(userId, now.getFullYear(), now.getMonth() + 1),
  ])

  const todayAppointments = weekAppointments.filter((a) => {
    const d = new Date(a.scheduledAt)
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  })

  const upcomingAppointments = weekAppointments
    .filter((a) => new Date(a.scheduledAt) >= now)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Consultas hoje</p>
          <p className="mt-1 text-3xl font-bold">{todayAppointments.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {todayAppointments.length === 0
              ? "Nenhuma consulta agendada"
              : `${todayAppointments.filter((a) => a.status === "confirmed").length} confirmadas`}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pacientes ativos</p>
          <p className="mt-1 text-3xl font-bold">{activePatients}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activePatients === 0 ? "Nenhum paciente cadastrado" : "em atendimento"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pendente este mês</p>
          <p className="mt-1 text-3xl font-bold">
            {formatCurrency(financialSummary.totalPendingCents)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(financialSummary.totalPaidCents)} recebido
          </p>
        </div>
      </div>

      {/* Próximas consultas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Próximas consultas</h2>
          <Link
            href="/appointments"
            className="text-sm text-primary hover:underline"
          >
            Ver agenda completa
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center rounded-xl border border-border">
            <svg className="h-10 w-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">Nenhuma consulta hoje</p>
            <p className="text-sm text-muted-foreground">
              Sua agenda desta semana está vazia.
            </p>
            <Link
              href="/appointments/new"
              className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground transition-opacity hover:opacity-90 min-h-[44px]"
            >
              Agendar consulta
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {upcomingAppointments.map((appointment) => (
              <Link
                key={appointment.id}
                href={`/appointments/${appointment.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors min-h-[44px]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {appointment.patient.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(appointment.scheduledAt).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    &bull; {formatTime(new Date(appointment.scheduledAt))}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusClasses[appointment.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusLabel[appointment.status] ?? appointment.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
