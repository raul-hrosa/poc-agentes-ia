"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { z } from "zod"
import { ForgotPasswordSchema } from "@/features/auth/schema"
import { forgotPassword } from "@/features/auth/actions/forgotPassword"

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    await forgotPassword(values)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="rounded-full bg-green-100 w-12 h-12 flex items-center justify-center mx-auto">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Verifique seu e-mail
        </h2>
        <p className="text-sm text-muted-foreground">
          Enviamos as instruções de redefinição de senha para o e-mail
          informado.
        </p>
        <p className="text-xs text-muted-foreground">
          Não recebeu? Verifique a pasta de spam ou tente novamente.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              reset()
              setSubmitted(false)
            }}
            className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary min-h-[44px]"
          >
            Tentar novamente
          </button>
          <Link
            href="/login"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white text-center hover:bg-primary/90 min-h-[44px] flex items-center justify-center"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-1"
        >
          E-mail *
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-md border border-border px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
      >
        {isSubmitting ? "Enviando..." : "Enviar instruções"}
      </button>
    </form>
  )
}
