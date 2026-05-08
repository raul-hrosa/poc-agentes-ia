"use client"

import { format } from "date-fns"
import type { AppointmentWithTokenStatus } from "@/features/appointments/types"
import { AppointmentStatusBadge } from "./AppointmentStatusBadge"

interface AppointmentCardProps {
  appointment: AppointmentWithTokenStatus
  onClick: () => void
}

/**
 * Abrevia o nome do paciente para os primeiros dois nomes.
 * Ex: "Ana Beatriz Silva" → "Ana Beatriz"
 */
function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts.slice(0, 2).join(" ")
}

/**
 * Retorna as classes de estilo do bloco conforme o status da consulta.
 *
 * confirmed → borda e fundo verde sutil
 * cancelled → opacidade reduzida
 * demais    → estilo padrão
 */
function getCardClasses(status: AppointmentWithTokenStatus["status"]): string {
  const base =
    "w-full text-left rounded-md px-2 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset min-h-[44px] min-w-[44px] flex flex-col gap-0.5"

  if (status === "confirmed") {
    return `${base} bg-green-50 border border-green-500 hover:bg-green-100`
  }

  if (status === "cancelled") {
    return `${base} bg-background border border-border hover:bg-secondary opacity-50`
  }

  return `${base} bg-background border border-border hover:bg-secondary`
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const startTime = format(new Date(appointment.scheduledAt), "HH:mm")
  const patientName = abbreviateName(appointment.patientName)

  return (
    <button
      type="button"
      onClick={onClick}
      className={getCardClasses(appointment.status)}
      aria-label={`Consulta de ${patientName} às ${startTime}`}
    >
      <span className="text-xs font-semibold text-foreground">{startTime}</span>
      <span className="text-xs text-foreground truncate leading-tight">
        {patientName}
      </span>
      <AppointmentStatusBadge
        status={appointment.status}
        cancellationOrigin={appointment.cancellationOrigin}
      />
    </button>
  )
}
