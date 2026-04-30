import { prisma } from "@/shared/lib/prisma"
import { PatientListItem } from "../types"

/**
 * Retorna lista de pacientes arquivados do psicólogo autenticado.
 * Filtra: isActive = false, deletedAt = null
 * Ordena: name ASC (alfabética)
 * Projeção: PatientListItem (id, name, phone, isActive)
 */
export async function getArchivedPatients(userId: string): Promise<PatientListItem[]> {
  return prisma.patient.findMany({
    where: { userId, isActive: false, deletedAt: null },
    select: { id: true, name: true, phone: true, isActive: true },
    orderBy: { name: "asc" },
  })
}
