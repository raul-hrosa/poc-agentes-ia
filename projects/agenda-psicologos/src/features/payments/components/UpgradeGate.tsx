import Link from "next/link"

export function UpgradeGate() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* Ícone de cadeado */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <span className="text-3xl" aria-hidden="true">
          🔒
        </span>
      </div>

      <h1 className="mb-3 text-xl font-bold text-gray-900">
        Controle financeiro disponível no plano Pro
      </h1>

      <p className="mb-8 max-w-sm text-sm text-gray-500">
        Saiba exatamente quanto você faturou, quais sessões estão pagas e quais
        ainda estão pendentes.
      </p>

      {/* CTA primário */}
      <Link
        href="/settings"
        className="mb-4 inline-flex min-h-[44px] items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Assinar plano pro — R$ 39/mês
      </Link>

      {/* Link secundário */}
      <Link
        href="/settings"
        className="text-sm text-gray-500 underline hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Já assinou? Verifique sua assinatura
      </Link>
    </div>
  )
}
