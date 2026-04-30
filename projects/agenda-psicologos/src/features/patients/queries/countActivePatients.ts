import { prisma } from "@/shared/lib/prisma"

/**
 * Conta pacientes ativos do psicólogo. Usado nas Server Actions para validar
 * limite do plano free antes de criar ou restaurar paciente.
 * Filtra: isActive = true, deletedAt = null
 */
export async function countActivePatients(userId: string): Promise<number> {
  return prisma.patient.count({
    where: { userId, isActive: true, deletedAt: null },
  })
}
