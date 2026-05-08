import type {
  AppointmentWithTokenStatus,
  CancellationOrigin,
} from "@/features/appointments/types"

interface AppointmentStatusBadgeProps {
  status: AppointmentWithTokenStatus["status"]
  cancellationOrigin: CancellationOrigin
}

/**
 * Badge de apresentação pura que exibe o status da consulta com indicação
 * da origem do cancelamento quando aplicável.
 *
 * scheduled      → null (sem badge)
 * confirmed      → "Confirmada pelo paciente" (verde)
 * cancelled+patient → "Cancelada pelo paciente" (vermelho)
 * cancelled+psychologist → "Cancelada pelo psicólogo" (vermelho)
 * completed      → "Realizada" (azul neutro)
 * no_show        → "Falta" (laranja)
 */
export function AppointmentStatusBadge({
  status,
  cancellationOrigin,
}: AppointmentStatusBadgeProps) {
  if (status === "scheduled") {
    return null
  }

  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        Confirmada pelo paciente
      </span>
    )
  }

  if (status === "cancelled") {
    if (cancellationOrigin === "patient") {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 border border-red-200">
          Cancelada pelo paciente
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border">
        Cancelada pelo psicólogo
      </span>
    )
  }

  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground border border-border">
        Realizada
      </span>
    )
  }

  if (status === "no_show") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border">
        Falta
      </span>
    )
  }

  return null
}
