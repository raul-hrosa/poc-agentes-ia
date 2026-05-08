import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig: NextAuthConfig = {
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
      authorize: () => null,
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
        "/financeiro",
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
}
