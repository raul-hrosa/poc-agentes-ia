"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PatientFormSchema } from "@/features/patients/schema"
import {
  createPatient,
  updatePatient,
} from "@/features/patients/actions/patientActions"
import type { PatientProfile } from "@/features/patients/types"
import type { PatientFormInput } from "@/features/patients/schema"
import type { z } from "zod"

type Props = {
  mode: "create" | "edit"
  isAtLimit: boolean
  patient?: PatientProfile
}

// z.input<> representa o tipo de entrada do schema (antes das coerções).
// birthDate é aceito como string pelo z.coerce.date() no input type="date"
// e convertido para Date na validação — por isso usamos o tipo de entrada aqui.
type PatientFormValues = z.input<typeof PatientFormSchema>

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return ""
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function PatientFormPage({ mode, isAtLimit, patient }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues:
      mode === "edit" && patient
        ? {
            name: patient.name,
            phone: patient.phone,
            birthDate: formatDateForInput(patient.birthDate) || null,
            notes: patient.notes ?? "",
            emergencyContactName: patient.emergencyContactName ?? "",
            emergencyContactPhone: patient.emergencyContactPhone ?? "",
          }
        : {
            name: "",
            phone: "",
            birthDate: null,
            notes: "",
            emergencyContactName: "",
            emergencyContactPhone: "",
          },
  })

  const title = mode === "create" ? "Novo Paciente" : "Editar Paciente"

  const cancelHref =
    mode === "edit" && patient ? `/patients/${patient.id}` : "/patients"

  async function onSubmit(data: PatientFormValues) {
    setServerError(null)

    const payload = data as PatientFormInput

    if (mode === "create") {
      const result = await createPatient(payload)
      if ("success" in result && result.success) {
        toast.success(`Paciente ${data.name} cadastrado com sucesso`)
        router.push("/patients")
        return
      }
      if ("error" in result) {
        setServerError(result.error)
      }
      return
    }

    if (mode === "edit" && patient) {
      const result = await updatePatient(patient.id, payload)
      if ("success" in result && result.success) {
        toast.success(`Dados de ${data.name} atualizados com sucesso`)
        router.push(`/patients/${patient.id}`)
        return
      }
      if ("error" in result) {
        setServerError(result.error)
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/patients")}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 min-h-[44px] px-2 -ml-2"
          aria-label="Voltar para lista de pacientes"
        >
          &larr; Voltar
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Limite banner */}
      {isAtLimit && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-yellow-50 border border-yellow-200 p-4"
        >
          <p className="text-sm text-yellow-800">
            Você atingiu o limite de 10 pacientes no plano grátis. Arquive um
            paciente ou faça upgrade para o plano Pro.
          </p>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="mt-2 text-sm font-medium text-yellow-900 underline min-h-[44px] flex items-center"
          >
            Fazer upgrade
          </button>
        </div>
      )}

      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Nome */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nome *
          </label>
          <input
            id="name"
            type="text"
            autoComplete="off"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p
              id="name-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Telefone (WhatsApp) *
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-describedby={
              errors.phone ? "phone-error phone-hint" : "phone-hint"
            }
            {...register("phone")}
          />
          <p id="phone-hint" className="mt-1 text-xs text-gray-500">
            Formato: 11999999999 (somente números)
          </p>
          {errors.phone && (
            <p
              id="phone-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Data de nascimento */}
        <div>
          <label
            htmlFor="birthDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Data de nascimento
          </label>
          <input
            id="birthDate"
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-describedby={errors.birthDate ? "birthDate-error" : undefined}
            {...register("birthDate")}
          />
          {errors.birthDate && (
            <p
              id="birthDate-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.birthDate.message}
            </p>
          )}
        </div>

        {/* Observações */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Observações gerais
          </label>
          <textarea
            id="notes"
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
            aria-describedby={errors.notes ? "notes-error" : undefined}
            {...register("notes")}
          />
          {errors.notes && (
            <p
              id="notes-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.notes.message}
            </p>
          )}
        </div>

        {/* Contato de emergência */}
        <fieldset className="border border-gray-200 rounded-md p-4 space-y-4">
          <legend className="text-sm font-medium text-gray-700 px-1">
            Contato de emergência
          </legend>

          <div>
            <label
              htmlFor="emergencyContactName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome do contato
            </label>
            <input
              id="emergencyContactName"
              type="text"
              autoComplete="off"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-describedby={
                errors.emergencyContactName
                  ? "emergencyContactName-error"
                  : undefined
              }
              {...register("emergencyContactName")}
            />
            {errors.emergencyContactName && (
              <p
                id="emergencyContactName-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.emergencyContactName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="emergencyContactPhone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Telefone do contato
            </label>
            <input
              id="emergencyContactPhone"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-describedby={
                errors.emergencyContactPhone
                  ? "emergencyContactPhone-error"
                  : undefined
              }
              {...register("emergencyContactPhone")}
            />
            {errors.emergencyContactPhone && (
              <p
                id="emergencyContactPhone-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.emergencyContactPhone.message}
              </p>
            )}
          </div>
        </fieldset>

        {/* Botões */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isAtLimit}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
            )}
            {isSubmitting ? "Salvando..." : "Salvar paciente"}
          </button>

          <button
            type="button"
            onClick={() => router.push(cancelHref)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
