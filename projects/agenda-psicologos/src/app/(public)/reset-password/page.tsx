import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm"

export const metadata = {
  title: "Redefinir senha — PsiAgenda",
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Link inválido
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Este link de redefinição é inválido ou expirou. Solicite um novo
            link.
          </p>
          <a
            href="/forgot-password"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 min-h-[44px]"
          >
            Solicitar novo link
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Nova senha</h1>
          <p className="mt-2 text-sm text-gray-600">
            Digite sua nova senha abaixo
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </main>
  )
}
