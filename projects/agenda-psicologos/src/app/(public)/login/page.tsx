import { Suspense } from "react"
import { LoginForm } from "@/features/auth/components/LoginForm"
import Link from "next/link"

export const metadata = {
  title: "Login — PsiAgenda",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre na sua conta para continuar
          </p>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary/80"
          >
            Criar conta grátis
          </Link>
        </p>
      </div>
    </main>
  )
}
