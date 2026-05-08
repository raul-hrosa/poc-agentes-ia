"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, addMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import type { AppointmentWithTokenStatus } from "@/features/appointments/types"
import { AppointmentStatusBadge } from "./AppointmentStatusBadge"
import { CancelDialog } from "./CancelDialog"
import { completeAppointment } from "@/features/appointments/actions/completeAppointment"
import { markNoShow } from "@/features/appointments/actions/markNoShow"
import { confirmAppointment } from "@/features/appointments/actions/confirmAppointment"

interface AppointmentDetailsProps {
  appointment: AppointmentWithTokenStatus & { hasNote: boolean; noteId?: string }
}

/**
 * Formata a data e hora em que o paciente respondeu ao token.
 */
function formatTokenResponseLabel(
  appointment: AppointmentWithTokenStatus
): string | null {
  const { status, cancellationOrigin, latestToken } = appointment

  if (!latestToken?.usedAt) return null

  if (status === "confirmed") {
    const formatted = format(new Date(latestToken.usedAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
      locale: ptBR,
    })
    return `Paciente confirmou presença em ${formatted}`
  }

  if (status === "cancelled" && cancellationOrigin === "patient") {
    const formatted = format(new Date(latestToken.usedAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
      locale: ptBR,
    })
    return `Paciente cancelou presença em ${formatted}`
  }

  return null
}

/**
 * Componente de detalhes completos de uma consulta exibido como página.
 * Equivalente ao AppointmentDetailPanel mas sem sheet — página inteira (Tela 3 da spec).
 */
export function AppointmentDetails({ appointment }: AppointmentDetailsProps) {
  const router = useRouter()
  const [isPendingComplete, setIsPendingComplete] = useState(false)
  const [isPendingNoShow, setIsPendingNoShow] = useState(false)
  const [isPendingConfirm, setIsPendingConfirm] = useState(false)
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
      toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
    } finally {
      setIsPendingComplete(false)
    }
  }

  async function handleNoShow() {
    setIsPendingNoShow(true)
    try {
      await markNoShow({ appointmentId: appointment.id })
      toast.success("Marcado como não compareceu")
      router.refresh()
    } catch {
      toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
    } finally {
      setIsPendingNoShow(false)
    }
  }

  async function handleConfirm() {
    setIsPendingConfirm(true)
    try {
      await confirmAppointment({ appointmentId: appointment.id })
      toast.success("Consulta confirmada")
      router.refresh()
    } catch {
      toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
    } finally {
      setIsPendingConfirm(false)
    }
  }

  return (
    <>
      <div className="rounded-xl bg-background shadow-sm border border-border">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <h1 className="text-lg font-semibold text-foreground">
            Detalhes da consulta
          </h1>
        </div>

        {/* Informações */}
        <div className="px-6 py-5 space-y-5">
          {/* Paciente */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Paciente
            </p>
            <a
              href={`/patients/${appointment.patientId}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {appointment.patientName}
            </a>
          </div>

          {/* Data e horário */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Data e horário
            </p>
            <p className="text-sm text-foreground capitalize">{dateLabel}</p>
            <p className="text-sm text-muted-foreground">{timeLabel}</p>
          </div>

          {/* Modalidade e local */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Modalidade
            </p>
            <p className="text-sm text-foreground">
              {appointment.modality === "in_person" ? "Presencial" : "Online"}
            </p>
            {appointment.location && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {appointment.location}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Status
            </p>
            <AppointmentStatusBadge
              status={appointment.status}
              cancellationOrigin={appointment.cancellationOrigin}
            />
            {/* Linha de data/hora da resposta do paciente (AC-01, AC-02) */}
            {formatTokenResponseLabel(appointment) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatTokenResponseLabel(appointment)}
              </p>
            )}
          </div>

          {/* Motivo de cancelamento (AC-14, AC-15) */}
          {appointment.status === "cancelled" &&
            appointment.cancellationReason != null && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Motivo
                </p>
                <p className="text-sm text-foreground">
                  {appointment.cancellationReason}
                </p>
              </div>
            )}
        </div>

        {/* Ações conforme status (RN-03, RN-04) */}
        {isActive && (
          <div className="border-t border-border px-6 py-5 space-y-3">
            {appointment.status === "scheduled" && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPendingConfirm || isPendingComplete || isPendingNoShow}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
              >
                {isPendingConfirm ? "Confirmando..." : "Confirmar consulta"}
              </button>
            )}

            <button
              type="button"
              onClick={handleComplete}
              disabled={isPendingConfirm || isPendingComplete || isPendingNoShow}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 min-h-[44px]"
            >
              {isPendingComplete ? "Salvando..." : "Marcar como realizada"}
            </button>

            <button
              type="button"
              onClick={handleNoShow}
              disabled={isPendingConfirm || isPendingComplete || isPendingNoShow}
              className="w-full rounded-lg bg-orange-100 px-4 py-3 text-sm font-medium text-orange-700 hover:bg-orange-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 min-h-[44px]"
            >
              {isPendingNoShow ? "Salvando..." : "Marcar como no-show"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(`/appointments/${appointment.id}/edit`)
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
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
          <div className="border-t border-border px-6 py-5">
            {appointment.hasNote && appointment.noteId ? (
              <a
                href={`/notes/${appointment.noteId}`}
                className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
              >
                Ver prontuário
              </a>
            ) : (
              <a
                href={`/notes/new?appointment=${appointment.id}`}
                className="flex w-full items-center justify-center rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm font-medium text-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
              >
                Registrar prontuário
              </a>
            )}
          </div>
        )}

        {/* Consulta terminal: nenhuma ação disponível (AC-09, AC-26, AC-30) */}
        {isTerminal && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs text-muted-foreground text-center">
              (nenhuma ação disponível)
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
