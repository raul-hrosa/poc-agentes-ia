"use server"

import bcrypt from "bcryptjs"
import { RegisterSchema } from "@/features/auth/schema"
import { getUserByEmail } from "@/features/auth/queries/getUserByEmail"
import { prisma } from "@/shared/lib/prisma"
import { signIn } from "@/shared/lib/auth"

type RegisterResult =
  | { success: true }
  | { error: string }
  | { fieldErrors: Record<string, string[]> }

export async function registerUser(
  input: unknown
): Promise<RegisterResult> {
  const parsed = RegisterSchema.safeParse(input)

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const [field, errors] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      fieldErrors[field] = errors ?? []
    }
    return { fieldErrors }
  }

  const { name, email, password } = parsed.data

  const existing = await getUserByEmail(email)
  if (existing) {
    return {
      fieldErrors: {
        email: ["Este e-mail já está cadastrado. Tente fazer login."],
      },
    }
  }

  const hash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, password: hash },
  })

  await signIn("credentials", { email, password, redirect: false })

  return { success: true }
}
