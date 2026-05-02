"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import type { ReminderInfo } from "@/features/reminders/types"
import { generateReminderToken } from "@/features/reminders/actions/generateReminderToken"
import { sendReminderEmail } from "@/features/reminders/actions/sendReminderEmail"

interface ReminderSectionClientProps {
  appointmentId: string
  patientEmail: string | null
  latestReminder: ReminderInfo | null
  appointmentStatus: string
  isTerminal: boolean
}

export function ReminderSectionClient({
  appointmentId,
  patientEmail,
  latestReminder,
  isTerminal,
}: ReminderSectionClientProps) {
  const router = useRouter()
  const [isPendingGenerate, startGenerateTransition] = useTransition()
  const [isPendingSendEmail, startSendEmailTransition] = useTransition()
  const [copyLabel, setCopyLabel] = useState("Copiar link")

  function handleCopyLink() {
    if (!latestReminder?.link) return
    navigator.clipboard.writeText(latestReminder.link).then(() => {
      setCopyLabel("Copiado!")
      setTimeout(() => setCopyLabel("Copiar link"), 2000)
    })
  }

  function handleGenerateToken() {
    startGenerateTransition(async () => {
      try {
        await generateReminderToken({ appointmentId })
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o lembrete.",
        )
      }
    })
  }

  function handleSendEmail() {
    startSendEmailTransition(async () => {
      try {
        await sendReminderEmail({ appointmentId })
        toast.success("E-mail enviado com sucesso")
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Falha ao enviar e-mail. Copie o link e envie manualmente.",
        )
      }
    })
  }

  // Estado: consulta terminal — apenas histórico, sem botões de ação
  if (isTerminal) {
    if (!latestReminder) {
      return (
        <p className="text-sm text-gray-500">Nenhum lembrete enviado.</p>
      )
    }
    return (
      <div className="space-y-2">
        {latestReminder.status === "confirmed" && latestReminder.usedAt && (
          <p className="text-sm text-green-700">
            Paciente confirmou presença em{" "}
            {format(latestReminder.usedAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
        {latestReminder.status === "cancelled" && latestReminder.usedAt && (
          <p className="text-sm text-red-700">
            Paciente cancelou via link em{" "}
            {format(latestReminder.usedAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
        {latestReminder.status === "pending" && (
          <p className="text-sm text-gray-500">
            Lembrete enviado. Aguardando resposta do paciente.
          </p>
        )}
      </div>
    )
  }

  // Estado: sem lembrete ainda
  if (!latestReminder) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">Nenhum lembrete enviado.</p>
        <button
          type="button"
          onClick={handleGenerateToken}
          disabled={isPendingGenerate}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
        >
          {isPendingGenerate ? "Gerando..." : "Gerar lembrete"}
        </button>
      </div>
    )
  }

  // Estado: paciente confirmou
  if (latestReminder.status === "confirmed") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-green-700">
          Paciente confirmou presença
          {latestReminder.usedAt && (
            <span className="block font-normal text-green-600 text-xs mt-0.5">
              em{" "}
              {format(latestReminder.usedAt, "d 'de' MMMM 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={handleGenerateToken}
          disabled={isPendingGenerate}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
        >
          {isPendingGenerate ? "Gerando..." : "Gerar novo lembrete"}
        </button>
      </div>
    )
  }

  // Estado: paciente cancelou
  if (latestReminder.status === "cancelled") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-red-700">
          Paciente cancelou via link
          {latestReminder.usedAt && (
            <span className="block font-normal text-red-600 text-xs mt-0.5">
              em{" "}
              {format(latestReminder.usedAt, "d 'de' MMMM 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={handleGenerateToken}
          disabled={isPendingGenerate}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
        >
          {isPendingGenerate ? "Gerando..." : "Gerar novo lembrete"}
        </button>
      </div>
    )
  }

  // Estado: lembrete gerado, aguardando resposta (pending)
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          Gerado em:{" "}
          {format(latestReminder.createdAt, "d 'de' MMMM 'às' HH:mm", {
            locale: ptBR,
          })}
        </p>
        <p className="text-xs text-gray-500">
          Status: aguardando resposta do paciente
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={latestReminder.link}
          className="flex-1 truncate rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 focus:outline-none"
          aria-label="Link de lembrete"
        />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full rounded-lg border border-indigo-300 bg-white px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
        >
          {copyLabel}
        </button>

        {patientEmail !== null && (
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isPendingSendEmail}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
          >
            {isPendingSendEmail ? "Enviando..." : "Enviar por e-mail"}
          </button>
        )}

        <button
          type="button"
          onClick={handleGenerateToken}
          disabled={isPendingGenerate}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
        >
          {isPendingGenerate ? "Gerando..." : "Gerar novo lembrete"}
        </button>
      </div>
    </div>
  )
}
