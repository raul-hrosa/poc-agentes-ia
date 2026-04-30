import { prisma } from "@/shared/lib/prisma"
import { PatientListItem } from "../types"

/**
 * Retorna lista de pacientes ativos do psicólogo autenticado.
 * Filtra: isActive = true, deletedAt = null
 * Ordena: name ASC (alfabética)
 * Projeção: PatientListItem (id, name, phone, isActive)
 */
export async function getActivePatients(userId: string): Promise<PatientListItem[]> {
  return prisma.patient.findMany({
    where: { userId, isActive: true, deletedAt: null },
    select: { id: true, name: true, phone: true, isActive: true },
    orderBy: { name: "asc" },
  })
}
