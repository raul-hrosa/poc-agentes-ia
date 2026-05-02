export type ReminderStatus =
  | "none" // nenhum token gerado ainda
  | "pending" // token gerado, aguardando resposta do paciente
  | "confirmed" // paciente confirmou via link
  | "cancelled" // paciente cancelou via link

export type ReminderInfo = {
  tokenId: string
  createdAt: Date
  expiresAt: Date
  usedAt: Date | null
  action: "confirmed" | "cancelled" | null
  status: ReminderStatus
  link: string
}

export type AppointmentWithReminderData = {
  id: string
  scheduledAt: Date
  durationMinutes: number
  modality: string
  location: string | null
  status: string
  patient: {
    id: string
    name: string
    email: string | null
  }
  user: {
    id: string
    name: string
  }
  latestReminder: ReminderInfo | null
}

export type ConfirmPageData = {
  valid: true
  appointment: {
    scheduledAt: Date
    durationMinutes: number
    modality: string
    location: string | null
    status: string
  }
  patient: {
    name: string
  }
  psychologist: {
    name: string
  }
  token: string
  action: "confirmed" | "cancelled" | null
}

export type ConfirmPageError =
  | { valid: false; reason: "not_found" }
  | { valid: false; reason: "expired" }
  | { valid: false; reason: "used"; action: "confirmed" | "cancelled" }
  | { valid: false; reason: "appointment_closed" }
