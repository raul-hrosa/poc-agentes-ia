import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"
import Link from "next/link"

export const metadata = {
  title: "Esqueci minha senha — PsiAgenda",
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Redefinir senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviaremos as instruções para o seu e-mail
          </p>
        </div>

        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-4"
          >
            ← Voltar para login
          </Link>
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  )
}
