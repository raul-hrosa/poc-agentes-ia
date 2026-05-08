"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  format,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AppointmentWithTokenStatus } from "@/features/appointments/types"
import { AppointmentCard } from "./AppointmentCard"
import { AppointmentDetailPanel } from "./AppointmentDetailPanel"

interface WeeklyCalendarProps {
  appointments: AppointmentWithTokenStatus[]
  weekStart: Date
}

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

/**
 * Formata uma data no padrão ISO YYYY-MM-DD para uso em query params.
 */
function toISODateParam(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/**
 * Formata o intervalo da semana em pt-BR.
 * Ex: "21–27 abr 2026"
 */
function formatWeekRange(start: Date): string {
  const end = addDays(start, 6)

  const startDay = format(start, "d")
  const endDay = format(end, "d")
  const monthYear = format(end, "MMM yyyy", { locale: ptBR })

  return `${startDay}–${endDay} ${monthYear}`
}

export function WeeklyCalendar({ appointments, weekStart }: WeeklyCalendarProps) {
  const router = useRouter()
  const today = new Date()
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithTokenStatus | null>(null)

  const prevWeekParam = toISODateParam(subWeeks(weekStart, 1))
  const nextWeekParam = toISODateParam(addWeeks(weekStart, 1))

  // Gera os 7 dias da semana a partir de weekStart
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Filtra consultas para um dia específico
  function getAppointmentsForDay(day: Date): AppointmentWithTokenStatus[] {
    return appointments.filter((apt) => isSameDay(new Date(apt.scheduledAt), day))
  }

  function handleDayClick(day: Date) {
    router.push(`/appointments/day/${toISODateParam(day)}`)
  }

  function handleAppointmentClick(appointment: AppointmentWithTokenStatus) {
    setSelectedAppointment(appointment)
  }

  const hasAppointments = appointments.length > 0

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
          <button
            type="button"
            onClick={() => router.push("/appointments/new")}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
          >
            <span aria-hidden="true">+</span> Nova Consulta
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Navegação de semana */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <button
            type="button"
            onClick={() => router.push(`/appointments?week=${prevWeekParam}`)}
            className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
            aria-label="Semana anterior"
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground text-center">
              {formatWeekRange(weekStart)}
            </span>
            <button
              type="button"
              onClick={() => router.push("/appointments")}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring min-h-[32px]"
            >
              Hoje
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/appointments?week=${nextWeekParam}`)}
            className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
            aria-label="Próxima semana"
          >
            <span className="hidden sm:inline">Próxima</span>
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

        {/* Estado vazio */}
        {!hasAppointments && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="h-12 w-12 text-muted-foreground mb-4"
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
            <p className="text-muted-foreground text-sm mb-4">
              Nenhuma consulta agendada para esta semana.
            </p>
            <button
              type="button"
              onClick={() => router.push("/appointments/new")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
            >
              Agendar consulta
            </button>
          </div>
        )}

        {/* Grade semanal — scroll horizontal em mobile com indicação visual */}
        {hasAppointments && (
          <div className="overflow-x-auto -mx-4 px-4">
            <div
              className="grid min-w-[560px]"
              style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
              role="grid"
              aria-label="Grade semanal de consultas"
            >
              {days.map((day, index) => {
                const isToday = isSameDay(day, today)
                const dayAppointments = getAppointmentsForDay(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-border last:border-r-0 ${
                      isToday ? "bg-accent" : "bg-background"
                    }`}
                    role="gridcell"
                  >
                    {/* Header do dia */}
                    <button
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={`w-full px-1 py-2 text-center border-b border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset min-h-[44px] ${
                        isToday
                          ? "bg-accent hover:bg-accent/80"
                          : "hover:bg-secondary"
                      }`}
                      aria-label={`Ver consultas de ${format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}`}
                    >
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {DAY_NAMES[index]}
                      </div>
                      <div
                        className={`text-sm font-semibold mt-0.5 ${
                          isToday ? "text-accent-foreground" : "text-foreground"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                    </button>

                    {/* Consultas do dia */}
                    <div className="p-1 space-y-1 min-h-[80px]">
                      {dayAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onClick={() => handleAppointmentClick(appointment)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetailPanel
          appointment={{ ...selectedAppointment, hasNote: false }}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  )
}
