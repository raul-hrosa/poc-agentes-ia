"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatPhone } from "@/shared/utils/format"
import { restorePatient } from "@/features/patients/actions/patientActions"
import type { PatientListItem } from "@/features/patients/types"

interface PatientsPageProps {
  activePatients: PatientListItem[]
  archivedPatients: PatientListItem[]
}

type Tab = "active" | "archived"

interface PatientToRestore {
  id: string
  name: string
}

/**
 * Agrupa lista de pacientes por letra inicial do nome.
 * Retorna array de { letter, patients } ordenado alfabeticamente.
 */
function groupByInitial(patients: PatientListItem[]) {
  const map = new Map<string, PatientListItem[]>()

  for (const patient of patients) {
    const letter = patient.name.charAt(0).toUpperCase()
    if (!map.has(letter)) {
      map.set(letter, [])
    }
    map.get(letter)!.push(patient)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([letter, items]) => ({ letter, items }))
}

export function PatientsPage({
  activePatients,
  archivedPatients,
}: PatientsPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [patientToRestore, setPatientToRestore] =
    useState<PatientToRestore | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const currentList =
    activeTab === "active" ? activePatients : archivedPatients

  const filteredList =
    searchQuery.length >= 2
      ? currentList.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : currentList

  const grouped = groupByInitial(filteredList)

  async function handleRestore() {
    if (!patientToRestore) return

    setIsRestoring(true)
    try {
      const result = await restorePatient(patientToRestore.id)

      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("Paciente reativado com sucesso")
        setPatientToRestore(null)
        router.refresh()
      }
    } catch {
      toast.error("Erro ao restaurar paciente. Tente novamente.")
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-foreground">Pacientes</h1>
          <button
            type="button"
            onClick={() => router.push("/patients/new")}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
          >
            <span aria-hidden="true">+</span> Novo Paciente
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
              activeTab === "active"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Ativos ({activePatients.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
              activeTab === "archived"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Arquivados ({archivedPatients.length})
          </button>
        </div>

        {/* Campo de busca */}
        <div className="relative">
          <input
            type="search"
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-10 py-2.5 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Buscar paciente por nome"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Estado vazio — sem pacientes e sem busca */}
        {currentList.length === 0 && !searchQuery && (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-muted-foreground text-sm mb-4">
              Nenhum paciente cadastrado ainda
            </p>
            {activeTab === "active" && (
              <button
                type="button"
                onClick={() => router.push("/patients/new")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
              >
                Adicionar primeiro paciente
              </button>
            )}
          </div>
        )}

        {/* Estado sem resultado de busca */}
        {currentList.length > 0 && filteredList.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhum paciente encontrado para &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}

        {/* Lista agrupada */}
        {grouped.length > 0 && (
          <div className="space-y-1">
            {grouped.map(({ letter, items }) => (
              <div key={letter}>
                {/* Separador alfabético */}
                <div className="sticky top-0 bg-secondary px-2 py-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {letter}
                  </span>
                </div>

                {/* Itens do grupo */}
                <div className="bg-background rounded-lg divide-y divide-border shadow-sm">
                  {items.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between px-4 py-3 min-h-[64px]"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/patients/${patient.id}`)}
                        className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset rounded"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {patient.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatPhone(patient.phone)}
                        </p>
                      </button>

                      {activeTab === "archived" && (
                        <button
                          type="button"
                          onClick={() =>
                            setPatientToRestore({
                              id: patient.id,
                              name: patient.name,
                            })
                          }
                          className="ml-3 shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring min-h-[36px]"
                        >
                          Restaurar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmação de restauração */}
      {patientToRestore && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => !isRestoring && setPatientToRestore(null)}
            aria-hidden="true"
          />

          {/* Dialog content */}
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <h2
              id="restore-dialog-title"
              className="text-base font-semibold text-foreground mb-2"
            >
              Restaurar paciente
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Deseja reativar o paciente{" "}
              <span className="font-medium text-foreground">
                {patientToRestore.name}
              </span>
              ?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPatientToRestore(null)}
                disabled={isRestoring}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              >
                {isRestoring ? "Restaurando..." : "Restaurar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
