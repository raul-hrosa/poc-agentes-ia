"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import { format } from "date-fns"
import { AppointmentFormSchema } from "@/features/appointments/schema"
import { createAppointment } from "@/features/appointments/actions/createAppointment"
import { updateAppointment } from "@/features/appointments/actions/updateAppointment"
import type { AppointmentWithTokenStatus } from "@/features/appointments/types"

// Schema para o formulário: data e horário separados para inputs nativos.
// durationMinutes usa z.number() (não coerce) para que o tipo inferido seja
// `number` no input e no output — o valueAsNumber do react-hook-form converte
// o valor do input numérico antes de chegar no resolver.
const FormSchema = z.object({
  patientId: z.string().uuid("Selecione um paciente"),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  durationMinutes: z
    .number()
    .int()
    .min(1, "Duração deve ser de pelo menos 1 minuto"),
  modality: z.enum(["in_person", "online"]),
  location: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof FormSchema>

type ConflictError = {
  type: "conflict"
  message: string
}

interface AppointmentFormProps {
  patients: { id: string; name: string }[]
  appointment?: AppointmentWithTokenStatus
  defaultDate?: string
}

function scheduledAtToDateAndTime(scheduledAt: Date): {
  date: string
  time: string
} {
  return {
    date: format(scheduledAt, "yyyy-MM-dd"),
    time: format(scheduledAt, "HH:mm"),
  }
}

function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`)
}

export function AppointmentForm({
  patients,
  appointment,
  defaultDate,
}: AppointmentFormProps) {
  const router = useRouter()
  const [conflictError, setConflictError] = useState<ConflictError | null>(null)
  const [patientSearch, setPatientSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const isEditing = !!appointment

  const defaultValues: FormValues = isEditing
    ? (() => {
        const { date, time } = scheduledAtToDateAndTime(appointment.scheduledAt)
        return {
          patientId: appointment.patientId,
          date,
          time,
          durationMinutes: appointment.durationMinutes,
          modality: appointment.modality,
          location: appointment.location ?? "",
        }
      })()
    : {
        patientId: "",
        date: defaultDate ?? "",
        time: "",
        durationMinutes: 50,
        modality: "in_person" as const,
        location: "",
      }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const selectedPatientId = watch("patientId")
  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  // Filtro de busca no dropdown de pacientes
  const filteredPatients = patientSearch
    ? patients.filter((p) =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase())
      )
    : patients

  async function onSubmit(data: FormValues) {
    setConflictError(null)

    const scheduledAt = combineDateAndTime(data.date, data.time)

    // Validar o objeto combinado com o schema da action
    const parsed = AppointmentFormSchema.safeParse({
      patientId: data.patientId,
      scheduledAt,
      durationMinutes: data.durationMinutes,
      modality: data.modality,
      location: data.location || null,
    })

    if (!parsed.success) {
      return
    }

    if (isEditing) {
      const result = await updateAppointment({
        appointmentId: appointment.id,
        ...parsed.data,
      })

      if (result.success) {
        toast.success("Consulta atualizada")
        router.push(`/appointments/${appointment.id}`)
        return
      }

      const { error } = result
      if (typeof error === "object" && error.type === "conflict") {
        setConflictError(error)
      } else {
        toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
      }
      return
    }

    const result = await createAppointment(parsed.data)

    if (result.success) {
      toast.success("Consulta agendada com sucesso")
      router.push("/appointments")
      return
    }

    const { error } = result
    if (typeof error === "object" && error.type === "conflict") {
      setConflictError(error)
    } else {
      toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
    }
  }

  const title = isEditing ? "Editar Consulta" : "Nova Consulta"

  return (
    <div className="mx-auto max-w-lg w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 min-h-[44px] px-2 -ml-2"
          aria-label="Voltar"
        >
          &larr; Voltar
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Paciente */}
        <div>
          <label
            htmlFor="patient-search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Paciente *
          </label>
          {/* Campo hidden para o valor real */}
          <input type="hidden" {...register("patientId")} />

          {/* Combobox com busca */}
          <div className="relative">
            <input
              id="patient-search"
              type="text"
              autoComplete="off"
              placeholder={
                selectedPatient ? selectedPatient.name : "Buscar paciente..."
              }
              value={
                dropdownOpen
                  ? patientSearch
                  : (selectedPatient?.name ?? patientSearch)
              }
              onChange={(e) => {
                setPatientSearch(e.target.value)
                if (!dropdownOpen) setDropdownOpen(true)
              }}
              onFocus={() => {
                setDropdownOpen(true)
                setPatientSearch("")
              }}
              onBlur={() => {
                // Delay para permitir click no dropdown
                setTimeout(() => setDropdownOpen(false), 150)
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-describedby={
                errors.patientId ? "patientId-error" : undefined
              }
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="patient-listbox"
            />

            {dropdownOpen && (
              <ul
                id="patient-listbox"
                role="listbox"
                className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredPatients.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-gray-500">
                    Nenhum paciente encontrado
                  </li>
                ) : (
                  filteredPatients.map((patient) => (
                    <li
                      key={patient.id}
                      role="option"
                      aria-selected={patient.id === selectedPatientId}
                      onMouseDown={() => {
                        setValue("patientId", patient.id, {
                          shouldValidate: true,
                        })
                        setPatientSearch("")
                        setDropdownOpen(false)
                      }}
                      className={`cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 min-h-[44px] flex items-center ${
                        patient.id === selectedPatientId
                          ? "bg-blue-50 font-medium text-blue-700"
                          : "text-gray-900"
                      }`}
                    >
                      {patient.name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {errors.patientId && (
            <p
              id="patientId-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.patientId.message}
            </p>
          )}
        </div>

        {/* Data */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Data *
          </label>
          <input
            id="date"
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-describedby={errors.date ? "date-error" : undefined}
            {...register("date")}
          />
          {errors.date && (
            <p
              id="date-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.date.message}
            </p>
          )}
        </div>

        {/* Horário */}
        <div>
          <label
            htmlFor="time"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Horário *
          </label>
          <input
            id="time"
            type="time"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-describedby={
              errors.time
                ? "time-error"
                : conflictError
                  ? "conflict-banner"
                  : undefined
            }
            {...register("time")}
          />
          {errors.time && (
            <p
              id="time-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.time.message}
            </p>
          )}

          {/* Banner de conflito de horário (AC-17, AC-23) */}
          {conflictError && (
            <div
              id="conflict-banner"
              role="alert"
              className="mt-2 rounded-md bg-orange-50 border border-orange-200 px-3 py-2"
            >
              <p className="text-sm text-orange-800">{conflictError.message}</p>
            </div>
          )}
        </div>

        {/* Duração */}
        <div>
          <label
            htmlFor="durationMinutes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Duração *
          </label>
          <div className="flex items-center gap-2">
            <input
              id="durationMinutes"
              type="number"
              min={1}
              inputMode="numeric"
              className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-describedby={
                errors.durationMinutes ? "duration-error" : undefined
              }
              {...register("durationMinutes", { valueAsNumber: true })}
            />
            <span className="text-sm text-gray-600">minutos</span>
          </div>
          {errors.durationMinutes && (
            <p
              id="duration-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.durationMinutes.message}
            </p>
          )}
        </div>

        {/* Modalidade */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Modalidade *
          </legend>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                value="in_person"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                {...register("modality")}
              />
              <span className="text-sm text-gray-900">Presencial</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                value="online"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                {...register("modality")}
              />
              <span className="text-sm text-gray-900">Online</span>
            </label>
          </div>
          {errors.modality && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.modality.message}
            </p>
          )}
        </fieldset>

        {/* Local / Link */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Local / Link{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            id="location"
            type="text"
            placeholder="Endereço (presencial) ou link de reunião (online)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-describedby={errors.location ? "location-error" : undefined}
            {...register("location")}
          />
          {errors.location && (
            <p
              id="location-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.location.message}
            </p>
          )}
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
            )}
            {isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Agendar consulta"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
