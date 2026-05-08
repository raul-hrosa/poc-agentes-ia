"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import type { AppointmentWithTokenStatus } from "@/features/appointments/types"
import { cancelAppointment } from "@/features/appointments/actions/cancelAppointment"

const MAX_REASON_LENGTH = 500

interface CancelDialogProps {
  appointment: AppointmentWithTokenStatus
  onClose: () => void
  onCancelled: () => void
}

/**
 * Dialog de confirmação de cancelamento de consulta.
 * Exibe contexto (paciente + data/hora) e campo opcional para motivo (AC-06).
 * maxLength=500 com contador de caracteres restantes (AC-06).
 * Erro inline quando cancelamento falha (AC-10).
 */
export function CancelDialog({
  appointment,
  onClose,
  onCancelled,
}: CancelDialogProps) {
  const [cancellationReason, setCancellationReason] = useState("")
  const [isPending, setIsPending] = useState(false)

  const startTime = new Date(appointment.scheduledAt)
  const formattedDate = format(startTime, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
  const formattedTime = format(startTime, "HH:mm")
  const charsRemaining = MAX_REASON_LENGTH - cancellationReason.length

  async function handleConfirm() {
    setIsPending(true)
    try {
      await cancelAppointment({
        appointmentId: appointment.id,
        cancellationReason: cancellationReason.trim() || undefined,
      })
      toast.success("Consulta cancelada")
      onCancelled()
    } catch {
      toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
      setIsPending(false)
    }
  }

  return (
    <>
      {/* Overlay sobre o painel de detalhes */}
      <div
        className="fixed inset-0 z-60 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-6 shadow-xl"
      >
        <h2
          id="cancel-dialog-title"
          className="text-base font-semibold text-foreground"
        >
          Cancelar consulta
        </h2>

        {/* Contexto da consulta (AC-06) */}
        <div className="mt-3 rounded-md bg-secondary px-3 py-3">
          <p className="text-sm font-medium text-foreground">
            {appointment.patientName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {formattedDate} às {formattedTime}
          </p>
        </div>

        {/* Campo de motivo (opcional — AC-06) */}
        <div className="mt-4">
          <label
            htmlFor="cancellation-reason"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Motivo do cancelamento{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            id="cancellation-reason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Descreva o motivo..."
            rows={3}
            maxLength={MAX_REASON_LENGTH}
            disabled={isPending}
            className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-secondary disabled:text-muted-foreground resize-none"
          />
          {/* Contador de caracteres restantes (AC-06) */}
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {charsRemaining} caracteres restantes
          </p>
        </div>

        {/* Botões */}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
          >
            {isPending ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </div>
      </div>
    </>
  )
}
