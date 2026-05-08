import { RegisterForm } from "@/features/auth/components/RegisterForm"
import Link from "next/link"

export const metadata = {
  title: "Criar conta — PsiAgenda",
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Crie sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece a gerenciar sua agenda gratuitamente
          </p>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <RegisterForm />
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </main>
  )
}
