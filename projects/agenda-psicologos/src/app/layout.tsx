import type { Metadata } from "next"
import { Providers } from "@/app/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "PsiAgenda",
  description: "Agenda para psicólogos",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
