import { redirect } from "next/navigation"
import { auth } from "@/shared/lib/auth"
import { UserMenu } from "@/features/auth/components/UserMenu"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <span className="text-lg font-bold text-blue-600">PsiAgenda</span>
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
