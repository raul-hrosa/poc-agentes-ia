import { describe, it, expect, vi, afterEach } from "vitest"
import { formatPhone, calculateAge, truncateNotePreview, formatCurrency, parseCurrencyToCents } from "./format"

// ---------------------------------------------------------------------------
// truncateNotePreview
// ---------------------------------------------------------------------------
describe("truncateNotePreview", () => {
  it("retorna o conteúdo sem alteração quando é menor que maxLength", () => {
    const content = "Sessão tranquila."
    expect(truncateNotePreview(content)).toBe("Sessão tranquila.")
  })

  it("trunca o conteúdo com '...' quando excede maxLength", () => {
    const content = "a".repeat(200)
    const result = truncateNotePreview(content)
    expect(result).toBe("a".repeat(150) + "...")
    expect(result.length).toBe(153)
  })

  it("remove quebras de linha do início antes de truncar (RN-09)", () => {
    const content = "\n\nConteúdo com quebra de linha no início"
    const result = truncateNotePreview(content)
    expect(result).toBe("Conteúdo com quebra de linha no início")
  })

  it("remove espaços em branco do início antes de truncar", () => {
    const content = "   Conteúdo com espaços no início"
    const result = truncateNotePreview(content)
    expect(result).toBe("Conteúdo com espaços no início")
  })

  it("usa maxLength personalizado quando fornecido", () => {
    const content = "abcdefghij"
    expect(truncateNotePreview(content, 5)).toBe("abcde...")
  })

  it("retorna string vazia quando conteúdo é apenas espaços", () => {
    expect(truncateNotePreview("   ")).toBe("")
  })
})

// ---------------------------------------------------------------------------
// formatPhone
// ---------------------------------------------------------------------------
describe("formatPhone", () => {
  it("formata número com 10 dígitos no padrão (XX) XXXX-XXXX", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444")
  })

  it("formata número com 11 dígitos no padrão (XX) XXXXX-XXXX", () => {
    expect(formatPhone("11999990001")).toBe("(11) 99999-0001")
  })

  it("retorna string original quando número tem menos de 10 dígitos", () => {
    expect(formatPhone("119999")).toBe("119999")
  })

  it("retorna string original quando número tem mais de 11 dígitos", () => {
    expect(formatPhone("119999900011")).toBe("119999900011")
  })

  it("extrai apenas dígitos antes de formatar (ignora traços e parênteses)", () => {
    expect(formatPhone("(11) 3333-4444")).toBe("(11) 3333-4444")
  })

  it("formata número com 11 dígitos separando 5 dígitos antes do traço", () => {
    expect(formatPhone("11988880002")).toBe("(11) 98888-0002")
  })
})

// ---------------------------------------------------------------------------
// calculateAge
// ---------------------------------------------------------------------------
describe("calculateAge", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("calcula idade correta quando aniversário já ocorreu no ano corrente", () => {
    // Hoje: 2026-06-15, nascimento: 1990-03-10 → 36 anos
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-15"))

    const result = calculateAge(new Date("1990-03-10"))

    expect(result).toBe(36)
  })

  it("calcula idade correta quando aniversário ainda não ocorreu no ano corrente", () => {
    // Hoje: 2026-03-01, nascimento: 1990-03-10 → ainda não fez 36 (ainda 35)
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-01"))

    const result = calculateAge(new Date("1990-03-10"))

    expect(result).toBe(35)
  })

  it("calcula idade 0 quando recém-nascido (mesmo ano, nascimento antes de hoje)", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-15"))

    const result = calculateAge(new Date("2026-01-01"))

    expect(result).toBe(0)
  })

  it("calcula idade correta para aniversário no dia de hoje", () => {
    // Hoje é exatamente o aniversário — já fez anos
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-01"))

    const result = calculateAge(new Date("1990-05-01"))

    expect(result).toBe(36)
  })

  it("decrementa um ano quando o mês de nascimento ainda não chegou no ano corrente", () => {
    // Hoje: 2026-02-28, nascimento: 1985-12-15 → 40 anos (2026-1985=41 mas dezembro ainda não chegou)
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-02-28"))

    const result = calculateAge(new Date("1985-12-15"))

    expect(result).toBe(40)
  })
})

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe("formatCurrency", () => {
  it("formata 15000 centavos como R$ 150,00", () => {
    const result = formatCurrency(15000)
    expect(result).toContain("150,00")
    expect(result).toContain("R$")
  })

  it("formata 0 centavos como R$ 0,00", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0,00")
  })

  it("formata 100 centavos como R$ 1,00", () => {
    const result = formatCurrency(100)
    expect(result).toContain("1,00")
  })

  it("formata 1999 centavos como R$ 19,99", () => {
    const result = formatCurrency(1999)
    expect(result).toContain("19,99")
  })
})

// ---------------------------------------------------------------------------
// parseCurrencyToCents
// ---------------------------------------------------------------------------
describe("parseCurrencyToCents", () => {
  it("converte 150 para 15000 centavos", () => {
    expect(parseCurrencyToCents(150)).toBe(15000)
  })

  it("converte 0 para 0 centavos", () => {
    expect(parseCurrencyToCents(0)).toBe(0)
  })

  it("arredonda corretamente para evitar problemas de ponto flutuante", () => {
    expect(parseCurrencyToCents(150.5)).toBe(15050)
  })

  it("converte 1.99 para 199 centavos", () => {
    expect(parseCurrencyToCents(1.99)).toBe(199)
  })
})
