"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, addMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createSessionNote } from "@/features/notes/actions/createSessionNote"
import { updateSessionNote } from "@/features/notes/actions/updateSessionNote"

interface SessionNoteFormProps {
  appointment: {
    id: string
    scheduledAt: Date
    durationMinutes: number
    modality: string
    patient: {
      id: string
      name: string
    }
  }
  note?: {
    id: string
    content: string
  }
  onSave?: () => void
  onCancel?: () => void
}

function formatModality(modality: string): string {
  return modality === "in_person" ? "Presencial" : "Online"
}

/**
 * Formulário de criação e edição de prontuário de sessão.
 * Modo criação: sem `note` — chama createSessionNote.
 * Modo edição: com `note` — chama updateSessionNote, usa callbacks onSave/onCancel.
 */
export function SessionNoteForm({
  appointment,
  note,
  onSave,
  onCancel,
}: SessionNoteFormProps) {
  const router = useRouter()
  const isEditing = !!note
  const [content, setContent] = useState(note?.content ?? "")
  const [contentError, setContentError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const startTime = new Date(appointment.scheduledAt)
  const endTime = addMinutes(startTime, appointment.durationMinutes)

  const dateLabel = format(startTime, "EEEE, d MMM yyyy", { locale: ptBR })
  const timeLabel = `${format(startTime, "HH:mm")}–${format(endTime, "HH:mm")}`
  const modalityLabel = formatModality(appointment.modality)

  function validate(): boolean {
    const trimmed = content.trim()
    if (!trimmed) {
      setContentError("O conteúdo do prontuário é obrigatório")
      return false
    }
    setContentError("")
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      if (isEditing) {
        const result = await updateSessionNote({
          noteId: note.id,
          content,
        })

        if ("error" in result) {
          toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
          return
        }

        toast.success("Prontuário atualizado")
        onSave?.()
      } else {
        const result = await createSessionNote({
          appointmentId: appointment.id,
          content,
        })

        if ("error" in result) {
          toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
          return
        }

        toast.success("Prontuário salvo")
        router.push(`/notes/${result.noteId}`)
      }
    } catch {
      toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    if (isEditing) {
      onCancel?.()
    } else {
      router.push(`/appointments/${appointment.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contexto da sessão — somente leitura */}
      <div className="rounded-xl border border-border bg-background px-6 py-5 space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sessão
        </h2>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {appointment.patient.name}
          </p>
          <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
          <p className="text-sm text-muted-foreground">{timeLabel}</p>
          <p className="text-sm text-muted-foreground">{modalityLabel}</p>
        </div>
      </div>

      {/* Campo de conteúdo */}
      <div className="rounded-xl border border-border bg-background px-6 py-5 space-y-2">
        <label
          htmlFor="note-content"
          className="block text-sm font-medium text-foreground"
        >
          Anotações da sessão
        </label>
        <textarea
          id="note-content"
          name="content"
          rows={10}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (contentError) setContentError("")
          }}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring min-h-[44px] resize-y"
          placeholder="Descreva as principais observações, tópicos abordados e encaminhamentos da sessão..."
          disabled={isSubmitting}
        />
        {contentError && (
          <p className="text-xs text-red-600">{contentError}</p>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] sm:w-auto sm:min-w-[160px]"
        >
          {isSubmitting && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden="true"
            />
          )}
          {isEditing ? "Salvar alterações" : "Salvar prontuário"}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] sm:w-auto"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
