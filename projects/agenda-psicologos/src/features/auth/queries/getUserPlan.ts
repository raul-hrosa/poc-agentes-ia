import { prisma } from "@/shared/lib/prisma"

export async function getUserPlan(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  return user?.plan ?? "free"
}
