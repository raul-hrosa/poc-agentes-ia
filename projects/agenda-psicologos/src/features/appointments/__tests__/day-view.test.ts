import { describe, it, expect } from "vitest"
import { parseISO, isValid, addMinutes, format } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Testes de lógica pura da visualização diária (TASK-06).
 * Cobre: validação de data, cálculo de horário de término e formatação.
 */

// ---------------------------------------------------------------------------
// validateDateParam — lógica extraída de day/[date]/page.tsx
// ---------------------------------------------------------------------------

function validateDateParam(dateParam: string): Date | null {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateParam)) return null
  const parsed = parseISO(dateParam)
  if (!isValid(parsed)) return null
  return parsed
}

describe("validateDateParam", () => {
  it("retorna Date válida para formato YYYY-MM-DD correto", () => {
    const result = validateDateParam("2026-05-02")
    expect(result).not.toBeNull()
    expect(isValid(result!)).toBe(true)
  })

  it("retorna null para formato inválido sem hifens", () => {
    expect(validateDateParam("20260502")).toBeNull()
  })

  it("retorna null para string vazia", () => {
    expect(validateDateParam("")).toBeNull()
  })

  it("retorna null para formato DD/MM/YYYY", () => {
    expect(validateDateParam("02/05/2026")).toBeNull()
  })

  it("retorna null para data inválida com formato correto", () => {
    expect(validateDateParam("2026-13-99")).toBeNull()
  })

  it("retorna null para texto aleatório", () => {
    expect(validateDateParam("invalid-date")).toBeNull()
  })

  it("retorna null para data parcial", () => {
    expect(validateDateParam("2026-05")).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// calcEndTime — cálculo de horário de término (RN-10)
// ---------------------------------------------------------------------------

function calcEndTime(scheduledAt: Date, durationMinutes: number): Date {
  return addMinutes(scheduledAt, durationMinutes)
}

describe("calcEndTime (RN-10)", () => {
  it("calcula horário de término corretamente para 50 minutos", () => {
    const start = parseISO("2026-05-02T09:00:00")
    const end = calcEndTime(start, 50)
    expect(format(end, "HH:mm")).toBe("09:50")
  })

  it("calcula horário de término passando para a próxima hora", () => {
    const start = parseISO("2026-05-02T09:30:00")
    const end = calcEndTime(start, 60)
    expect(format(end, "HH:mm")).toBe("10:30")
  })

  it("calcula horário de término para duração de 1 hora e 30 minutos", () => {
    const start = parseISO("2026-05-02T14:00:00")
    const end = calcEndTime(start, 90)
    expect(format(end, "HH:mm")).toBe("15:30")
  })

  it("calcula horário de término para duração de 1 minuto", () => {
    const start = parseISO("2026-05-02T08:00:00")
    const end = calcEndTime(start, 1)
    expect(format(end, "HH:mm")).toBe("08:01")
  })

  it("calcula horário de término passando para o próximo dia", () => {
    const start = parseISO("2026-05-02T23:00:00")
    const end = calcEndTime(start, 90)
    expect(format(end, "yyyy-MM-dd HH:mm")).toBe("2026-05-03 00:30")
  })
})

// ---------------------------------------------------------------------------
// formatDayHeader — formatação de cabeçalho em pt-BR
// ---------------------------------------------------------------------------

function formatDayHeader(date: Date): string {
  const weekday = format(date, "EEEE", { locale: ptBR })
  const dayMonth = format(date, "d MMM yyyy", { locale: ptBR })
  const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${weekdayCapitalized}, ${dayMonth}`
}

describe("formatDayHeader", () => {
  it("formata data de quinta-feira corretamente em pt-BR", () => {
    const date = parseISO("2026-04-30") // quinta-feira
    const result = formatDayHeader(date)
    expect(result).toContain("Quinta")
    expect(result).toContain("30")
  })

  it("capitaliza o primeiro caractere do dia da semana", () => {
    const date = parseISO("2026-05-04") // segunda-feira
    const result = formatDayHeader(date)
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase())
  })

  it("inclui mês abreviado em português", () => {
    const date = parseISO("2026-05-02") // maio
    const result = formatDayHeader(date)
    expect(result.toLowerCase()).toContain("mai")
  })

  it("inclui o ano", () => {
    const date = parseISO("2026-05-02")
    const result = formatDayHeader(date)
    expect(result).toContain("2026")
  })
})

// ---------------------------------------------------------------------------
// AppointmentDetailPanel — lógica de exibição de ações conforme status
// ---------------------------------------------------------------------------

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

function getActionsForStatus(status: AppointmentStatus): string[] {
  if (status === "scheduled" || status === "confirmed") {
    return ["complete", "no_show", "edit", "cancel"]
  }
  if (status === "completed") {
    return ["notes"]
  }
  return [] // cancelled, no_show — sem ações (AC-26, AC-30)
}

describe("getActionsForStatus (RN-03, RN-04)", () => {
  it("scheduled permite completar, no-show, editar e cancelar", () => {
    const actions = getActionsForStatus("scheduled")
    expect(actions).toContain("complete")
    expect(actions).toContain("no_show")
    expect(actions).toContain("edit")
    expect(actions).toContain("cancel")
  })

  it("confirmed permite completar, no-show, editar e cancelar", () => {
    const actions = getActionsForStatus("confirmed")
    expect(actions).toContain("complete")
    expect(actions).toContain("no_show")
    expect(actions).toContain("edit")
    expect(actions).toContain("cancel")
  })

  it("completed exibe apenas link de notas (prontuário)", () => {
    const actions = getActionsForStatus("completed")
    expect(actions).toEqual(["notes"])
    expect(actions).not.toContain("complete")
    expect(actions).not.toContain("cancel")
    expect(actions).not.toContain("edit")
  })

  it("cancelled não exibe nenhuma ação (AC-26)", () => {
    const actions = getActionsForStatus("cancelled")
    expect(actions).toHaveLength(0)
  })

  it("no_show não exibe nenhuma ação (AC-30)", () => {
    const actions = getActionsForStatus("no_show")
    expect(actions).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// hasNote — lógica de exibição do link correto para prontuário (AC-29)
// ---------------------------------------------------------------------------

function getNotesAction(hasNote: boolean): string {
  return hasNote ? "Ver prontuário" : "Registrar prontuário"
}

describe("getNotesAction (AC-29)", () => {
  it("retorna 'Ver prontuário' quando hasNote é true", () => {
    expect(getNotesAction(true)).toBe("Ver prontuário")
  })

  it("retorna 'Registrar prontuário' quando hasNote é false", () => {
    expect(getNotesAction(false)).toBe("Registrar prontuário")
  })
})
