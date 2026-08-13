import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mokambo Mining Systems | Operations Intelligence",
  description: "A field-ready portal for safer, clearer mining operations and underground survey tracing.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background"><body>{children}</body></html>
}
