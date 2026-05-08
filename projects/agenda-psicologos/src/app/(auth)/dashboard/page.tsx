import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/shared/lib/auth"
import { DashboardTodaySkeleton } from "@/features/dashboard/components/DashboardTodaySkeleton"
import { DashboardPendingSkeleton } from "@/features/dashboard/components/DashboardPendingSkeleton"
import { DashboardSummarySkeleton } from "@/features/dashboard/components/DashboardSummarySkeleton"
import { TodayAppointmentsSection } from "@/features/dashboard/components/TodayAppointmentsSection"
import { PendingConfirmationSection } from "@/features/dashboard/components/PendingConfirmationSection"
import { WeeklySummarySection } from "@/features/dashboard/components/WeeklySummarySection"

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
      <Suspense fallback={<DashboardTodaySkeleton />}>
        <TodayAppointmentsSection userId={userId} today={today} />
      </Suspense>

      {/* Seção 2 — Aguardando confirmação */}
      <Suspense fallback={<DashboardPendingSkeleton />}>
        <PendingConfirmationSection userId={userId} />
      </Suspense>

      {/* Seção 3 — Resumo da semana */}
      <Suspense fallback={<DashboardSummarySkeleton />}>
        <WeeklySummarySection userId={userId} weekStart={weekStart} />
      </Suspense>
    </div>
  )
}
