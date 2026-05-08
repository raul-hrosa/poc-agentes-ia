// DEV CREDENTIALS:
// Email: dev@psiagenda.com
// Senha: Dev@12345

import { config } from "dotenv"
import { resolve } from "path"

// OBRIGATÓRIO: carregar .env.local explicitamente antes de qualquer import do Prisma
config({ path: resolve(__dirname, "../.env.local") })

import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import bcrypt from "bcryptjs"

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Limpando dados existentes...")

  // Deletar na ordem correta (respeitar foreign keys)
  await prisma.sessionPayment.deleteMany()
  await prisma.sessionNote.deleteMany()
  await prisma.appointmentToken.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  console.log("Criando usuário de desenvolvimento...")
  // DEV: dev@psiagenda.com / Dev@12345
  const passwordHash = await bcrypt.hash("Dev@12345", 10)

  const user = await prisma.user.create({
    data: {
      email: "dev@psiagenda.com",
      name: "Dra. Ana Lima",
      password: passwordHash,
      crp: "06/123456",
      phone: "(11) 99999-0000",
      plan: "pro",
    },
  })

  console.log(`Usuário criado: ${user.email}`)

  console.log("Criando pacientes...")

  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        userId: user.id,
        name: "João Souza",
        phone: "(11) 98888-1111",
        email: "joao.souza@email.com",
        birthDate: new Date("1990-03-15"),
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        name: "Maria Fernanda Costa",
        phone: "(11) 97777-2222",
        email: "maria.fernanda@email.com",
        birthDate: new Date("1985-07-22"),
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        name: "Carlos Lima",
        phone: "(11) 96666-3333",
        email: "carlos.lima@email.com",
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        name: "Beatriz Santos",
        phone: "(11) 95555-4444",
        email: "beatriz.santos@email.com",
        birthDate: new Date("1998-11-08"),
      },
    }),
    prisma.patient.create({
      data: {
        userId: user.id,
        name: "Roberto Alves",
        phone: "(11) 94444-5555",
      },
    }),
  ])

  console.log(`${patients.length} pacientes criados`)

  console.log("Criando consultas...")

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  function dateAt(offsetDays: number, hour: number, minute = 0): Date {
    const d = new Date(today)
    d.setDate(d.getDate() + offsetDays)
    d.setHours(hour, minute, 0, 0)
    return d
  }

  const appointments = await Promise.all([
    // Hoje — 2 consultas
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[0].id,
        scheduledAt: dateAt(0, 9, 0),
        durationMinutes: 50,
        modality: "in_person",
        status: "scheduled",
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[1].id,
        scheduledAt: dateAt(0, 11, 0),
        durationMinutes: 50,
        modality: "online",
        status: "confirmed",
      },
    }),

    // Próximos 7 dias — 3 consultas
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[2].id,
        scheduledAt: dateAt(1, 14, 0),
        durationMinutes: 50,
        modality: "in_person",
        status: "scheduled",
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[3].id,
        scheduledAt: dateAt(3, 10, 0),
        durationMinutes: 50,
        modality: "in_person",
        status: "scheduled",
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[4].id,
        scheduledAt: dateAt(5, 15, 0),
        durationMinutes: 50,
        modality: "online",
        status: "scheduled",
      },
    }),

    // Semana passada — 3 consultas (2 completed, 1 no_show)
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[0].id,
        scheduledAt: dateAt(-7, 9, 0),
        durationMinutes: 50,
        modality: "in_person",
        status: "completed",
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[1].id,
        scheduledAt: dateAt(-5, 11, 0),
        durationMinutes: 50,
        modality: "online",
        status: "completed",
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[2].id,
        scheduledAt: dateAt(-3, 14, 0),
        durationMinutes: 50,
        modality: "in_person",
        status: "no_show",
      },
    }),

    // Canceladas no passado — 2 consultas
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[3].id,
        scheduledAt: dateAt(-10, 10, 0),
        durationMinutes: 50,
        modality: "in_person",
        status: "cancelled",
        cancellationReason: "Paciente solicitou remarcação",
      },
    }),
    prisma.appointment.create({
      data: {
        userId: user.id,
        patientId: patients[4].id,
        scheduledAt: dateAt(-14, 15, 0),
        durationMinutes: 50,
        modality: "online",
        status: "cancelled",
        cancellationReason: "Conflito de horário",
      },
    }),
  ])

  console.log(`${appointments.length} consultas criadas`)

  // 1 session note para a primeira consulta completed
  const completedAppointment = appointments[5] // dateAt(-7) — João Souza
  await prisma.sessionNote.create({
    data: {
      userId: user.id,
      appointmentId: completedAppointment.id,
      content:
        "Sessão produtiva. Paciente relatou melhora na qualidade do sono após as técnicas de respiração. Apresentou menos episódios de ansiedade na semana. Planejar próximas 3 sessões focando em reestruturação cognitiva.",
    },
  })

  console.log("Nota de sessão criada")

  // 1 session payment para a segunda consulta completed (status: paid)
  const secondCompleted = appointments[6] // dateAt(-5) — Maria Fernanda
  await prisma.sessionPayment.create({
    data: {
      userId: user.id,
      appointmentId: secondCompleted.id,
      amountCents: 20000, // R$ 200,00
      status: "paid",
      paidAt: dateAt(-4, 9, 0),
      paymentMethod: "pix",
    },
  })

  console.log("Pagamento criado")

  console.log("Seed concluído.")
  console.log("---")
  console.log("Credenciais de dev:")
  console.log("  Email: dev@psiagenda.com")
  console.log("  Senha: Dev@12345")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
