import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">PsiClínica</h1>
        <p className="text-muted-foreground">Gestão de consultório para psicólogos</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="px-6 py-2.5 border border-border rounded-md text-sm font-medium hover:bg-accent transition-colors"
        >
          Criar conta
        </Link>
      </div>
    </main>
  )
}
