"use client"

import { useState, useEffect } from "react"
import type { ConfirmPageData } from "@/features/reminders/types"

type ConfirmPageClientProps = {
  data: ConfirmPageData
  preselectedAction: "confirmed" | "cancelled" | null
}

type UIState =
  | { screen: "initial" }
  | { screen: "cancel-confirm" }
  | { screen: "success-confirmed" }
  | { screen: "success-cancelled" }
  | { screen: "loading" }

function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function computeEndTime(scheduledAt: Date, durationMinutes: number): Date {
  return new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000)
}

export function ConfirmPageClient({
  data,
  preselectedAction,
}: ConfirmPageClientProps) {
  const [uiState, setUIState] = useState<UIState>(() => {
    if (preselectedAction === "cancelled") return { screen: "cancel-confirm" }
    return { screen: "initial" }
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { appointment, patient, psychologist, token } = data
  const scheduledAt = new Date(appointment.scheduledAt)
  const endTime = computeEndTime(scheduledAt, appointment.durationMinutes)
  const dateLong = formatDateLong(scheduledAt)
  const timeRange = `${formatTime(scheduledAt)} – ${formatTime(endTime)}`

  async function callConfirmAPI(action: "confirmed" | "cancelled") {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(
          body.error ?? "Ocorreu um erro. Tente novamente mais tarde.",
        )
      }

      if (action === "confirmed") {
        setUIState({ screen: "success-confirmed" })
      } else {
        setUIState({ screen: "success-cancelled" })
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro. Tente novamente mais tarde.",
      )
      setUIState({ screen: "initial" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (preselectedAction === "confirmed") {
      void callConfirmAPI("confirmed")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tela de sucesso — confirmação
  if (uiState.screen === "success-confirmed") {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 text-center space-y-3">
        <div className="flex justify-center">
          <span className="text-4xl" aria-hidden="true">
            ✅
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Presença confirmada!</h1>
        <p className="text-sm text-gray-600">
          Até {dateLong} às {formatTime(scheduledAt)}.
        </p>
        <p className="text-sm text-gray-500">
          Seu psicólogo já foi notificado.
        </p>
      </div>
    )
  }

  // Tela de sucesso — cancelamento
  if (uiState.screen === "success-cancelled") {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 text-center space-y-3">
        <div className="flex justify-center">
          <span className="text-4xl" aria-hidden="true">
            📋
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          Cancelamento registrado.
        </h1>
        <p className="text-sm text-gray-500">
          Seu psicólogo foi notificado. Em caso de dúvidas, entre em contato
          diretamente com o consultório.
        </p>
      </div>
    )
  }

  // Tela de loading (quando preselectedAction === "confirmed" está processando)
  if (uiState.screen === "loading") {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">Processando...</p>
      </div>
    )
  }

  // Tela intermediária de confirmação de cancelamento
  if (uiState.screen === "cancel-confirm") {
    return (
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 space-y-5">
        <h1 className="text-lg font-semibold text-gray-900">
          Tem certeza que deseja cancelar?
        </h1>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-1">
          <p className="text-sm font-medium text-gray-800">
            {psychologist.name}
          </p>
          <p className="text-sm text-gray-600 capitalize">{dateLong}</p>
          <p className="text-sm text-gray-600">{timeRange}</p>
        </div>

        {errorMessage !== null && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setUIState({ screen: "initial" })}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={() => void callConfirmAPI("cancelled")}
            disabled={isLoading}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
          >
            {isLoading ? "Processando..." : "Confirmar cancelamento"}
          </button>
        </div>
      </div>
    )
  }

  // Tela inicial — aguardando ação do paciente
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Olá, {patient.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Confirme sua presença na consulta abaixo.
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 w-20 shrink-0">
            Psicólogo
          </span>
          <span className="text-sm text-gray-800">{psychologist.name}</span>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 w-20 shrink-0">
            Data
          </span>
          <span className="text-sm text-gray-800 capitalize">{dateLong}</span>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 w-20 shrink-0">
            Horário
          </span>
          <span className="text-sm text-gray-800">{timeRange}</span>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 w-20 shrink-0">
            Modalidade
          </span>
          <span className="text-sm text-gray-800">{appointment.modality}</span>
        </div>

        {appointment.location !== null && (
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-gray-500 w-20 shrink-0">
              Local
            </span>
            <span className="text-sm text-gray-800 break-all">
              {appointment.location}
            </span>
          </div>
        )}
      </div>

      {errorMessage !== null && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void callConfirmAPI("confirmed")}
          disabled={isLoading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
        >
          {isLoading ? "Processando..." : "Confirmar presença"}
        </button>

        <button
          type="button"
          onClick={() => setUIState({ screen: "cancel-confirm" })}
          disabled={isLoading}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
        >
          Preciso cancelar
        </button>
      </div>
    </div>
  )
}
