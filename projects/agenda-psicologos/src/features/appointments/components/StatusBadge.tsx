import type { AppointmentStatus } from "@/features/appointments/types"

interface StatusBadgeProps {
  status: AppointmentStatus
}

const statusConfig: Record<
  AppointmentStatus,
  { label: string; className: string; lineThrough?: boolean }
> = {
  scheduled: {
    label: "agendada",
    className:
      "bg-primary/10 text-primary border border-primary/30",
  },
  confirmed: {
    label: "confirmada",
    className:
      "bg-green-100 text-green-700 border border-green-200",
  },
  completed: {
    label: "realizada",
    className:
      "bg-secondary text-secondary-foreground border border-border",
  },
  cancelled: {
    label: "cancelada",
    className:
      "bg-red-100 text-red-700 border border-red-200",
    lineThrough: true,
  },
  no_show: {
    label: "falta",
    className:
      "bg-muted text-muted-foreground border border-border",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
      style={config.lineThrough ? { textDecoration: "line-through" } : undefined}
    >
      {config.label}
    </span>
  )
}
