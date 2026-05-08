"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { PatientProfile } from "@/features/patients/types"
import { formatPhone, calculateAge } from "@/shared/utils/format"
import { ArchivePatientDialog } from "./ArchivePatientDialog"

interface PatientProfilePageProps {
  patient: PatientProfile
}

export function PatientProfilePage({ patient }: PatientProfilePageProps) {
  const router = useRouter()
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)

  const hasEmergencyContact =
    patient.emergencyContactName !== null ||
    patient.emergencyContactPhone !== null

  const hasNotes =
    patient.notes !== null && patient.notes.trim() !== ""

  const formattedBirthDate = patient.birthDate
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(patient.birthDate))
    : null

  const age = patient.birthDate
    ? calculateAge(new Date(patient.birthDate))
    : null

  function handleArchived() {
    router.push("/patients")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/patients"
          className="flex items-center gap-1 text-sm text-primary hover:underline min-h-[44px] px-1"
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
          Pacientes
        </Link>

        <h1 className="flex-1 text-center text-xl font-semibold text-foreground">
          {patient.name}
        </h1>

        <Link
          href={`/patients/${patient.id}/edit`}
          className="text-sm text-primary hover:underline min-h-[44px] flex items-center px-1"
        >
          Editar
        </Link>
      </div>

      {/* Dados pessoais */}
      <section className="rounded-lg border border-border bg-background p-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Dados pessoais
        </h2>

        <div>
          <p className="text-xs text-muted-foreground">Telefone</p>
          <p className="text-sm text-foreground">{formatPhone(patient.phone)}</p>
        </div>

        {formattedBirthDate !== null && age !== null && (
          <div>
            <p className="text-xs text-muted-foreground">Data de nascimento</p>
            <p className="text-sm text-foreground">
              {formattedBirthDate}{" "}
              <span className="text-muted-foreground">({age} anos)</span>
            </p>
          </div>
        )}
      </section>

      {/* Contato de emergência */}
      {hasEmergencyContact && (
        <section className="rounded-lg border border-border bg-background p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contato de emergência
          </h2>

          {patient.emergencyContactName && (
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="text-sm text-foreground">
                {patient.emergencyContactName}
              </p>
            </div>
          )}

          {patient.emergencyContactPhone && (
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="text-sm text-foreground">
                {formatPhone(patient.emergencyContactPhone)}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Observações gerais */}
      {hasNotes && (
        <section className="rounded-lg border border-border bg-background p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Observações gerais
          </h2>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {patient.notes}
          </p>
        </section>
      )}

      {/* Link para consultas */}
      <div>
        <Link
          href={`/appointments?patient=${patient.id}`}
          className="text-sm text-primary hover:underline"
        >
          Ver consultas deste paciente →
        </Link>
      </div>

      {/* Rodapé — Arquivar */}
      <div className="pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => setArchiveDialogOpen(true)}
          className="w-full rounded-lg border border-red-300 py-3 text-sm font-medium text-red-600 hover:bg-red-50 min-h-[44px]"
        >
          Arquivar paciente
        </button>
      </div>

      <ArchivePatientDialog
        patientId={patient.id}
        patientName={patient.name}
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        onArchived={handleArchived}
      />
    </div>
  )
}
