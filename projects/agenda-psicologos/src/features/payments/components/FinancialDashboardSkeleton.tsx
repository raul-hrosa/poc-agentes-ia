export function FinancialDashboardSkeleton() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="animate-pulse bg-muted rounded h-24" />
        <div className="animate-pulse bg-muted rounded h-24" />
        <div className="animate-pulse bg-muted rounded h-24" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="animate-pulse bg-muted rounded h-12 w-full" />
        <div className="animate-pulse bg-muted rounded h-12 w-full" />
        <div className="animate-pulse bg-muted rounded h-12 w-full" />
        <div className="animate-pulse bg-muted rounded h-12 w-full" />
        <div className="animate-pulse bg-muted rounded h-12 w-full" />
      </div>
    </div>
  )
}
