"use server"

import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { getFinancialSummary } from "@/features/payments/queries/getFinancialSummary"
import { getSessionPaymentsByPeriod } from "@/features/payments/queries/getSessionPaymentsByPeriod"
import type { FinancialSummary, SessionPaymentWithContext } from "@/features/payments/types"

type GetFinancialDataResult = {
  summary: FinancialSummary
  payments: SessionPaymentWithContext[]
}

export async function getFinancialDataForPeriod(
  userId: string,
  year: number,
  month: number,
  statusFilter: "all" | "paid" | "pending"
): Promise<GetFinancialDataResult> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Não autenticado")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  })

  if (!dbUser || dbUser.plan !== "pro") {
    throw new Error("Plano pro necessário")
  }

  const [summary, payments] = await Promise.all([
    getFinancialSummary(userId, year, month),
    getSessionPaymentsByPeriod(userId, year, month, statusFilter),
  ])

  return { summary, payments }
}
