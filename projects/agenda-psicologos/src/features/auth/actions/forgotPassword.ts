"use server"

import { randomBytes } from "node:crypto"
import { ForgotPasswordSchema } from "@/features/auth/schema"
import { getUserByEmail } from "@/features/auth/queries/getUserByEmail"
import { prisma } from "@/shared/lib/prisma"
import { resend } from "@/shared/lib/resend"

export async function forgotPassword(
  input: unknown
): Promise<{ success: true } | { error: string }> {
  const parsed = ForgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: "E-mail inválido" }
  }

  const { email } = parsed.data

  const user = await getUserByEmail(email)

  if (!user) {
    // Resposta genérica OWASP — não revelar se e-mail existe
    return { success: true }
  }

  // Invalidar tokens anteriores não expirados
  await prisma.passwordResetToken.updateMany({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  })

  const token = randomBytes(32).toString("hex")

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
    },
  })

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@psiagenda.com.br",
      to: email,
      subject: "Redefinição de senha — PsiAgenda",
      html: `
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p><a href="${resetUrl}">Clique aqui para redefinir sua senha</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
      `,
    })
  } catch {
    // Falha no envio de e-mail não deve expor erro ao usuário
  }

  return { success: true }
}
