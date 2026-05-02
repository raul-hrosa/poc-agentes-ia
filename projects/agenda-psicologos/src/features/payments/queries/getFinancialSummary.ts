import { prisma } from "@/shared/lib/prisma"
import type { FinancialSummary } from "@/features/payments/types"

export async function getFinancialSummary(
  userId: string,
  year: number,
  month: number
): Promise<FinancialSummary> {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const payments = await prisma.sessionPayment.findMany({
    where: {
      userId,
      appointment: {
        scheduledAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    },
    select: { amountCents: true, status: true },
  })

  const totalPaidCents = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amountCents, 0)

  const totalPendingCents = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amountCents, 0)

  const sessionCount = payments.length

  const pendingCount = payments.filter((p) => p.status === "pending").length

  return { totalPaidCents, totalPendingCents, sessionCount, pendingCount }
}
