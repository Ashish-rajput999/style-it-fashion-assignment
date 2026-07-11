import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { PromptEditor } from './PromptEditor'

export default async function AdminPromptsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const prompts = await db.promptTemplate.findMany({
    orderBy: { updatedAt: 'desc' },
  })

  // Serialise dates so they are safe to pass to client component
  const serialised = prompts.map(p => ({
    id: p.id,
    name: p.name,
    outputType: p.outputType,
    tier: p.tier,
    promptText: p.promptText,
    updatedBy: p.updatedBy,
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-[#0F1226] text-white flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center font-extrabold text-sm shadow">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight leading-none">MeetingMind</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Admin Console</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-400">
          <Link href="/admin">Queue</Link>
          <span className="opacity-40 cursor-not-allowed">Clients</span>
          <Link href="/admin/prompts" className="text-white">Prompts</Link>
        </nav>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-400 hidden sm:block">{session.user.name}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 px-3 rounded-lg transition-all">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 md:px-10 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-white">AI Prompts Manager</h2>
          <p className="text-gray-400 text-xs mt-1">
            Manage system templates and prompts consumed during generation for all compliance packages.
          </p>
        </div>

        <PromptEditor initialPrompts={serialised} />
      </main>

    </div>
  )
}
