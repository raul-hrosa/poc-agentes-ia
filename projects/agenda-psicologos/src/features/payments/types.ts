export type PaymentStatus = "pending" | "paid"

export type PaymentMethod = "pix" | "cash" | "card" | "transfer"

export type SessionPayment = {
  id: string
  appointmentId: string
  amountCents: number
  status: PaymentStatus
  paidAt: Date | null
  paymentMethod: PaymentMethod | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type SessionPaymentWithContext = SessionPayment & {
  appointment: {
    scheduledAt: Date
    durationMinutes: number
    patient: {
      name: string
    }
  }
}

export type FinancialSummary = {
  totalPaidCents: number
  totalPendingCents: number
  sessionCount: number
  pendingCount: number
}

export type PaymentActionResult =
  | { success: true }
  | { error: "not_found" }
  | { error: "invalid_status" }
  | { error: "plan_required" }
  | { error: "server_error" }
  | { fieldErrors: Record<string, string[]> }
