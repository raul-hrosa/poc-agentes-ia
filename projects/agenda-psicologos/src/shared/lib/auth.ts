import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/shared/lib/prisma"
import { authConfig } from "@/shared/lib/auth.config"

/**
 * Lógica de autorização por credenciais, extraída para permitir testes unitários.
 * Recebe email e password, valida contra o banco e retorna o usuário ou null.
 */
export async function authorizeCredentials(
  email: string | undefined,
  password: string | undefined
): Promise<{ id: string; email: string; name: string } | null> {
  if (!email || !password) return null

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, password: true },
  })

  if (!user) return null

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) return null

  return { id: user.id, email: user.email, name: user.name }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return authorizeCredentials(
          credentials?.email as string | undefined,
          credentials?.password as string | undefined
        )
      },
    }),
  ],
})
