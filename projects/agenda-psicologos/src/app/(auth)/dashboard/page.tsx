import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/shared/lib/auth"
import { getDayAppointments } from "@/features/appointments/queries/getDayAppointments"
import {
  getPendingConfirmationCount,
  getWeeklySummary,
} from "@/features/dashboard/queries/getDashboardData"
import { AppointmentStatusBadge } from "@/features/appointments/components/AppointmentStatusBadge"

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia"
  if (hour >= 12 && hour < 18) return "Boa tarde"
  return "Boa noite"
}

function getWeekStart(date: Date): Date {
  const day = date.getDay() // 0 = domingo, 1 = segunda, ...
  const diff = day === 0 ? -6 : 1 - day // dias até a segunda-feira
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function formatTimeHHmm(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function formatDateLong(date: Date): string {
  const formatted = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const userName = session.user.name ?? "Psicólogo(a)"

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = getWeekStart(today)
  const greeting = getGreeting(now.getHours())

  const [todayAppointments, pendingCount, weeklySummary] = await Promise.all([
    getDayAppointments(userId, today),
    getPendingConfirmationCount(userId),
    getWeeklySummary(userId, weekStart),
  ])

  const todayLabel = formatDateLong(today)

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{todayLabel}</p>
      </div>

      {/* Seção 1 — Agenda de hoje */}
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

      {/* Seção 2 — Aguardando confirmação */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Aguardando confirmação</h2>
        </div>
        <div className="p-4">
          {pendingCount > 0 ? (
            <Link
              href="/appointments"
              className="inline-flex items-center bg-amber-100 text-amber-800 rounded-full px-3 py-1 text-sm font-medium hover:bg-amber-200 transition-colors min-h-[44px]"
            >
              {pendingCount}{" "}
              {pendingCount === 1
                ? "consulta aguardando confirmação"
                : "consultas aguardando confirmação"}
            </Link>
          ) : (
            <span className="inline-flex items-center bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">
              Nenhuma consulta aguardando confirmação
            </span>
          )}
        </div>
      </div>

      {/* Seção 3 — Resumo da semana */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Resumo da semana</h2>
        </div>
        <div className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Esta semana</p>
              <p className="mt-1 text-3xl font-bold">{weeklySummary.total}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Confirmadas</p>
              <p className="mt-1 text-3xl font-bold">{weeklySummary.confirmed}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Canceladas</p>
              <p className="mt-1 text-3xl font-bold">{weeklySummary.cancelled}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
