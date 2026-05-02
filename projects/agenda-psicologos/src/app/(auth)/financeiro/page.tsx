import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { getFinancialSummary } from "@/features/payments/queries/getFinancialSummary"
import { getSessionPaymentsByPeriod } from "@/features/payments/queries/getSessionPaymentsByPeriod"
import { UpgradeGate } from "@/features/payments/components/UpgradeGate"
import { FinancialDashboard } from "@/features/payments/components/FinancialDashboard"

export default async function FinanceiroPage() {
  const user = await getCurrentUser()

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  })

  if (!dbUser || dbUser.plan !== "pro") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <UpgradeGate />
        </div>
      </div>
    )
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [summary, payments] = await Promise.all([
    getFinancialSummary(user.id, year, month),
    getSessionPaymentsByPeriod(user.id, year, month),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de sessões e recebimentos</p>
        </div>

        <FinancialDashboard
          summary={summary}
          payments={payments}
          userId={user.id}
          initialYear={year}
          initialMonth={month}
        />
      </div>
    </div>
  )
}
