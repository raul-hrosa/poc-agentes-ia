import { Skeleton } from "@/components/ui/skeleton"

export function NoteViewSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-36" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}
