import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

const cormorantGaramond = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SpaConnect - Health & Wellness SaaS',
  description: 'Gestión integral para negocios de bienestar',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="light">
      <body
        className={`${plusJakartaSans.variable} ${cormorantGaramond.variable} font-display min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  )
}
