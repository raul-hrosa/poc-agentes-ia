import Link from "next/link"
import { getPendingConfirmationCount } from "@/features/dashboard/queries/getDashboardData"

interface PendingConfirmationSectionProps {
  userId: string
}

export async function PendingConfirmationSection({
  userId,
}: PendingConfirmationSectionProps) {
  const pendingCount = await getPendingConfirmationCount(userId)

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-base font-semibold">Aguardando confirmação</h2>
      </div>
      <div className="p-4">
        {pendingCount > 0 ? (
          <Link
            href="/appointments"
            className="inline-flex items-center bg-amber-100 text-amber-800 rounded-full px-3 py-1 text-sm font-medium hover:bg-amber-200 transition-colors min-h-[44px]"
          >
            {pendingCount}{" "}
            {pendingCount === 1
              ? "consulta aguardando confirmação"
              : "consultas aguardando confirmação"}
          </Link>
        ) : (
          <span className="inline-flex items-center bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">
            0 consultas aguardando confirmação
          </span>
        )}
      </div>
    </div>
  )
}
