/**
 * Formata string de dígitos para exibição de telefone.
 * 10 dígitos: (XX) XXXX-XXXX
 * 11 dígitos: (XX) XXXXX-XXXX
 * Outros: retorna a string original sem formatação
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  return phone
}

/**
 * Gera um preview truncado do conteúdo do prontuário.
 * Remove espaços e quebras de linha do início antes de truncar (RN-09).
 * Se o conteúdo tiver mais de maxLength caracteres, adiciona "...".
 */
export function truncateNotePreview(content: string, maxLength = 150): string {
  const trimmed = content.replace(/^\s+/, "")
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.slice(0, maxLength) + "..."
}

/**
 * Calcula a idade em anos completos a partir de uma data de nascimento.
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/**
 * Converte centavos para string formatada em BRL: 15000 → "R$ 150,00"
 */
export function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100)
}

/**
 * Converte valor BRL numérico para centavos: 150 → 15000
 */
export function parseCurrencyToCents(amountBRL: number): number {
  return Math.round(amountBRL * 100)
}
