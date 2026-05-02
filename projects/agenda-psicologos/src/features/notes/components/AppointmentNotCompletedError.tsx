import Link from "next/link"

interface AppointmentNotCompletedErrorProps {
  appointmentId: string
}

/**
 * Exibido quando o usuário tenta criar um prontuário para uma consulta
 * que ainda não foi realizada (status !== completed).
 */
export function AppointmentNotCompletedError({
  appointmentId,
}: AppointmentNotCompletedErrorProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5">
      <p className="text-sm font-medium text-amber-800">
        Prontuário só pode ser registrado para sessões realizadas
      </p>
      <p className="mt-1 text-sm text-amber-700">
        Marque a consulta como realizada antes de registrar o prontuário.
      </p>
      <Link
        href={`/appointments/${appointmentId}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-800 underline hover:text-amber-900"
      >
        ← Voltar para a consulta
      </Link>
    </div>
  )
}
