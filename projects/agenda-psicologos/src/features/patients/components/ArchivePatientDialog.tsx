"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { archivePatient } from "@/features/patients/actions/patientActions"

interface ArchivePatientDialogProps {
  patientId: string
  patientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onArchived: () => void
}

export function ArchivePatientDialog({
  patientId,
  patientName,
  open,
  onOpenChange,
  onArchived,
}: ArchivePatientDialogProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  if (!open) return null

  async function handleConfirm() {
    setIsPending(true)
    try {
      const result = await archivePatient(patientId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Paciente arquivado. Você pode restaurá-lo a qualquer momento.")
      onOpenChange(false)
      onArchived()
      router.push("/patients")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-dialog-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl"
      >
        <h2
          id="archive-dialog-title"
          className="text-base font-semibold text-gray-900"
        >
          Arquivar paciente
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          {patientName} será removida da sua lista ativa. O histórico de
          consultas e prontuário será preservado.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
          >
            {isPending ? "Arquivando..." : "Sim, arquivar"}
          </button>
        </div>
      </div>
    </>
  )
}
