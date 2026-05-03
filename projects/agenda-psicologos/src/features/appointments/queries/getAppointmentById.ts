import { prisma } from "@/shared/lib/prisma"
import {
  AppointmentWithPatient,
  AppointmentTokenSummary,
  CancellationOrigin,
} from "../types"
import { computeCancellationOrigin } from "./getAppointmentsForWeek"

type AppointmentWithNote = AppointmentWithPatient & {
  hasNote: boolean
  noteId?: string
  latestToken: AppointmentTokenSummary | null
  cancellationOrigin: CancellationOrigin
}

/**
 * Busca uma consulta pelo id validando pertencimento ao psicólogo.
 * WHERE: id = appointmentId AND userId (segurança — AC-35)
 * INCLUDE: patient (id, name, phone), sessionNote (id — para hasNote e noteId),
 *          appointmentTokens (token mais recente — para latestToken e cancellationOrigin)
 * Retorna null se não existir OU pertencer a outro userId.
 */
export async function getAppointmentById(
  userId: string,
  appointmentId: string
): Promise<AppointmentWithNote | null> {
  const row = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    select: {
      id: true,
      userId: true,
      patientId: true,
      scheduledAt: true,
      durationMinutes: true,
      modality: true,
      location: true,
      status: true,
      cancellationReason: true,
      createdAt: true,
      updatedAt: true,
      patient: {
        select: { id: true, name: true, phone: true },
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

  const { sessionNote, appointmentTokens, ...appointment } = row

  const latestTokenRow = appointmentTokens[0] ?? null
  const latestToken: AppointmentTokenSummary | null = latestTokenRow
    ? {
        action: latestTokenRow.action as "confirmed" | "cancelled" | null,
        usedAt: latestTokenRow.usedAt,
        expiresAt: latestTokenRow.expiresAt,
      }
    : null

  const cancellationOrigin = computeCancellationOrigin(
    appointment.status,
    latestTokenRow
  )

  return {
    ...appointment,
    hasNote: sessionNote !== null,
    noteId: sessionNote?.id,
    latestToken,
    cancellationOrigin,
  } as AppointmentWithNote
}
