"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { addMinutes } from "date-fns"
import { toast } from "sonner"
import { createSessionPayment } from "@/features/payments/actions/createSessionPayment"
import { updateSessionPayment } from "@/features/payments/actions/updateSessionPayment"

type PaymentSheetProps = {
  open: boolean
  onClose: () => void
  appointmentId: string
  patientName: string
  scheduledAt: Date
  durationMinutes: number
  existingPayment?: {
    id: string
    amountCents: number
    status: "pending" | "paid"
    paymentMethod: "pix" | "cash" | "card" | "transfer" | null
    notes: string | null
  }
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência",
}

export function PaymentSheet({
  open,
  onClose,
  appointmentId,
  patientName,
  scheduledAt,
  durationMinutes,
  existingPayment,
}: PaymentSheetProps) {
  const isEditing = existingPayment !== undefined

  const initialAmount = isEditing
    ? (existingPayment.amountCents / 100).toFixed(2).replace(".", ",")
    : ""
  const initialStatus = isEditing ? existingPayment.status : "pending"
  const initialMethod = isEditing ? (existingPayment.paymentMethod ?? "") : ""
  const initialNotes = isEditing ? (existingPayment.notes ?? "") : ""

  const [amount, setAmount] = useState(initialAmount)
  const [status, setStatus] = useState<"pending" | "paid">(initialStatus)
  const [paymentMethod, setPaymentMethod] = useState(initialMethod)
  const [notes, setNotes] = useState(initialNotes)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const startTime = new Date(scheduledAt)
  const endTime = addMinutes(startTime, durationMinutes)
  const dateLabel = format(startTime, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const timeLabel = `${format(startTime, "HH:mm")} – ${format(endTime, "HH:mm")}`

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setSubmitting(true)

    try {
      let result
      if (isEditing) {
        result = await updateSessionPayment({
          paymentId: existingPayment!.id,
          amountBRL: amount,
          status,
          paymentMethod: paymentMethod || null,
          notes: notes || null,
        })
      } else {
        result = await createSessionPayment({
          appointmentId,
          amountBRL: amount,
          status,
          paymentMethod: paymentMethod || null,
          notes: notes || null,
        })
      }

      if ("success" in result && result.success) {
        toast.success(isEditing ? "Pagamento atualizado" : "Pagamento registrado")
        onClose()
      } else if ("fieldErrors" in result) {
        setFieldErrors(result.fieldErrors)
      } else if ("error" in result) {
        toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
        onClose()
      }
    } catch {
      toast.error("Algo deu errado. Tente novamente.", { duration: Infinity })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-background flex flex-col h-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? "Editar pagamento" : "Registrar pagamento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Context (read-only) */}
        <div className="px-4 py-3 bg-secondary border-b border-border">
          <p className="text-sm font-medium text-foreground">{patientName}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{dateLabel}</p>
          <p className="text-xs text-muted-foreground">{timeLabel}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex-1 px-4 py-5 space-y-5">
            {/* Valor */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
                aria-describedby={fieldErrors.amountBRL ? "amount-error" : undefined}
              />
              {fieldErrors.amountBRL && (
                <p id="amount-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.amountBRL[0]}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <p className="block text-sm font-medium text-foreground mb-2">
                Status <span className="text-red-500">*</span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("pending")}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] ${
                    status === "pending"
                      ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("paid")}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] ${
                    status === "paid"
                      ? "border-green-400 bg-green-50 text-green-800"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  Pago
                </button>
              </div>
            </div>

            {/* Forma de pagamento */}
            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Forma de pagamento
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
              >
                <option value="">Não informar</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Observações */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Observações
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ex: paciente pagou metade"
                className="w-full rounded-lg border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="border-t border-border px-4 py-4 space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
            >
              {submitting ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
