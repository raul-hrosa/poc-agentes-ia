import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/shared/lib/prisma"
import { ConfirmActionSchema } from "@/features/reminders/schema"

interface RouteContext {
  params: { token: string }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { token } = context.params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const parseResult = ConfirmActionSchema.safeParse({ token, ...body as object })
    if (!parseResult.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const { action } = parseResult.data

    const tokenRecord = await prisma.appointmentToken.findUnique({
      where: { token },
      include: { appointment: true },
    })

    if (!tokenRecord) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }

    if (tokenRecord.expiresAt <= new Date()) {
      return NextResponse.json({ error: "expired" }, { status: 410 })
    }

    if (tokenRecord.usedAt !== null) {
      return NextResponse.json(
        { error: "used", action: tokenRecord.action },
        { status: 409 },
      )
    }

    const { status } = tokenRecord.appointment
    if (
      status !== "scheduled" &&
      status !== "confirmed"
    ) {
      return NextResponse.json({ error: "appointment_closed" }, { status: 422 })
    }

    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: tokenRecord.appointmentId },
        data: { status: action === "confirmed" ? "confirmed" : "cancelled" },
      }),
      prisma.appointmentToken.update({
        where: { token },
        data: { usedAt: new Date(), action },
      }),
    ])

    return NextResponse.json({ success: true, action }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
