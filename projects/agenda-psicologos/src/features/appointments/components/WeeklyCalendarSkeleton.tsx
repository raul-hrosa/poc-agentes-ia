import { Skeleton } from "@/components/ui/skeleton"

export function WeeklyCalendarSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
