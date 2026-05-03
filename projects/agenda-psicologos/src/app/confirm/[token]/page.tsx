import { getTokenForConfirmPage } from "@/features/reminders/queries/getTokenForConfirmPage"
import { ConfirmPageClient } from "@/features/reminders/components/ConfirmPageClient"

interface ConfirmPageProps {
  params: { token: string }
  searchParams: { action?: string }
}

export default async function ConfirmPage({
  params,
  searchParams,
}: ConfirmPageProps) {
  const result = await getTokenForConfirmPage(params.token)

  if (!result.valid) {
    if (result.reason === "not_found") {
      return (
        <ConfirmPageLayout>
          <ErrorCard
            title="Link inválido."
            description="Este link não existe ou já foi removido. Entre em contato com seu psicólogo para obter um novo link."
          />
        </ConfirmPageLayout>
      )
    }

    if (result.reason === "expired") {
      return (
        <ConfirmPageLayout>
          <ErrorCard
            title="Este link expirou."
            description="O link de confirmação expirou após 72 horas. Entre em contato com seu psicólogo para solicitar um novo link."
          />
        </ConfirmPageLayout>
      )
    }

    if (result.reason === "used") {
      const message =
        result.action === "confirmed"
          ? "Você já confirmou sua presença."
          : "Você já cancelou esta consulta."
      return (
        <ConfirmPageLayout>
          <ErrorCard
            title="Este link já foi utilizado."
            description={message}
          />
        </ConfirmPageLayout>
      )
    }

    if (result.reason === "appointment_closed") {
      return (
        <ConfirmPageLayout>
          <ErrorCard
            title="Consulta indisponível."
            description="Esta consulta não está mais disponível para confirmação."
          />
        </ConfirmPageLayout>
      )
    }
  }

  if (!result.valid) {
    return null
  }

  const rawAction = searchParams.action
  const preselectedAction: "confirmed" | "cancelled" | null =
    rawAction === "confirmed" || rawAction === "cancelled" ? rawAction : null

  return (
    <ConfirmPageLayout>
      <ConfirmPageClient data={result} preselectedAction={preselectedAction} />
    </ConfirmPageLayout>
  )
}

function ConfirmPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header isolado — sem menu de navegação */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="mx-auto max-w-md">
          <span className="text-lg font-bold text-indigo-700">PsiAgenda</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}

function ErrorCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 text-center">
      <h1 className="text-lg font-semibold text-gray-900 mb-2">{title}</h1>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
