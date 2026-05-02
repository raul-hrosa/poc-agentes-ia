import { createHmac } from "crypto"

export function generateConfirmationToken(
  appointmentId: string,
  expiresAt: Date,
): string {
  const payload = `${appointmentId}:${expiresAt.toISOString()}`
  return createHmac("sha256", process.env.APP_SECRET!).update(payload).digest("hex")
}

export function buildConfirmationLink(token: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/confirm/${token}`
}

export function getTokenExpiration(): Date {
  return new Date(Date.now() + 72 * 60 * 60 * 1000)
}
