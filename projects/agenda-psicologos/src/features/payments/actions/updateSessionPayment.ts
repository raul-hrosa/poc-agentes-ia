"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { UpdateSessionPaymentSchema } from "@/features/payments/schema"
import type { PaymentActionResult } from "@/features/payments/types"

export async function updateSessionPayment(
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

  const result = UpdateSessionPaymentSchema.safeParse(input)
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { paymentId, amountBRL, status, paymentMethod, notes } = result.data

  const payment = await prisma.sessionPayment.findFirst({
    where: { id: paymentId, userId: user.id },
    select: { id: true, appointmentId: true },
  })

  if (!payment) {
    return { error: "not_found" }
  }

  const amountCents = Math.round(amountBRL * 100)
  const paidAt = status === "paid" ? new Date() : null

  await prisma.sessionPayment.update({
    where: { id: paymentId },
    data: {
      amountCents,
      status,
      paidAt,
      paymentMethod: paymentMethod ?? null,
      notes: notes ?? null,
    },
  })

  revalidatePath("/financeiro")
  revalidatePath(`/appointments/${payment.appointmentId}`)

  return { success: true }
}
