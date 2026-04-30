import { prisma } from "@/shared/lib/prisma"
import { PatientProfile } from "../types"

/**
 * Retorna o perfil completo de um paciente pelo id.
 * Filtra: userId obrigatório para isolamento (RN-06).
 * Se o paciente não existir OU pertencer a outro userId: retorna null.
 * O chamador (page.tsx) deve chamar notFound() se retornar null.
 * Projeção: PatientProfile (todos os campos exceto userId e deletedAt)
 */
export async function getPatientById(
  userId: string,
  patientId: string
): Promise<PatientProfile | null> {
  return prisma.patient.findFirst({
    where: { id: patientId, userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      phone: true,
      birthDate: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      notes: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
