"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, addDays, subDays, addMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AppointmentWithPatient } from "@/features/appointments/types"
import { StatusBadge } from "./StatusBadge"
import { AppointmentDetailPanel } from "./AppointmentDetailPanel"

interface DayViewProps {
  appointments: AppointmentWithPatient[]
  date: Date
}

/**
 * Formata uma data no padrão ISO YYYY-MM-DD para uso em URL.
 */
function toDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/**
 * Formata a data por extenso em pt-BR.
 * Ex: "Quinta-feira, 24 abr 2026"
 */
function formatDayHeader(date: Date): string {
  const weekday = format(date, "EEEE", { locale: ptBR })
  const dayMonth = format(date, "d MMM yyyy", { locale: ptBR })
  // Capitaliza o primeiro caractere do dia da semana
  const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${weekdayCapitalized}, ${dayMonth}`
}

/**
 * Formata horário HH:MM a partir de uma Date.
 */
function formatTime(date: Date): string {
  return format(date, "HH:mm")
}

export function DayView({ appointments, date }: DayViewProps) {
  const router = useRouter()
  const [selectedAppointment, setSelectedAppointment] =
    useState<(AppointmentWithPatient & { hasNote: boolean }) | null>(null)

  const prevDayParam = toDateParam(subDays(date, 1))
  const nextDayParam = toDateParam(addDays(date, 1))
  const currentDateParam = toDateParam(date)

  function handleViewDetails(appointment: AppointmentWithPatient) {
    setSelectedAppointment({
      ...appointment,
      hasNote: appointment.hasNote ?? false,
    })
  }

  function handleClosePanel() {
    setSelectedAppointment(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => router.push(`/appointments/day/${prevDayParam}`)}
              className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              aria-label="Dia anterior"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <h1 className="text-base font-semibold text-gray-900 text-center">
              {formatDayHeader(date)}
            </h1>

            <button
              type="button"
              onClick={() => router.push(`/appointments/day/${nextDayParam}`)}
              className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              aria-label="Próximo dia"
            >
              <span className="hidden sm:inline">Próximo</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {appointments.length === 0 ? (
          /* Estado vazio (AC-08) */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="h-12 w-12 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 text-sm mb-4">
              Nenhuma consulta nesta data.
            </p>
            <button
              type="button"
              onClick={() =>
                router.push(`/appointments/new?date=${currentDateParam}`)
              }
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
            >
              Agendar consulta para este dia
            </button>
          </div>
        ) : (
          /* Lista de consultas em ordem cronológica (AC-07) */
          <div className="space-y-3">
            {appointments.map((appointment) => {
              const startTime = new Date(appointment.scheduledAt)
              const endTime = addMinutes(startTime, appointment.durationMinutes)

              return (
                <div
                  key={appointment.id}
                  className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Horário */}
                      <div className="shrink-0 text-sm font-medium text-gray-900 min-w-[80px]">
                        {formatTime(startTime)} – {formatTime(endTime)}
                      </div>

                      {/* Dados principais */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {appointment.patient.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {appointment.modality === "in_person"
                            ? "Presencial"
                            : "Online"}
                          {appointment.location
                            ? ` • ${appointment.location}`
                            : ""}
                        </p>
                      </div>

                      {/* Badge */}
                      <div className="shrink-0">
                        <StatusBadge status={appointment.status} />
                      </div>
                    </div>

                    {/* Botão Ver detalhes */}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(appointment)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px]"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Rodapé: agendar neste dia */}
      {appointments.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() =>
                router.push(`/appointments/new?date=${currentDateParam}`)
              }
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
            >
              Agendar neste dia
            </button>
          </div>
        </div>
      )}

      {/* Painel de detalhes */}
      {selectedAppointment && (
        <AppointmentDetailPanel
          appointment={selectedAppointment}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
