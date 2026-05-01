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
