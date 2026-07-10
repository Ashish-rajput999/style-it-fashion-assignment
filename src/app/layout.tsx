import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'MeetingMind — AI-Powered Compliance Meeting Minutes',
    template: '%s | MeetingMind',
  },
  description: 'Transform your meeting recordings into compliance-ready, signed meeting minutes reports. Built for CSE, CSSCT, and works councils across Europe.',
  keywords: ['meeting minutes', 'CSE', 'compliance', 'AI', 'transcription', 'works council', 'France', 'HR'],
  authors: [{ name: 'Styleit Fashion' }],
  openGraph: {
    title: 'MeetingMind — AI-Powered Compliance Meeting Minutes',
    description: 'From raw recording to compliance-ready report in minutes.',
    type: 'website',
    locale: 'en_US',
    siteName: 'MeetingMind',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
