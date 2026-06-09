// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SubscriptionPlan {
  Free = 'free',
  Pro = 'pro',
  Clinic = 'clinic',
}

export enum SubscriptionStatus {
  Trialing = 'trialing',
  Active = 'active',
  PastDue = 'past_due',
  Cancelled = 'cancelled',
}

export enum SessionStatus {
  Scheduled = 'scheduled',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Missed = 'missed',
  CancelledPatient = 'cancelled_patient',
  CancelledPsychologist = 'cancelled_psychologist',
  Rescheduled = 'rescheduled',
}

export enum PaymentMethod {
  Pix = 'pix',
  Cash = 'cash',
  DebitCard = 'debit_card',
  CreditCard = 'credit_card',
  Transfer = 'transfer',
  Other = 'other',
}

export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Overdue = 'overdue',
  Canceled = 'canceled',
  Refunded = 'refunded',
}

export type PatientStatus = 'active' | 'paused' | 'archived'

// ─── Psychologist ─────────────────────────────────────────────────────────────

export interface Psychologist {
  id: string
  email: string
  name: string
  crp: string
  phone: string | null
  bio: string | null
  avatarUrl: string | null
  slug: string
  sessionDurationMinutes: number
  sessionPrice: number
  emailConfirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface PsychologistPublicProfile {
  name: string
  crp: string
  bio: string | null
  avatarUrl: string | null
  slug: string
  sessionDurationMinutes: number
  sessionPrice: number
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string
  psychologistId: string
  fullName: string
  email: string
  phone: string
  birthDate: string
  status: PatientStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PatientSummary {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  status: PatientStatus
  nextSessionAt: string | null
  pendingPaymentsCount: number
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  id: string
  psychologistId: string
  patientId: string
  patientName: string
  scheduledAt: string
  durationMin: number
  modality: 'in_person' | 'online'
  location: string | null
  status: SessionStatus
  priceCents: number
  cancellationFeeCents: number | null
  recurrenceId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionSlot {
  startsAt: string
  endsAt: string
  available: boolean
}

export interface WeeklyAvailability {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string
  endTime: string
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface Subscription {
  id: string
  psychologistId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialEndsAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  sub: string
  email: string
  plan: SubscriptionPlan
}

export interface LoginResponse {
  accessToken: string
  psychologist: Pick<Psychologist, 'id' | 'name' | 'email' | 'avatarUrl' | 'slug'>
  subscription: Pick<Subscription, 'plan' | 'status'>
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  statusCode: number
  message: string
  error: string
}
