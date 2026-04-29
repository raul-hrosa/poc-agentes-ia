"use server"

import bcrypt from "bcryptjs"
import { ResetPasswordSchema } from "@/features/auth/schema"
import { prisma } from "@/shared/lib/prisma"
import { signIn } from "@/shared/lib/auth"

type ResetPasswordResult =
  | { success: true }
  | { error: string }
  | { fieldErrors: Record<string, string[]> }

export async function resetPassword(
  input: unknown
): Promise<ResetPasswordResult> {
  const parsed = ResetPasswordSchema.safeParse(input)

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const [field, errors] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      fieldErrors[field] = errors ?? []
    }
    return { fieldErrors }
  }

  const { token, password } = parsed.data

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!tokenRecord) {
    return { error: "Token inválido" }
  }

  if (tokenRecord.expiresAt < new Date()) {
    return { error: "Token expirado" }
  }

  if (tokenRecord.usedAt !== null) {
    return { error: "Token já utilizado" }
  }

  const hash = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { email: tokenRecord.email },
      data: { password: hash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ])

  await signIn("credentials", {
    email: tokenRecord.email,
    password,
    redirect: false,
  })

  return { success: true }
}
