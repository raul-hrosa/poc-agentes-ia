import { prisma } from "@/shared/lib/prisma"
import { AppointmentWithPatient } from "../types"

/**
 * Verifica se existe conflito de horário para um intervalo dado.
 *
 * Estratégia: busca todas as consultas do dia de scheduledAt com status != cancelled,
 * deletedAt IS NULL, e filtra em JS com a lógica de sobreposição (RN-02):
 *   existente.scheduledAt < novoFim && addMinutes(existente.scheduledAt, existente.durationMinutes) > scheduledAt
 *
 * Parâmetros:
 *   userId         — psicólogo
 *   scheduledAt    — início do novo intervalo
 *   durationMinutes — duração em minutos do novo intervalo
 *   excludeId?     — ID da consulta a excluir da verificação (ao editar)
 *
 * Retorna: AppointmentWithPatient[] (vazio = sem conflito)
 */
export async function getConflictingAppointments(
  userId: string,
  scheduledAt: Date,
  durationMinutes: number,
  excludeId?: string
): Promise<AppointmentWithPatient[]> {
  const newEnd = addMinutes(scheduledAt, durationMinutes)

  const dayStart = new Date(scheduledAt)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(scheduledAt)
  dayEnd.setHours(23, 59, 59, 999)

  const candidates = await prisma.appointment.findMany({
    where: {
      userId,
      status: { not: "cancelled" },
      deletedAt: null,
      scheduledAt: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
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
    },
  })

  const conflicts = candidates.filter((existing) => {
    if (excludeId && existing.id === excludeId) return false

    const existingEnd = addMinutes(existing.scheduledAt, existing.durationMinutes)

    return existing.scheduledAt < newEnd && existingEnd > scheduledAt
  })

  return conflicts as AppointmentWithPatient[]
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}
