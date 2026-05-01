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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">Pacientes</h1>
          <button
            type="button"
            onClick={() => router.push("/patients/new")}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
          >
            <span aria-hidden="true">+</span> Novo Paciente
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
              activeTab === "active"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Ativos ({activePatients.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
              activeTab === "archived"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Buscar paciente por nome"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-gray-500 text-sm mb-4">
              Nenhum paciente cadastrado ainda
            </p>
            {activeTab === "active" && (
              <button
                type="button"
                onClick={() => router.push("/patients/new")}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
              >
                Adicionar primeiro paciente
              </button>
            )}
          </div>
        )}

        {/* Estado sem resultado de busca */}
        {currentList.length > 0 && filteredList.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500 text-sm">
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
                <div className="sticky top-0 bg-gray-50 px-2 py-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {letter}
                  </span>
                </div>

                {/* Itens do grupo */}
                <div className="bg-white rounded-lg divide-y divide-gray-100 shadow-sm">
                  {items.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between px-4 py-3 min-h-[64px]"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/patients/${patient.id}`)}
                        className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {patient.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
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
                          className="ml-3 shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[36px]"
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
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2
              id="restore-dialog-title"
              className="text-base font-semibold text-gray-900 mb-2"
            >
              Restaurar paciente
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Deseja reativar o paciente{" "}
              <span className="font-medium text-gray-900">
                {patientToRestore.name}
              </span>
              ?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPatientToRestore(null)}
                disabled={isRestoring}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
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
