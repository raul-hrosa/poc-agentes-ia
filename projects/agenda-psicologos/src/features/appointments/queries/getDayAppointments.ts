import { prisma } from "@/shared/lib/prisma"
import {
  AppointmentWithTokenStatus,
  CancellationOrigin,
} from "../types"
import { computeCancellationOrigin } from "./getAppointmentsForWeek"

type TokenRow = {
  action: string | null
  usedAt: Date | null
  expiresAt: Date
}

/**
 * Retorna todas as consultas de um dia específico enriquecidas com dados
 * do token mais recente (AppointmentWithTokenStatus).
 *
 * Parâmetros: userId, date (hora ignorada — range é 00:00:00–23:59:59)
 * WHERE: userId, scheduledAt >= início do dia, scheduledAt <= fim do dia, deletedAt IS NULL
 * ORDER BY: scheduledAt ASC
 * INCLUDE: patient (id, name), appointmentTokens (mais recente)
 */
export async function getDayAppointments(
  userId: string,
  date: Date
): Promise<AppointmentWithTokenStatus[]> {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const rows = await prisma.appointment.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: dayStart,
        lte: dayEnd,
      },
      deletedAt: null,
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      patient: {
        select: { id: true, name: true },
      },
      appointmentTokens: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { action: true, usedAt: true, expiresAt: true },
      },
    },
  })

  return rows.map((row) => {
    const latestTokenRow: TokenRow | null = row.appointmentTokens[0] ?? null
    const latestToken = latestTokenRow
      ? {
          action: latestTokenRow.action as "confirmed" | "cancelled" | null,
          usedAt: latestTokenRow.usedAt,
          expiresAt: latestTokenRow.expiresAt,
        }
      : null

    const cancellationOrigin: CancellationOrigin = computeCancellationOrigin(
      row.status,
      latestTokenRow
    )

    return {
      id: row.id,
      patientId: row.patientId,
      patientName: row.patient.name,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      modality: row.modality as "in_person" | "online",
      location: row.location,
      status: row.status as AppointmentWithTokenStatus["status"],
      cancellationReason: row.cancellationReason,
      cancellationOrigin,
      latestToken,
    }
  })
}
