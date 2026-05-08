"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { toast } from "sonner"
import { ResetPasswordSchema } from "@/features/auth/schema"
import { resetPassword } from "@/features/auth/actions/resetPassword"

type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>

const TOKEN_ERRORS = new Set(["Token inválido", "Token expirado", "Token já utilizado"])

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setTokenError(null)
    const result = await resetPassword(values)

    if ("success" in result) {
      toast.success("Senha redefinida com sucesso")
      router.push("/dashboard")
      return
    }

    if ("error" in result) {
      setTokenError(result.error)
      return
    }

    if ("fieldErrors" in result) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        setError(field as keyof ResetPasswordFormValues, {
          message: messages[0],
        })
      }
    }
  }

  if (tokenError && TOKEN_ERRORS.has(tokenError)) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-600">
          Este link de redefinição é inválido ou expirou. Solicite um novo link.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 min-h-[44px]"
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <input type="hidden" {...register("token")} />

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Nova senha *
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="w-full rounded-md border border-border px-3 py-2 pr-10 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-0 top-0 flex h-full min-h-[44px] w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Confirmar nova senha *
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            className="w-full rounded-md border border-border px-3 py-2 pr-10 text-sm shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-0 top-0 flex h-full min-h-[44px] w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>
        {errors.confirmPassword && (
          <p
            id="confirmPassword-error"
            className="mt-1 text-xs text-red-600"
            role="alert"
          >
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
      >
        {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
      </button>
    </form>
  )
}
