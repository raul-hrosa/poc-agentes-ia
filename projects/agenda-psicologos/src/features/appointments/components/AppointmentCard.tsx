"use client"

import { format } from "date-fns"
import type { AppointmentWithPatient } from "@/features/appointments/types"
import { StatusBadge } from "./StatusBadge"

interface AppointmentCardProps {
  appointment: AppointmentWithPatient
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

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const startTime = format(new Date(appointment.scheduledAt), "HH:mm")
  const patientName = abbreviateName(appointment.patient.name)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md bg-white border border-gray-200 px-2 py-1.5 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset min-h-[44px] min-w-[44px] flex flex-col gap-0.5"
      aria-label={`Consulta de ${patientName} às ${startTime}`}
    >
      <span className="text-xs font-semibold text-gray-800">{startTime}</span>
      <span className="text-xs text-gray-700 truncate leading-tight">
        {patientName}
      </span>
      <StatusBadge status={appointment.status} />
    </button>
  )
}
