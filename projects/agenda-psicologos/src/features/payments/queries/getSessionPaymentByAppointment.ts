import { prisma } from "@/shared/lib/prisma"
import type { SessionPayment } from "@/features/payments/types"

export async function getSessionPaymentByAppointment(
  userId: string,
  appointmentId: string
): Promise<SessionPayment | null> {
  const payment = await prisma.sessionPayment.findFirst({
    where: { appointmentId, userId },
  })

  return payment as SessionPayment | null
}
