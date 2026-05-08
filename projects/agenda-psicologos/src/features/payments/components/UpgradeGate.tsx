import Link from "next/link"

export function UpgradeGate() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {/* Ícone de cadeado */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <span className="text-3xl" aria-hidden="true">
          🔒
        </span>
      </div>

      <h1 className="mb-3 text-xl font-bold text-foreground">
        Controle financeiro disponível no plano Pro
      </h1>

      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Saiba exatamente quanto você faturou, quais sessões estão pagas e quais
        ainda estão pendentes.
      </p>

      {/* CTA primário */}
      <Link
        href="/settings"
        className="mb-4 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Assinar plano pro — R$ 39/mês
      </Link>

      {/* Link secundário */}
      <Link
        href="/settings"
        className="text-sm text-muted-foreground underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Já assinou? Verifique sua assinatura
      </Link>
    </div>
  )
}
