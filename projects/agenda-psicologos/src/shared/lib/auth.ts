import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/shared/lib/prisma"

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
  adapter: PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
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
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const protectedPaths = [
        "/dashboard",
        "/patients",
        "/appointments",
        "/notes",
        "/payments",
        "/settings",
      ]
      const isProtectedRoute = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      )
      const isPublicAuthPage = ["/login", "/register"].includes(
        nextUrl.pathname
      )

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(
          new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl)
        )
      }
      if (isPublicAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
  },
})
