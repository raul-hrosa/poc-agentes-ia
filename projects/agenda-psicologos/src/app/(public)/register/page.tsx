import { RegisterForm } from "@/features/auth/components/RegisterForm"
import Link from "next/link"

export const metadata = {
  title: "Criar conta — PsiAgenda",
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Crie sua conta</h1>
          <p className="mt-2 text-sm text-gray-600">
            Comece a gerenciar sua agenda gratuitamente
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <RegisterForm />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </main>
  )
}
