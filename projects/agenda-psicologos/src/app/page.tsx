import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <span className="text-xl font-bold" style={{ color: "hsl(199, 89%, 38%)" }}>
            PsiAgenda
          </span>
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "hsl(199, 89%, 38%)" }}
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            A agenda mais simples para psicólogos que estão começando
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Sem burocracia. Sem custo alto. Confirmação automática de consultas.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="w-full rounded-md px-6 py-3 text-sm font-medium text-white sm:w-auto transition-opacity hover:opacity-90"
              style={{ backgroundColor: "hsl(199, 89%, 38%)" }}
            >
              Começar grátis
            </Link>
            <Link
              href="/login"
              className="w-full rounded-md border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        {/* Benefícios */}
        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "hsl(199, 89%, 38%, 0.1)" }}>
                <svg className="h-5 w-5" style={{ color: "hsl(199, 89%, 38%)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Confirmação automática</h3>
              <p className="mt-1 text-sm text-gray-500">
                O paciente recebe um link por e-mail para confirmar ou cancelar a consulta sem precisar ligar.
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "hsl(199, 89%, 38%, 0.1)" }}>
                <svg className="h-5 w-5" style={{ color: "hsl(199, 89%, 38%)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Prontuário simples</h3>
              <p className="mt-1 text-sm text-gray-500">
                Registre notas de sessão de forma segura, acessíveis apenas por você. Sem papelada.
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "hsl(199, 89%, 38%, 0.1)" }}>
                <svg className="h-5 w-5" style={{ color: "hsl(199, 89%, 38%)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Controle financeiro</h3>
              <p className="mt-1 text-sm text-gray-500">
                Acompanhe pagamentos de sessões, valores recebidos e pendentes em um painel simples.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-4 py-6 text-center">
        <p className="text-sm text-gray-400">PsiAgenda &copy; 2026</p>
      </footer>
    </div>
  )
}
