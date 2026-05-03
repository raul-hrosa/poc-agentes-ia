// Tipo base de consulta retornado pelas queries — inclui relação com paciente
export type AppointmentWithPatient = {
  id: string
  userId: string
  patientId: string
  scheduledAt: Date
  durationMinutes: number
  modality: "in_person" | "online"
  location: string | null
  status: AppointmentStatus
  cancellationReason: string | null
  createdAt: Date
  updatedAt: Date
  patient: {
    id: string
    name: string
    phone: string
  }
  // hasNote é calculado nas queries que precisam exibir link de prontuário
  hasNote?: boolean
}

// Status válidos — valores do campo `status` na tabela `appointments`
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

// Modalidades válidas — valores do campo `modality`
export type AppointmentModality = "in_person" | "online"

// Tipo de retorno de Server Action com possível erro de conflito de horário
export type ConflictError = {
  type: "conflict"
  message: string
}

export type AppointmentActionResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string | ConflictError }

// Tipo para o formulário de criação/edição
export type AppointmentFormData = {
  patientId: string
  scheduledAt: Date
  durationMinutes: number
  modality: AppointmentModality
  location?: string | null
}

// Origem do cancelamento — inferida a partir de appointment_tokens
export type CancellationOrigin = "patient" | "psychologist" | null

// Dados do token mais recente de uma consulta (para inferir origem e status)
export type AppointmentTokenSummary = {
  action: "confirmed" | "cancelled" | null
  usedAt: Date | null
  expiresAt: Date
}

// Consulta enriquecida com dados do token para exibição na agenda
export type AppointmentWithTokenStatus = {
  id: string
  patientId: string
  patientName: string
  scheduledAt: Date
  durationMinutes: number
  modality: "in_person" | "online"
  location: string | null
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
  cancellationReason: string | null
  cancellationOrigin: CancellationOrigin
  latestToken: AppointmentTokenSummary | null
}
