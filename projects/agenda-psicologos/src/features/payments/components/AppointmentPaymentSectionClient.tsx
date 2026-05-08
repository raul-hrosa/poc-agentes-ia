"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/shared/utils/format"
import { PaymentSheet } from "./PaymentSheet"
import type { SessionPayment, PaymentMethod } from "@/features/payments/types"

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência",
}

type AppointmentPaymentSectionClientProps = {
  appointmentId: string
  patientName: string
  scheduledAt: Date
  durationMinutes: number
  payment: SessionPayment | null
}

export function AppointmentPaymentSectionClient({
  appointmentId,
  patientName,
  scheduledAt,
  durationMinutes,
  payment,
}: AppointmentPaymentSectionClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="rounded-xl bg-background shadow-sm border border-border">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">Pagamento</h2>
      </div>

      <div className="px-6 py-5">
        {payment === null ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] whitespace-nowrap"
            >
              Registrar pagamento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                {/* Badge de status */}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    payment.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {payment.status === "paid" ? "Pago" : "Pendente"}
                </span>

                {/* Valor */}
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(payment.amountCents)}
                </p>

                {/* Forma de pagamento */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Forma:{" "}
                  </span>
                  <span className="text-xs text-foreground">
                    {payment.paymentMethod
                      ? PAYMENT_METHOD_LABELS[payment.paymentMethod]
                      : "-"}
                  </span>
                </div>

                {/* Data de recebimento */}
                {payment.paidAt && (
                  <p className="text-xs text-muted-foreground">
                    Recebido em{" "}
                    {format(new Date(payment.paidAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                )}

                {/* Observações */}
                {payment.notes && (
                  <p className="text-xs text-muted-foreground italic">{payment.notes}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] whitespace-nowrap"
              >
                Editar pagamento
              </button>
            </div>
          </div>
        )}
      </div>

      {sheetOpen && (
        <PaymentSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          appointmentId={appointmentId}
          patientName={patientName}
          scheduledAt={scheduledAt}
          durationMinutes={durationMinutes}
          existingPayment={
            payment
              ? {
                  id: payment.id,
                  amountCents: payment.amountCents,
                  status: payment.status as "pending" | "paid",
                  paymentMethod: payment.paymentMethod as
                    | "pix"
                    | "cash"
                    | "card"
                    | "transfer"
                    | null,
                  notes: payment.notes,
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
