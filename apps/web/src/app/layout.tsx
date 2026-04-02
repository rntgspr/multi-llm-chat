import { Space_Grotesk, Space_Mono } from 'next/font/google'

import type { Metadata } from 'next'
import './globals.css'

import { Providers } from '@/components/providers'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin'],
})

const spaceMono = Space_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Multi LLM Chat',
  description: 'Chat with multiple LLM providers',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased dark`}>
      <body className="h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
