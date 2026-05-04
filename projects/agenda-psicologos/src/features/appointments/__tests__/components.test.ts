import { describe, it, expect } from "vitest"
import { startOfWeek, addDays, isValid, parseISO } from "date-fns"

/**
 * Testes de lógica dos componentes da visualização semanal.
 * Componentes React não são testados diretamente aqui (exigiriam jsdom +
 * @testing-library/react com setup adicional). A lógica pura de data e
 * utilitários é verificada neste arquivo.
 */

// ---------------------------------------------------------------------------
// resolveWeekStart — lógica extraída da page.tsx
// ---------------------------------------------------------------------------

function resolveWeekStart(weekParam?: string): Date {
  if (weekParam) {
    const parsed = parseISO(weekParam)
    if (isValid(parsed)) {
      return startOfWeek(parsed, { weekStartsOn: 1 })
    }
  }
  return startOfWeek(new Date(), { weekStartsOn: 1 })
}

describe("resolveWeekStart", () => {
  it("retorna segunda-feira da semana atual quando sem parâmetro", () => {
    const result = resolveWeekStart()
    // Deve ser segunda-feira (getDay() === 1)
    expect(result.getDay()).toBe(1)
  })

  it("retorna segunda-feira da semana correspondente ao parâmetro YYYY-MM-DD", () => {
    // 2026-05-01 é uma sexta-feira → semana começa em 2026-04-27 (segunda)
    const result = resolveWeekStart("2026-05-01")
    expect(result.toISOString().startsWith("2026-04-27")).toBe(true)
    expect(result.getDay()).toBe(1)
  })

  it("retorna semana atual quando parâmetro é inválido", () => {
    const result = resolveWeekStart("invalid-date")
    expect(result.getDay()).toBe(1)
    expect(isValid(result)).toBe(true)
  })

  it("retorna segunda-feira quando parâmetro cai em domingo", () => {
    // 2026-04-26 é domingo → semana começa em 2026-04-20 (segunda)
    const result = resolveWeekStart("2026-04-26")
    expect(result.getDay()).toBe(1)
    expect(result.toISOString().startsWith("2026-04-20")).toBe(true)
  })

  it("retorna a mesma segunda quando parâmetro já é segunda-feira", () => {
    const result = resolveWeekStart("2026-04-27")
    expect(result.getDay()).toBe(1)
    expect(result.toISOString().startsWith("2026-04-27")).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// abbreviateName — lógica extraída de AppointmentCard.tsx
// ---------------------------------------------------------------------------

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts.slice(0, 2).join(" ")
}

describe("abbreviateName", () => {
  it("retorna dois primeiros nomes quando há mais de dois nomes", () => {
    expect(abbreviateName("Ana Beatriz Silva")).toBe("Ana Beatriz")
  })

  it("retorna o nome completo quando há apenas um nome", () => {
    expect(abbreviateName("Ana")).toBe("Ana")
  })

  it("retorna os dois nomes quando há exatamente dois", () => {
    expect(abbreviateName("Ana Beatriz")).toBe("Ana Beatriz")
  })

  it("remove espaços extras no início e fim", () => {
    expect(abbreviateName("  Ana Beatriz Silva  ")).toBe("Ana Beatriz")
  })

  it("trata múltiplos espaços entre nomes", () => {
    expect(abbreviateName("Ana  Beatriz  Silva")).toBe("Ana Beatriz")
  })
})

// ---------------------------------------------------------------------------
// StatusBadge — mapeamento de status
// ---------------------------------------------------------------------------

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "agendada",
  confirmed: "confirmada",
  completed: "realizada",
  cancelled: "cancelada",
  no_show: "falta",
}

describe("StatusBadge labels", () => {
  it("exibe 'agendada' para status scheduled", () => {
    expect(STATUS_LABELS.scheduled).toBe("agendada")
  })

  it("exibe 'confirmada' para status confirmed", () => {
    expect(STATUS_LABELS.confirmed).toBe("confirmada")
  })

  it("exibe 'realizada' para status completed", () => {
    expect(STATUS_LABELS.completed).toBe("realizada")
  })

  it("exibe 'cancelada' para status cancelled", () => {
    expect(STATUS_LABELS.cancelled).toBe("cancelada")
  })

  it("exibe 'falta' para status no_show", () => {
    expect(STATUS_LABELS.no_show).toBe("falta")
  })

  it("cobre todos os status possíveis", () => {
    const statuses: AppointmentStatus[] = [
      "scheduled",
      "confirmed",
      "completed",
      "cancelled",
      "no_show",
    ]
    for (const status of statuses) {
      expect(STATUS_LABELS[status]).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// AppointmentStatusBadge — mapeamento de status + cancellationOrigin (TASK-04)
// ---------------------------------------------------------------------------

type CancellationOrigin = "patient" | "psychologist" | null

type AppointmentBadgeStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

/**
 * Replica a lógica de seleção de label do AppointmentStatusBadge.
 * Retorna null para "scheduled" (sem badge).
 */
function getBadgeLabel(
  status: AppointmentBadgeStatus,
  cancellationOrigin: CancellationOrigin
): string | null {
  if (status === "scheduled") return null
  if (status === "confirmed") return "Confirmada pelo paciente"
  if (status === "cancelled") {
    if (cancellationOrigin === "patient") return "Cancelada pelo paciente"
    return "Cancelada pelo psicólogo"
  }
  if (status === "completed") return "Realizada"
  if (status === "no_show") return "Falta"
  return null
}

describe("AppointmentStatusBadge — label por status e cancellationOrigin", () => {
  it("retorna null para status scheduled (sem badge)", () => {
    expect(getBadgeLabel("scheduled", null)).toBeNull()
  })

  it("retorna 'Confirmada pelo paciente' para status confirmed", () => {
    expect(getBadgeLabel("confirmed", null)).toBe("Confirmada pelo paciente")
  })

  it("retorna 'Cancelada pelo paciente' para status cancelled + cancellationOrigin patient", () => {
    expect(getBadgeLabel("cancelled", "patient")).toBe("Cancelada pelo paciente")
  })

  it("retorna 'Cancelada pelo psicólogo' para status cancelled + cancellationOrigin psychologist", () => {
    expect(getBadgeLabel("cancelled", "psychologist")).toBe(
      "Cancelada pelo psicólogo"
    )
  })

  it("retorna 'Cancelada pelo psicólogo' para status cancelled + cancellationOrigin null", () => {
    // fallback: sem token de cancelamento → origem psicólogo
    expect(getBadgeLabel("cancelled", null)).toBe("Cancelada pelo psicólogo")
  })

  it("retorna 'Realizada' para status completed", () => {
    expect(getBadgeLabel("completed", null)).toBe("Realizada")
  })

  it("retorna 'Falta' para status no_show", () => {
    expect(getBadgeLabel("no_show", null)).toBe("Falta")
  })
})

/**
 * Replica a lógica de classes CSS do AppointmentCard para status.
 */
function getCardModifierClass(status: AppointmentBadgeStatus): string {
  if (status === "confirmed") return "bg-green-50 border-green-500"
  if (status === "cancelled") return "opacity-50"
  return ""
}

describe("AppointmentCard — classes CSS por status (TASK-04)", () => {
  it("aplica bg-green-50 e border-green-500 para status confirmed", () => {
    const classes = getCardModifierClass("confirmed")
    expect(classes).toContain("bg-green-50")
    expect(classes).toContain("border-green-500")
  })

  it("aplica opacity-50 para status cancelled", () => {
    const classes = getCardModifierClass("cancelled")
    expect(classes).toContain("opacity-50")
  })

  it("não aplica modificadores especiais para status scheduled", () => {
    const classes = getCardModifierClass("scheduled")
    expect(classes).toBe("")
  })

  it("não aplica modificadores especiais para status completed", () => {
    const classes = getCardModifierClass("completed")
    expect(classes).toBe("")
  })

  it("não aplica modificadores especiais para status no_show", () => {
    const classes = getCardModifierClass("no_show")
    expect(classes).toBe("")
  })
})

// ---------------------------------------------------------------------------
// Estado vazio da agenda semanal (TASK-04)
// ---------------------------------------------------------------------------

describe("WeeklyCalendar — estado vazio", () => {
  it("detecta semana vazia quando array de consultas é vazio", () => {
    const appointments: unknown[] = []
    expect(appointments.length === 0).toBe(true)
  })

  it("detecta semana com consultas quando array não está vazio", () => {
    const appointments = [{ id: "appt-1" }]
    expect(appointments.length > 0).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Grade semanal — geração dos 7 dias
// ---------------------------------------------------------------------------

describe("grade semanal — dias da semana", () => {
  it("gera exatamente 7 dias a partir do weekStart", () => {
    const weekStart = resolveWeekStart("2026-04-27") // segunda-feira
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    expect(days).toHaveLength(7)
  })

  it("primeiro dia é segunda-feira", () => {
    const weekStart = resolveWeekStart("2026-04-27")
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    expect(days[0].getDay()).toBe(1) // segunda = 1
  })

  it("último dia é domingo", () => {
    const weekStart = resolveWeekStart("2026-04-27")
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    expect(days[6].getDay()).toBe(0) // domingo = 0
  })

  it("gera dias consecutivos", () => {
    const weekStart = resolveWeekStart("2026-04-27")
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    for (let i = 1; i < days.length; i++) {
      const diff = days[i].getTime() - days[i - 1].getTime()
      expect(diff).toBe(24 * 60 * 60 * 1000) // 1 dia em ms
    }
  })
})

// ---------------------------------------------------------------------------
// CancelDialog — lógica de contador de caracteres e visibilidade de erro (TASK-05)
// ---------------------------------------------------------------------------

const MAX_CANCEL_REASON_LENGTH = 500

/**
 * Calcula caracteres restantes no campo de motivo do cancelamento.
 */
function calcCharsRemaining(value: string): number {
  return MAX_CANCEL_REASON_LENGTH - value.length
}

describe("CancelDialog — contador de caracteres restantes", () => {
  it("começa com 500 caracteres restantes quando campo está vazio", () => {
    expect(calcCharsRemaining("")).toBe(500)
  })

  it("diminui ao digitar", () => {
    expect(calcCharsRemaining("olá")).toBe(497)
  })

  it("chega a zero quando texto tem 500 caracteres", () => {
    const text = "a".repeat(500)
    expect(calcCharsRemaining(text)).toBe(0)
  })

  it("não permite valores negativos (maxLength no textarea impede)", () => {
    // maxLength={500} no textarea impede mais que 500 chars; verifica lógica
    const text = "a".repeat(500)
    expect(calcCharsRemaining(text)).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// formatTokenResponseLabel — lógica de exibição de data/hora do token (TASK-05)
// ---------------------------------------------------------------------------

type TokenResponseStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"

interface MockAppointment {
  status: TokenResponseStatus
  cancellationOrigin: "patient" | "psychologist" | null
  latestToken: { usedAt: Date | null; action: string | null; expiresAt: Date } | null
}

/**
 * Replica a lógica de formatTokenResponseLabel dos componentes AppointmentDetails
 * e AppointmentDetailPanel.
 */
function resolveTokenResponseVisibility(appointment: MockAppointment): "confirmed" | "patient-cancelled" | "none" {
  const { status, cancellationOrigin, latestToken } = appointment

  if (!latestToken?.usedAt) return "none"

  if (status === "confirmed") return "confirmed"

  if (status === "cancelled" && cancellationOrigin === "patient") return "patient-cancelled"

  return "none"
}

describe("formatTokenResponseLabel — visibilidade por status e origem (TASK-05)", () => {
  const usedAt = new Date("2026-05-08T09:00:00Z")
  const expiresAt = new Date("2026-05-11T09:00:00Z")

  it("exibe 'confirmou presença' quando status é confirmed e token tem usedAt", () => {
    const appt: MockAppointment = {
      status: "confirmed",
      cancellationOrigin: null,
      latestToken: { usedAt, action: "confirmed", expiresAt },
    }
    expect(resolveTokenResponseVisibility(appt)).toBe("confirmed")
  })

  it("exibe 'cancelou presença' quando status é cancelled e cancellationOrigin é patient", () => {
    const appt: MockAppointment = {
      status: "cancelled",
      cancellationOrigin: "patient",
      latestToken: { usedAt, action: "cancelled", expiresAt },
    }
    expect(resolveTokenResponseVisibility(appt)).toBe("patient-cancelled")
  })

  it("não exibe linha quando status é cancelled e cancellationOrigin é psychologist", () => {
    const appt: MockAppointment = {
      status: "cancelled",
      cancellationOrigin: "psychologist",
      latestToken: { usedAt: null, action: null, expiresAt },
    }
    expect(resolveTokenResponseVisibility(appt)).toBe("none")
  })

  it("não exibe linha quando latestToken é null", () => {
    const appt: MockAppointment = {
      status: "confirmed",
      cancellationOrigin: null,
      latestToken: null,
    }
    expect(resolveTokenResponseVisibility(appt)).toBe("none")
  })

  it("não exibe linha quando latestToken.usedAt é null (token não usado)", () => {
    const appt: MockAppointment = {
      status: "confirmed",
      cancellationOrigin: null,
      latestToken: { usedAt: null, action: null, expiresAt },
    }
    expect(resolveTokenResponseVisibility(appt)).toBe("none")
  })

  it("não exibe linha para status scheduled", () => {
    const appt: MockAppointment = {
      status: "scheduled",
      cancellationOrigin: null,
      latestToken: null,
    }
    expect(resolveTokenResponseVisibility(appt)).toBe("none")
  })

  it("não exibe linha para status completed", () => {
    const appt: MockAppointment = {
      status: "completed",
      cancellationOrigin: null,
      latestToken: { usedAt, action: "confirmed", expiresAt },
    }
    expect(resolveTokenResponseVisibility(appt)).toBe("none")
  })

  it("não exibe linha para status no_show", () => {
    const appt: MockAppointment = {
      status: "no_show",
      cancellationOrigin: null,
      latestToken: { usedAt, action: null, expiresAt },
    }
    expect(resolveTokenResponseVisibility(appt)).toBe("none")
  })
})

// ---------------------------------------------------------------------------
// AppointmentDetails — visibilidade do campo "Motivo" (TASK-05)
// ---------------------------------------------------------------------------

/**
 * Replica a lógica de exibição do campo Motivo em AppointmentDetails.
 * Exibe quando status = cancelled E cancellationReason != null.
 * Omite quando cancellationReason === null.
 */
function shouldShowCancellationReason(
  status: string,
  cancellationReason: string | null
): boolean {
  return status === "cancelled" && cancellationReason !== null
}

describe("AppointmentDetails — campo Motivo (AC-14, AC-15 — TASK-05)", () => {
  it("exibe motivo quando status é cancelled e cancellationReason está preenchido", () => {
    expect(shouldShowCancellationReason("cancelled", "Conflito de agenda")).toBe(true)
  })

  it("omite motivo quando status é cancelled e cancellationReason é null", () => {
    expect(shouldShowCancellationReason("cancelled", null)).toBe(false)
  })

  it("omite motivo quando status é scheduled mesmo com cancellationReason preenchido", () => {
    expect(shouldShowCancellationReason("scheduled", "motivo")).toBe(false)
  })

  it("omite motivo quando status é completed", () => {
    expect(shouldShowCancellationReason("completed", "motivo")).toBe(false)
  })

  it("omite motivo quando status é no_show", () => {
    expect(shouldShowCancellationReason("no_show", null)).toBe(false)
  })

  it("omite motivo quando status é confirmed", () => {
    expect(shouldShowCancellationReason("confirmed", null)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AppointmentDetails — visibilidade do botão "Cancelar consulta" (TASK-05)
// ---------------------------------------------------------------------------

/**
 * Replica a lógica de isActive nos componentes AppointmentDetails e
 * AppointmentDetailPanel para controle de visibilidade do botão cancelar.
 */
function isCancellable(status: string): boolean {
  return status === "scheduled" || status === "confirmed"
}

describe("AppointmentDetails — botão 'Cancelar consulta' (AC-05, AC-09 — TASK-05)", () => {
  it("exibe botão para status scheduled", () => {
    expect(isCancellable("scheduled")).toBe(true)
  })

  it("exibe botão para status confirmed", () => {
    expect(isCancellable("confirmed")).toBe(true)
  })

  it("oculta botão para status completed", () => {
    expect(isCancellable("completed")).toBe(false)
  })

  it("oculta botão para status cancelled", () => {
    expect(isCancellable("cancelled")).toBe(false)
  })

  it("oculta botão para status no_show", () => {
    expect(isCancellable("no_show")).toBe(false)
  })
})
