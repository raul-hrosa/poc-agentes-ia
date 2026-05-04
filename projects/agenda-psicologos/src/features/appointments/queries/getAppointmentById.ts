import { prisma } from "@/shared/lib/prisma"
import {
  AppointmentWithTokenStatus,
  AppointmentTokenSummary,
  CancellationOrigin,
} from "../types"
import { computeCancellationOrigin } from "./getAppointmentsForWeek"

export type AppointmentDetails = AppointmentWithTokenStatus & {
  hasNote: boolean
  noteId?: string
}

/**
 * Busca uma consulta pelo id validando pertencimento ao psicólogo.
 * WHERE: id = appointmentId AND userId (segurança — AC-35)
 * INCLUDE: patient (id, name), sessionNote (id — para hasNote e noteId),
 *          appointmentTokens (token mais recente — para latestToken e cancellationOrigin)
 * Retorna null se não existir OU pertencer a outro userId.
 */
export async function getAppointmentById(
  userId: string,
  appointmentId: string
): Promise<AppointmentDetails | null> {
  const row = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    select: {
      id: true,
      patientId: true,
      scheduledAt: true,
      durationMinutes: true,
      modality: true,
      location: true,
      status: true,
      cancellationReason: true,
      patient: {
        select: { id: true, name: true },
      },
      sessionNote: {
        select: { id: true },
      },
      appointmentTokens: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { action: true, usedAt: true, expiresAt: true },
      },
    },
  })

  if (!row) return null

  const { sessionNote, appointmentTokens, patient, ...appointment } = row

  const latestTokenRow = appointmentTokens[0] ?? null
  const latestToken: AppointmentTokenSummary | null = latestTokenRow
    ? {
        action: latestTokenRow.action as "confirmed" | "cancelled" | null,
        usedAt: latestTokenRow.usedAt,
        expiresAt: latestTokenRow.expiresAt,
      }
    : null

  const cancellationOrigin: CancellationOrigin = computeCancellationOrigin(
    appointment.status,
    latestTokenRow
  )

  return {
    ...appointment,
    patientId: patient.id,
    patientName: patient.name,
    modality: appointment.modality as "in_person" | "online",
    status: appointment.status as AppointmentWithTokenStatus["status"],
    hasNote: sessionNote !== null,
    noteId: sessionNote?.id,
    latestToken,
    cancellationOrigin,
  }
}
