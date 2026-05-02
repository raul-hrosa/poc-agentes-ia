"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { SessionPaymentFormSchema } from "@/features/payments/schema"
import type { PaymentActionResult } from "@/features/payments/types"

export async function createSessionPayment(
  input: unknown
): Promise<PaymentActionResult> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Não autenticado")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  })

  if (!dbUser || dbUser.plan !== "pro") {
    return { error: "plan_required" }
  }

  const result = SessionPaymentFormSchema.safeParse(input)
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { appointmentId, amountBRL, status, paymentMethod, notes } = result.data

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id, deletedAt: null },
    select: { id: true, status: true },
  })

  if (!appointment) {
    return { error: "not_found" }
  }

  if (appointment.status !== "completed") {
    return { error: "invalid_status" }
  }

  const existing = await prisma.sessionPayment.findUnique({
    where: { appointmentId },
  })

  if (existing) {
    return { error: "not_found" }
  }

  const amountCents = Math.round(amountBRL * 100)
  const paidAt = status === "paid" ? new Date() : null

  await prisma.sessionPayment.create({
    data: {
      userId: user.id,
      appointmentId,
      amountCents,
      status,
      paidAt,
      paymentMethod: paymentMethod ?? null,
      notes: notes ?? null,
    },
  })

  revalidatePath("/financeiro")
  revalidatePath(`/appointments/${appointmentId}`)

  return { success: true }
}
