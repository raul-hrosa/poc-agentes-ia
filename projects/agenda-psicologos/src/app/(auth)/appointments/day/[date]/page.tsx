import { redirect } from "next/navigation"
import { parseISO, isValid } from "date-fns"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { getDayAppointments } from "@/features/appointments/queries/getDayAppointments"
import { DayView } from "@/features/appointments/components/DayView"

interface DayPageProps {
  params: {
    date: string
  }
}

/**
 * Página de visualização diária de consultas.
 * Rota: /appointments/day/[date] (YYYY-MM-DD)
 */
export default async function DayPage({ params }: DayPageProps) {
  // Valida o formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(params.date)) {
    redirect("/appointments")
  }

  const parsedDate = parseISO(params.date)
  if (!isValid(parsedDate)) {
    redirect("/appointments")
  }

  const user = await getCurrentUser()
  const appointments = await getDayAppointments(user.id, parsedDate)

  return <DayView appointments={appointments} date={parsedDate} />
}
