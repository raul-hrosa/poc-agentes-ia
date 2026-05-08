"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, addMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { deleteSessionNote } from "@/features/notes/actions/deleteSessionNote"
import { SessionNoteForm } from "@/features/notes/components/SessionNoteForm"
import type { SessionNoteWithContext } from "@/features/notes/types"

interface SessionNoteViewProps {
  note: SessionNoteWithContext
}

function formatModality(modality: string): string {
  return modality === "in_person" ? "Presencial" : "Online"
}

/**
 * Componente de visualização e edição de prontuário de sessão.
 * Estado isEditing=false: exibe conteúdo com metadados e botões de editar/excluir.
 * Estado isEditing=true: renderiza SessionNoteForm em modo edição.
 */
export function SessionNoteView({ note }: SessionNoteViewProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const startTime = new Date(note.appointment.scheduledAt)
  const endTime = addMinutes(startTime, note.appointment.durationMinutes)
  const dateLabel = format(startTime, "EEEE, d MMM yyyy", { locale: ptBR })
  const timeLabel = `${format(startTime, "HH:mm")}–${format(endTime, "HH:mm")}`
  const modalityLabel = formatModality(note.appointment.modality)

  const createdAtLabel = format(new Date(note.createdAt), "dd/MM/yyyy 'às' HH:mm")

  // Comparar com tolerância de 1 segundo para evitar falso positivo
  const wasEdited =
    new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000
  const updatedAtLabel = wasEdited
    ? format(new Date(note.updatedAt), "dd/MM/yyyy 'às' HH:mm")
    : null

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/dashboard")
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteSessionNote({ noteId: note.id })

      if ("error" in result) {
        toast.error("Não foi possível excluir o prontuário.")
        setDeleteDialogOpen(false)
        return
      }

      toast.success("Prontuário excluído")
      router.push(`/appointments/${result.appointmentId}`)
    } catch {
      toast.error("Não foi possível excluir o prontuário.")
      setDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-secondary">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {/* Header modo edição */}
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <span aria-hidden="true">←</span> Cancelar edição
            </button>
          </div>
          <h1 className="mb-6 text-xl font-semibold text-foreground">
            Editar Anotação
          </h1>
          <SessionNoteForm
            appointment={{
              id: note.appointmentId,
              scheduledAt: note.appointment.scheduledAt,
              durationMinutes: note.appointment.durationMinutes,
              modality: note.appointment.modality,
              patient: note.appointment.patient,
            }}
            note={{ id: note.id, content: note.content }}
            onSave={() => {
              setIsEditing(false)
              router.refresh()
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-secondary">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {/* Header modo visualização */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <span aria-hidden="true">←</span> Voltar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
            >
              Editar
            </button>
          </div>

          {/* Conteúdo do prontuário */}
          <div className="space-y-4">
            {/* Contexto da sessão */}
            <div className="rounded-xl border border-border bg-background px-6 py-5 space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sessão
              </h2>
              <p className="text-sm font-semibold text-foreground">
                {note.appointment.patient.name}
              </p>
              <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
              <p className="text-sm text-muted-foreground">{timeLabel}</p>
              <p className="text-sm text-muted-foreground">{modalityLabel}</p>
            </div>

            {/* Metadados */}
            <div className="rounded-xl border border-border bg-background px-6 py-4 space-y-1">
              <p className="text-xs text-muted-foreground">
                Registrado em {createdAtLabel}
              </p>
              {updatedAtLabel && (
                <p className="text-xs text-muted-foreground">
                  Editado em {updatedAtLabel}
                </p>
              )}
            </div>

            {/* Conteúdo */}
            <div className="rounded-xl border border-border bg-background px-6 py-5">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {note.content}
              </p>
            </div>

            {/* Botão excluir */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full rounded-lg border border-red-300 bg-background px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
              >
                Excluir prontuário
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      {deleteDialogOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => !isDeleting && setDeleteDialogOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-note-dialog-title"
            className="fixed left-1/2 top-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-6 shadow-xl"
          >
            <h2
              id="delete-note-dialog-title"
              className="text-base font-semibold text-foreground"
            >
              Excluir prontuário?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. O registro será removido
              permanentemente.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
              >
                {isDeleting ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
