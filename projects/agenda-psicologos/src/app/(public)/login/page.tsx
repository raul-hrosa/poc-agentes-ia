import { LoginForm } from "@/features/auth/components/LoginForm"
import Link from "next/link"

export const metadata = {
  title: "Login — PsiAgenda",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-gray-600">
            Entre na sua conta para continuar
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Criar conta grátis
          </Link>
        </p>
      </div>
    </main>
  )
}
