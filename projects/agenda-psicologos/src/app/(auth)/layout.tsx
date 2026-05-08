import { redirect } from "next/navigation"
import { auth } from "@/shared/lib/auth"
import { SidebarNav } from "@/app/(auth)/_components/SidebarNav"
import { Toaster } from "sonner"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />
      <main className="md:ml-56 px-4 py-6 md:px-8 min-h-screen transition-all duration-200 ease-in-out">
        {children}
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
