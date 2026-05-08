import { prisma } from "@/shared/lib/prisma"

/**
 * Retorna a contagem de consultas agendadas nos próximos 7 dias que ainda
 * não foram confirmadas pelo paciente.
 *
 * Critérios:
 * - userId igual ao do usuário autenticado
 * - status = "scheduled"
 * - scheduledAt entre agora e 7 dias a partir de agora
 * - nenhum token com action = "confirmed" e usedAt definido
 */
export async function getPendingConfirmationCount(
  userId: string
): Promise<number> {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  return prisma.appointment.count({
    where: {
      userId,
      status: "scheduled",
      scheduledAt: { gte: now, lte: sevenDaysFromNow },
      appointmentTokens: {
        none: {
          action: "confirmed",
          usedAt: { not: null },
        },
      },
    },
  })
}

/**
 * Retorna o resumo semanal de consultas: total, confirmadas e canceladas.
 *
 * Filtra pelo período de weekStart até weekStart + 6 dias às 23:59:59.
 * Usa três counts separados para evitar N+1.
 */
export async function getWeeklySummary(
  userId: string,
  weekStart: Date
): Promise<{ total: number; confirmed: number; cancelled: number }> {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [total, confirmed, cancelled] = await Promise.all([
    prisma.appointment.count({
      where: {
        userId,
        scheduledAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        userId,
        status: "confirmed",
        scheduledAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        userId,
        status: "cancelled",
        scheduledAt: { gte: weekStart, lte: weekEnd },
      },
    }),
  ])

  return { total, confirmed, cancelled }
}
