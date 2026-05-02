"use server"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getCurrentUser } from "@/features/auth/queries/getCurrentUser"
import { prisma } from "@/shared/lib/prisma"
import { resend } from "@/shared/lib/resend"
import { SendReminderEmailSchema } from "@/features/reminders/schema"
import { generateReminderToken } from "./generateReminderToken"

function buildEmailHtml(params: {
  patientName: string
  psychologistName: string
  scheduledAt: Date
  durationMinutes: number
  modality: string
  location: string | null
  confirmLink: string
  cancelLink: string
}): string {
  const {
    patientName,
    psychologistName,
    scheduledAt,
    durationMinutes,
    modality,
    location,
    confirmLink,
    cancelLink,
  } = params

  const datePorExtenso = format(scheduledAt, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
  const horaInicio = format(scheduledAt, "HH:mm")
  const horaFim = format(
    new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000),
    "HH:mm",
  )

  const modalidadeLabel =
    modality === "online" ? "Online" : modality === "in_person" ? "Presencial" : modality
  const locationBlock =
    location
      ? `<p style="margin:4px 0"><strong>Local/Link:</strong> ${location}</p>`
      : ""

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h2 style="color:#4f46e5">Lembrete de Consulta — PsiAgenda</h2>
  <p>Olá, <strong>${patientName}</strong>!</p>
  <p>Você tem uma consulta agendada com <strong>${psychologistName}</strong>.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
    <p style="margin:4px 0"><strong>Psicólogo(a):</strong> ${psychologistName}</p>
    <p style="margin:4px 0"><strong>Data:</strong> ${datePorExtenso}</p>
    <p style="margin:4px 0"><strong>Horário:</strong> ${horaInicio} – ${horaFim}</p>
    <p style="margin:4px 0"><strong>Modalidade:</strong> ${modalidadeLabel}</p>
    ${locationBlock}
  </div>

  <p>Por favor, confirme sua presença ou informe se precisará cancelar:</p>

  <div style="margin:24px 0;text-align:center">
    <a href="${confirmLink}"
       style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:12px">
      Confirmar presença
    </a>
    <a href="${cancelLink}"
       style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
      Preciso cancelar
    </a>
  </div>

  <p style="font-size:14px;color:#6b7280">
    Se os botões não funcionarem, copie e cole este link no seu navegador:<br>
    <a href="${confirmLink}" style="color:#4f46e5">${confirmLink}</a>
  </p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#9ca3af;text-align:center">
    Enviado por PsiAgenda · psiagenda.com.br
  </p>
</body>
</html>
  `.trim()
}

export async function sendReminderEmail(input: { appointmentId: string }): Promise<{
  success: true
  link: string
}> {
  const user = await getCurrentUser()

  const { appointmentId } = SendReminderEmailSchema.parse(input)

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
    include: { patient: true, user: true },
  })

  if (!appointment) {
    throw new Error("Consulta não encontrada")
  }

  if (!appointment.patient.email) {
    throw new Error("Paciente não tem e-mail cadastrado")
  }

  const { link } = await generateReminderToken({ appointmentId })

  const confirmLink = `${link}?action=confirmed`
  const cancelLink = `${link}?action=cancelled`

  const { error } = await resend.emails.send({
    from: "PsiAgenda <lembretes@psiagenda.com.br>",
    to: appointment.patient.email,
    subject: `Lembrete: sua consulta com ${appointment.user.name}`,
    html: buildEmailHtml({
      patientName: appointment.patient.name,
      psychologistName: appointment.user.name,
      scheduledAt: appointment.scheduledAt,
      durationMinutes: appointment.durationMinutes,
      modality: appointment.modality,
      location: appointment.location,
      confirmLink,
      cancelLink,
    }),
  })

  if (error) {
    throw new Error("Falha ao enviar e-mail. Copie o link e envie manualmente.")
  }

  return { success: true, link }
}
