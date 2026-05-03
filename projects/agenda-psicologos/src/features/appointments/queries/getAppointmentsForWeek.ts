import { prisma } from "@/shared/lib/prisma"
import {
  AppointmentWithTokenStatus,
  CancellationOrigin,
} from "../types"

type TokenRow = {
  action: string | null
  usedAt: Date | null
  expiresAt: Date
}

function computeCancellationOrigin(
  status: string,
  latestToken: TokenRow | null
): CancellationOrigin {
  if (status !== "cancelled") return null

  if (
    latestToken !== null &&
    latestToken.action === "cancelled" &&
    latestToken.usedAt !== null
  ) {
    return "patient"
  }

  return "psychologist"
}

/**
 * Retorna as consultas de uma semana para um psicólogo, enriquecidas com
 * dados do token mais recente (AppointmentWithTokenStatus).
 *
 * Parâmetros:
 *   userId    — id do psicólogo autenticado
 *   weekStart — início do período (inclusivo)
 *   weekEnd   — fim do período (inclusivo)
 *
 * WHERE:  userId, scheduledAt >= weekStart, scheduledAt <= weekEnd, deletedAt IS NULL
 * ORDER:  scheduledAt ASC
 * INCLUDE: patient (id, name), appointmentTokens (mais recente, select restrito)
 *
 * A relação appointmentTokens é carregada via include (sem N+1).
 * cancellationOrigin é calculado em memória após a query.
 */
export async function getAppointmentsForWeek(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<AppointmentWithTokenStatus[]> {
  const rows = await prisma.appointment.findMany({
    where: {
      userId,
      scheduledAt: {
        gte: weekStart,
        lte: weekEnd,
      },
      deletedAt: null,
    },
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
    orderBy: { scheduledAt: "asc" },
  })

  return rows.map((row) => {
    const latestTokenRow = row.appointmentTokens[0] ?? null
    const latestToken = latestTokenRow
      ? {
          action: latestTokenRow.action as "confirmed" | "cancelled" | null,
          usedAt: latestTokenRow.usedAt,
          expiresAt: latestTokenRow.expiresAt,
        }
      : null

    const cancellationOrigin = computeCancellationOrigin(
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

export { computeCancellationOrigin }
