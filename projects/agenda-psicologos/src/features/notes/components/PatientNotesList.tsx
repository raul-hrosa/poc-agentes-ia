import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { truncateNotePreview } from "@/shared/utils/format"
import type { SessionNoteListItem } from "@/features/notes/types"

interface PatientNotesListProps {
  patient: {
    id: string
    name: string
  }
  notes: SessionNoteListItem[]
}

/**
 * Lista de prontuários de um paciente, agrupados por ano.
 * Prontuários ordenados do mais recente para o mais antigo (garantido pela query).
 */
export function PatientNotesList({ patient, notes }: PatientNotesListProps) {
  // Agrupar por ano (descendente)
  const notesByYear = notes.reduce<Record<number, SessionNoteListItem[]>>(
    (acc, note) => {
      const year = new Date(note.appointment.scheduledAt).getFullYear()
      if (!acc[year]) acc[year] = []
      acc[year].push(note)
      return acc
    },
    {}
  )

  const sortedYears = Object.keys(notesByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-secondary">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header com botão voltar */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href={`/patients/${patient.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <span aria-hidden="true">←</span> {patient.name}
          </Link>
        </div>

        <h1 className="mb-6 text-xl font-semibold text-foreground">
          Prontuários
        </h1>

        {notes.length === 0 ? (
          <div className="rounded-xl border border-border bg-background px-6 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhum prontuário registrado ainda.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Prontuários aparecem aqui após você marcar uma sessão como
              realizada e registrar as anotações.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedYears.map((year) => (
              <div key={year}>
                {/* Separador de ano */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {year}
                  </span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Notas do ano */}
                <div className="rounded-xl border border-border bg-background divide-y divide-border">
                  {notesByYear[year].map((note) => {
                    const preview = truncateNotePreview(note.content)
                    const dateLabel = format(
                      new Date(note.appointment.scheduledAt),
                      "d MMM yyyy · HH:mm",
                      { locale: ptBR }
                    )

                    return (
                      <Link
                        key={note.id}
                        href={`/notes/${note.id}`}
                        className="block px-5 py-4 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring min-h-[44px]"
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {dateLabel}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-line line-clamp-3">
                          {preview}
                        </p>
                        <span className="mt-1 inline-block text-xs font-medium text-primary">
                          Ver completo →
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
