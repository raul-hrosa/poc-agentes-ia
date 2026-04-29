import { auth } from "@/shared/lib/auth"
import type { AuthUser } from "@/features/auth/types"

export async function getCurrentUser(): Promise<AuthUser> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Não autenticado")
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  }
}
