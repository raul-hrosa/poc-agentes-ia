import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"
import Link from "next/link"

export const metadata = {
  title: "Esqueci minha senha — PsiAgenda",
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Redefinir senha</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enviaremos as instruções para o seu e-mail
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500 mb-4"
          >
            ← Voltar para login
          </Link>
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  )
}
