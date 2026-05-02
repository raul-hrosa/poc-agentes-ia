"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/shared/utils/format"
import { getFinancialDataForPeriod } from "@/features/payments/actions/getFinancialDataForPeriod"
import type { FinancialSummary, SessionPaymentWithContext, PaymentMethod } from "@/features/payments/types"

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card: "Cartão",
  transfer: "Transferência",
}

type FinancialDashboardProps = {
  summary: FinancialSummary
  payments: SessionPaymentWithContext[]
  userId: string
  initialYear: number
  initialMonth: number
}

export function FinancialDashboard({
  summary: initialSummary,
  payments: initialPayments,
  userId,
  initialYear,
  initialMonth,
}: FinancialDashboardProps) {
  const router = useRouter()

  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all")
  const [payments, setPayments] = useState<SessionPaymentWithContext[]>(initialPayments)
  const [summary, setSummary] = useState<FinancialSummary>(initialSummary)
  const [loading, setLoading] = useState(false)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const isCurrentMonth = year === currentYear && month === currentMonth

  const fetchData = useCallback(
    async (y: number, m: number, sf: "all" | "paid" | "pending") => {
      setLoading(true)
      try {
        const data = await getFinancialDataForPeriod(userId, y, m, sf)
        setSummary(data.summary)
        setPayments(data.payments)
      } catch {
        // silently fail — dados anteriores permanecem visíveis
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    // Não buscar na montagem inicial — já temos os dados do servidor
  }, [])

  function handlePrevMonth() {
    let newYear = year
    let newMonth = month - 1
    if (newMonth < 1) {
      newMonth = 12
      newYear = year - 1
    }
    setYear(newYear)
    setMonth(newMonth)
    setStatusFilter("all")
    fetchData(newYear, newMonth, "all")
  }

  function handleNextMonth() {
    if (isCurrentMonth) return
    let newYear = year
    let newMonth = month + 1
    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    }
    setYear(newYear)
    setMonth(newMonth)
    setStatusFilter("all")
    fetchData(newYear, newMonth, "all")
  }

  function handleStatusFilter(sf: "all" | "paid" | "pending") {
    setStatusFilter(sf)
    fetchData(year, month, sf)
  }

  return (
    <div className="space-y-5">
      {/* Seletor de período */}
      <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isCurrentMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      {/* Cards de resumo */}
      <div className={`grid grid-cols-3 gap-3 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <div className="rounded-xl bg-white border border-gray-200 px-4 py-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Recebido</p>
          <p className="text-base font-bold text-green-700">
            {formatCurrency(summary.totalPaidCents)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 px-4 py-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Pendente</p>
          <p className="text-base font-bold text-yellow-700">
            {formatCurrency(summary.totalPendingCents)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 px-4 py-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Sessões</p>
          <p className="text-base font-bold text-gray-900">{summary.sessionCount}</p>
        </div>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-2 rounded-xl bg-white border border-gray-200 p-1">
        {(["all", "paid", "pending"] as const).map((sf) => (
          <button
            key={sf}
            type="button"
            onClick={() => handleStatusFilter(sf)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              statusFilter === sf
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {sf === "all" ? "Todas" : sf === "paid" ? "Pagas" : "Pendentes"}
          </button>
        ))}
      </div>

      {/* Lista de sessões */}
      <div className={`rounded-xl bg-white border border-gray-200 transition-opacity ${loading ? "opacity-50" : ""}`}>
        {payments.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-500">
              Nenhuma sessão com pagamento registrado neste período.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <li key={payment.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/appointments/${payment.appointmentId}`)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left min-h-[44px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.appointment.patient.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(payment.appointment.scheduledAt), "d MMM · HH:mm", {
                        locale: ptBR,
                      })}
                      {" · "}
                      {payment.paymentMethod
                        ? PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethod]
                        : "-"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amountCents)}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        payment.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
