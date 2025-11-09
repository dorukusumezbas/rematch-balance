import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthGate from '@/components/AuthGate'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rematch Balancer - ASLI CIKMAZI',
  description: 'Rate players and balance teams for in-house matches',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  )
}

