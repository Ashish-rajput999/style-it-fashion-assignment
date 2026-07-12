import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { ClientProfileClient } from './ClientProfileClient'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const { clientId } = await params

  // Query this client profile
  const client = await db.clientProfile.findUnique({
    where: { id: clientId },
    include: { user: true },
  })

  if (!client) notFound()

  // Query all requests for this client
  const requests = await db.meetingRequest.findMany({
    where: { clientProfileId: clientId },
    orderBy: { createdAt: 'desc' },
  })

  // Query other clients for the broadcast multiselect
  const otherClients = await db.clientProfile.findMany({
    where: { id: { not: clientId } },
    include: { user: true },
    orderBy: { companyName: 'asc' },
  })

  // Serialise dates & fields
  const serialisedClient = {
    id: client.id,
    companyName: client.companyName,
    region: client.region,
    complianceType: client.complianceType,
    notesFromAdmin: client.notesFromAdmin,
    createdAt: client.createdAt.toISOString(),
    user: {
      name: client.user.name ?? '',
      email: client.user.email,
    },
  }

  const serialisedRequests = requests.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    tier: r.tier,
    meetingDate: r.meetingDate ? r.meetingDate.toISOString() : null,
    updatedAt: r.updatedAt.toISOString(),
  }))

  const serialisedOtherClients = otherClients.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    email: c.user.email,
  }))

  return (
    <div className="min-h-screen bg-[#0F1226] text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 md:px-10 py-4 flex items-center gap-4">
        <Link
          href="/admin"
          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold transition-all text-white"
        >
          ←
        </Link>
        <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center font-extrabold text-sm shadow">
          M
        </div>
        <div>
          <h1 className="font-extrabold text-sm leading-none">{client.companyName}</h1>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
            CRM Profile · Contact: {client.user.name} ({client.user.email})
          </p>
        </div>
      </header>

      {/* Main content workspace */}
      <main className="flex-1 px-6 md:px-10 py-8 overflow-auto">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-white">Customer Relationship Management</h2>
          <p className="text-gray-400 text-xs mt-1">
            Analyze customer history, record notes, and communicate changes via broadcast distribution panels.
          </p>
        </div>

        <ClientProfileClient
          client={serialisedClient}
          requests={serialisedRequests}
          otherClients={serialisedOtherClients}
        />
      </main>
    </div>
  )
}
