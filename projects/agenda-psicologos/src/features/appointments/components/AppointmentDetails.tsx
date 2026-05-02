"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, addMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import type { AppointmentWithPatient } from "@/features/appointments/types"
import { StatusBadge } from "./StatusBadge"
import { CancelDialog } from "./CancelDialog"
import { completeAppointment } from "@/features/appointments/actions/completeAppointment"
import { markNoShow } from "@/features/appointments/actions/markNoShow"

interface AppointmentDetailsProps {
  appointment: AppointmentWithPatient & { hasNote: boolean; noteId?: string }
}

/**
 * Componente de detalhes completos de uma consulta exibido como página.
 * Equivalente ao AppointmentDetailPanel mas sem sheet — página inteira (Tela 3 da spec).
 */
export function AppointmentDetails({ appointment }: AppointmentDetailsProps) {
  const router = useRouter()
  const [isPendingComplete, setIsPendingComplete] = useState(false)
  const [isPendingNoShow, setIsPendingNoShow] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const startTime = new Date(appointment.scheduledAt)
  const endTime = addMinutes(startTime, appointment.durationMinutes)
  const dateLabel = format(startTime, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
  const timeLabel = `${format(startTime, "HH:mm")} – ${format(endTime, "HH:mm")}`

  const isActive =
    appointment.status === "scheduled" || appointment.status === "confirmed"
  const isCompleted = appointment.status === "completed"
  const isTerminal =
    appointment.status === "cancelled" || appointment.status === "no_show"

  async function handleComplete() {
    setIsPendingComplete(true)
    try {
      await completeAppointment({ appointmentId: appointment.id })
      toast.success("Consulta marcada como realizada")
      router.refresh()
    } catch {
      toast.error("Não foi possível marcar a consulta como realizada.")
    } finally {
      setIsPendingComplete(false)
    }
  }

  async function handleNoShow() {
    setIsPendingNoShow(true)
    try {
      await markNoShow({ appointmentId: appointment.id })
      toast.success("Falta registrada")
      router.refresh()
    } catch {
      toast.error("Não foi possível registrar a falta.")
    } finally {
      setIsPendingNoShow(false)
    }
  }

  return (
    <>
      <div className="rounded-xl bg-white shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <h1 className="text-lg font-semibold text-gray-900">
            Detalhes da consulta
          </h1>
        </div>

        {/* Informações */}
        <div className="px-6 py-5 space-y-5">
          {/* Paciente */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Paciente
            </p>
            <a
              href={`/patients/${appointment.patient.id}`}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {appointment.patient.name}
            </a>
          </div>

          {/* Data e horário */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Data e horário
            </p>
            <p className="text-sm text-gray-900 capitalize">{dateLabel}</p>
            <p className="text-sm text-gray-600">{timeLabel}</p>
          </div>

          {/* Modalidade e local */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Modalidade
            </p>
            <p className="text-sm text-gray-900">
              {appointment.modality === "in_person" ? "Presencial" : "Online"}
            </p>
            {appointment.location && (
              <p className="text-sm text-gray-600 mt-0.5">
                {appointment.location}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Status
            </p>
            <StatusBadge status={appointment.status} />
          </div>
        </div>

        {/* Ações conforme status (RN-03, RN-04) */}
        {isActive && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-3">
            <button
              type="button"
              onClick={handleComplete}
              disabled={isPendingComplete || isPendingNoShow}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]"
            >
              {isPendingComplete ? "Salvando..." : "Marcar como realizada"}
            </button>

            <button
              type="button"
              onClick={handleNoShow}
              disabled={isPendingComplete || isPendingNoShow}
              className="w-full rounded-lg bg-orange-100 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px]"
            >
              {isPendingNoShow ? "Salvando..." : "Marcar como no-show"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(`/appointments/${appointment.id}/edit`)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
            >
              Editar consulta
            </button>

            <button
              type="button"
              onClick={() => setCancelDialogOpen(true)}
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
            >
              Cancelar consulta
            </button>
          </div>
        )}

        {/* Ações para consulta realizada (AC-29) */}
        {isCompleted && (
          <div className="border-t border-gray-100 px-6 py-5">
            {appointment.hasNote && appointment.noteId ? (
              <a
                href={`/notes/${appointment.noteId}`}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
              >
                Ver prontuário
              </a>
            ) : (
              <a
                href={`/notes/new?appointment=${appointment.id}`}
                className="flex w-full items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
              >
                Registrar prontuário
              </a>
            )}
          </div>
        )}

        {/* Consulta terminal: apenas badge de status, sem ações (AC-26, AC-30) */}
        {isTerminal && (
          <div className="border-t border-gray-100 px-6 py-4">
            <p className="text-xs text-gray-500 text-center">
              Esta consulta não permite mais ações.
            </p>
          </div>
        )}
      </div>

      {/* Dialog de cancelamento */}
      {cancelDialogOpen && (
        <CancelDialog
          appointment={appointment}
          onClose={() => setCancelDialogOpen(false)}
          onCancelled={() => {
            setCancelDialogOpen(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
