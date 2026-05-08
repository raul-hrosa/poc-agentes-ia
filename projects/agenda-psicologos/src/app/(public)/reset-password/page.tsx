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
      <main className="min-h-screen flex items-center justify-center bg-secondary px-4 py-8">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Link inválido
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Este link de redefinição é inválido ou expirou. Solicite um novo
            link.
          </p>
          <a
            href="/forgot-password"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 min-h-[44px]"
          >
            Solicitar novo link
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Digite sua nova senha abaixo
          </p>
        </div>
        <div className="bg-background rounded-lg shadow-sm border border-border p-6">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </main>
  )
}
