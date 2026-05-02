import { z } from "zod"

export const SessionPaymentFormSchema = z.object({
  appointmentId: z.string().uuid("ID da consulta inválido"),
  amountBRL: z
    .string()
    .min(1, "O valor da sessão é obrigatório")
    .transform((val) => parseFloat(val.replace(",", ".")))
    .refine((val) => !isNaN(val) && val > 0, "O valor deve ser maior que zero"),
  status: z.enum(["pending", "paid"], {
    error: "Selecione o status do pagamento",
  }),
  paymentMethod: z
    .enum(["pix", "cash", "card", "transfer"])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})

export const UpdateSessionPaymentSchema = z.object({
  paymentId: z.string().uuid("ID do pagamento inválido"),
  amountBRL: z
    .string()
    .min(1, "O valor da sessão é obrigatório")
    .transform((val) => parseFloat(val.replace(",", ".")))
    .refine((val) => !isNaN(val) && val > 0, "O valor deve ser maior que zero"),
  status: z.enum(["pending", "paid"], {
    error: "Selecione o status do pagamento",
  }),
  paymentMethod: z
    .enum(["pix", "cash", "card", "transfer"])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})
