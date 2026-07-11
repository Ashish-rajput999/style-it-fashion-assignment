import React from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MeetingMind — Admin',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/wizard/region')

  return <>{children}</>
}
