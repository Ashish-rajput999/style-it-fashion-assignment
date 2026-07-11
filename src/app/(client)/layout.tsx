import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MeetingMind — Client Portal',
}

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  // Verify the user exists in the database (safeguard against wiped or re-seeded dev databases)
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
  })
  if (!dbUser) {
    redirect('/login')
  }

  return <>{children}</>
}

