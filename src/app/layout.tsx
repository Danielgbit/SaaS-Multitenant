import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'sonner'
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

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prügressy - Gestión para negocios de bienestar',
  description: 'Gestión integral para barberías, spas y negocios de bienestar',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${cormorantGaramond.variable} ${dmSans.variable} font-display min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster 
            position="bottom-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'var(--font-plus-jakarta-sans)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
