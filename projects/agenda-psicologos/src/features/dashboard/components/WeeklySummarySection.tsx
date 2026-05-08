import { getWeeklySummary } from "@/features/dashboard/queries/getDashboardData"

interface WeeklySummarySectionProps {
  userId: string
  weekStart: Date
}

export async function WeeklySummarySection({
  userId,
  weekStart,
}: WeeklySummarySectionProps) {
  const weeklySummary = await getWeeklySummary(userId, weekStart)

  return (
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
  )
}
