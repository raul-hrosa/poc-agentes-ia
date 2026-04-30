"use server"

import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { PatientFormSchema, MAX_FREE_PATIENTS } from "@/features/patients/schema"
import { countActivePatients } from "@/features/patients/queries/countActivePatients"
import type { PatientFormInput } from "@/features/patients/schema"
import type { PatientActionResult, PatientToggleResult } from "@/features/patients/types"

async function getUserPlan(userId: string): Promise<string> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })
  return dbUser?.plan ?? "free"
}

export async function createPatient(
  input: PatientFormInput
): Promise<PatientActionResult> {
  const user = await getCurrentUser()

  const validated = PatientFormSchema.parse(input)

  const plan = await getUserPlan(user.id)
  if (plan === "free") {
    const count = await countActivePatients(user.id)
    if (count >= MAX_FREE_PATIENTS) {
      return {
        error:
          "Você atingiu o limite de 10 pacientes no plano grátis. Arquive um paciente ou faça upgrade para o plano Pro.",
      }
    }
  }

  const patient = await prisma.patient.create({
    data: {
      userId: user.id,
      name: validated.name,
      phone: validated.phone,
      birthDate: validated.birthDate ?? null,
      emergencyContactName: validated.emergencyContactName ?? null,
      emergencyContactPhone: validated.emergencyContactPhone ?? null,
      notes: validated.notes ?? null,
      isActive: true,
    },
  })

  return { success: true, patientId: patient.id }
}

export async function updatePatient(
  patientId: string,
  input: PatientFormInput
): Promise<PatientActionResult> {
  const user = await getCurrentUser()

  const validated = PatientFormSchema.parse(input)

  const existing = await prisma.patient.findFirst({
    where: { id: patientId, userId: user.id, deletedAt: null },
  })

  if (!existing) {
    return { error: "Paciente não encontrado" }
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      name: validated.name,
      phone: validated.phone,
      birthDate: validated.birthDate ?? null,
      emergencyContactName: validated.emergencyContactName ?? null,
      emergencyContactPhone: validated.emergencyContactPhone ?? null,
      notes: validated.notes ?? null,
    },
  })

  return { success: true, patientId }
}

export async function archivePatient(
  patientId: string
): Promise<PatientToggleResult> {
  const user = await getCurrentUser()

  const existing = await prisma.patient.findFirst({
    where: { id: patientId, userId: user.id, deletedAt: null },
  })

  if (!existing) {
    return { error: "Paciente não encontrado" }
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: { isActive: false },
  })

  return { success: true }
}

export async function restorePatient(
  patientId: string
): Promise<PatientToggleResult> {
  const user = await getCurrentUser()

  const existing = await prisma.patient.findFirst({
    where: { id: patientId, userId: user.id, deletedAt: null },
  })

  if (!existing) {
    return { error: "Paciente não encontrado" }
  }

  const plan = await getUserPlan(user.id)
  if (plan === "free") {
    const count = await countActivePatients(user.id)
    if (count >= MAX_FREE_PATIENTS) {
      return {
        error:
          "Limite de pacientes atingido. Arquive outro paciente ou faça upgrade para o plano Pro.",
      }
    }
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: { isActive: true },
  })

  return { success: true }
}
