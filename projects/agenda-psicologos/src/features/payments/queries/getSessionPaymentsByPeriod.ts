import { prisma } from "@/shared/lib/prisma"
import type { SessionPaymentWithContext } from "@/features/payments/types"

export async function getSessionPaymentsByPeriod(
  userId: string,
  year: number,
  month: number,
  statusFilter?: "all" | "paid" | "pending"
): Promise<SessionPaymentWithContext[]> {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const payments = await prisma.sessionPayment.findMany({
    where: {
      userId,
      appointment: {
        scheduledAt: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
    },
    include: {
      appointment: {
        select: {
          scheduledAt: true,
          durationMinutes: true,
          patient: { select: { name: true } },
        },
      },
    },
    orderBy: { appointment: { scheduledAt: "desc" } },
  })

  return payments as SessionPaymentWithContext[]
}
