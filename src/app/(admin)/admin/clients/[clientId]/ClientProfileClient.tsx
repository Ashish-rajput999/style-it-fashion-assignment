'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'

interface RequestData {
  id: string
  title: string
  status: string
  tier: string
  meetingDate: string | null
  updatedAt: string
}

interface ClientData {
  id: string
  companyName: string
  region: string
  complianceType: string
  notesFromAdmin: string | null
  createdAt: string
  user: {
    name: string
    email: string
  }
}

interface OtherClient {
  id: string
  companyName: string
  email: string
}

interface ClientProfileClientProps {
  client: ClientData
  requests: RequestData[]
  otherClients: OtherClient[]
}

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ESSENTIAL: { bg: '#F1F0FF', text: '#5548D9', label: 'Essential' },
  SCOPE: { bg: '#EBF0FF', text: '#2F69FF', label: 'Scope' },
  PREMIUM: { bg: '#FEF7DC', text: '#B98313', label: 'Premium' },
}

export function ClientProfileClient({
  client,
  requests,
  otherClients,
}: ClientProfileClientProps) {
  // CRM internal notes states
  const [internalNotes, setInternalNotes] = useState(client.notesFromAdmin ?? '')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaveStatus, setNotesSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Broadcast panel states
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set([client.id]))
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null)

  const handleSaveNotes = useCallback(async () => {
    setNotesSaving(true)
    setNotesSaveStatus('idle')
    try {
      const res = await fetch('/api/admin/clients/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, notesFromAdmin: internalNotes }),
      })
      if (!res.ok) throw new Error()
      setNotesSaveStatus('saved')
      setTimeout(() => setNotesSaveStatus('idle'), 3000)
    } catch {
      setNotesSaveStatus('error')
    } finally {
      setNotesSaving(false)
    }
  }, [client.id, internalNotes])

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  // Toggle checklist selection
  const toggleClient = (id: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  };

  const selectAll = () => {
    setSelectedClients(new Set([client.id, ...otherClients.map((c) => c.id)]))
  }

  const selectNone = () => {
    setSelectedClients(new Set())
  }

  // Submit broadcast trigger
  const handleSendBroadcast = () => {
    if (selectedClients.size === 0) {
      alert('Please select at least one recipient client.')
      return
    }
    if (!broadcastMessage.trim() && !uploadedFile) {
      alert('Please enter a message or select a file to broadcast.')
      return
    }

    setBroadcastSending(true)
    setBroadcastStatus(null)

    // Simulate broadcast sending process (STUBBED)
    setTimeout(() => {
      setBroadcastSending(false)
      setBroadcastStatus(
        `✓ Broadcast successfully sent to ${selectedClients.size} client profiles! (Stubbed action)`
      )
      setBroadcastMessage('')
      setUploadedFile(null)
      setTimeout(() => setBroadcastStatus(null), 5000)
    }, 1500)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 items-start">
      
      {/* LEFT COLUMN: Client Overview + past requests */}
      <div className="space-y-6">
        
        {/* Client details overview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Client Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            <div>
              <p className="text-gray-500 font-medium mb-1">Company</p>
              <p className="font-extrabold text-sm text-white">{client.companyName}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">Primary Contact</p>
              <p className="font-bold text-white">{client.user.name}</p>
              <p className="text-[10px] text-indigo-300 truncate mt-0.5">{client.user.email}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">Region & Compliance</p>
              <p className="font-bold text-white">{client.region} / {client.complianceType}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">Joined Date</p>
              <p className="font-bold text-white">
                {new Date(client.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Requests History List */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Request History ({requests.length})
          </h3>

          {requests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] flex flex-col items-center justify-center p-8">
              <span className="text-3xl mb-4">🗂️</span>
              <h4 className="font-extrabold text-sm text-white mb-1">No Requests</h4>
              <p className="text-[11px] text-slate-400 text-center max-w-xs">
                No requests have been submitted by this client yet. Once they start a wizard session, history will compile here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => {
                const tier = TIER_COLORS[r.tier] ?? TIER_COLORS.ESSENTIAL
                return (
                  <div
                    key={r.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/10 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                          style={{
                            background: tier.bg + '20',
                            color: tier.text,
                            borderColor: tier.text + '40',
                          }}
                        >
                          {tier.label}
                        </span>
                        <span className="text-[9px] font-bold uppercase bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-300 transition-colors">
                        {r.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Updated {new Date(r.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow transition-all shrink-0 text-center"
                    >
                      Open Request Folder →
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Admin Relationship Notes + Broadcast Panel */}
      <div className="space-y-6">
        
        {/* Admin Relationship Notes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Relationship Notes</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Internal admin records for this client profile.
            </p>
          </div>

          <textarea
            rows={4}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Add internal notes about the relationship, billing status, special compliance requirements..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
          />

          <div className="flex items-center justify-between">
            {notesSaveStatus === 'saved' && (
              <span className="text-[10px] text-emerald-400 font-bold">✓ Notes saved</span>
            )}
            {notesSaveStatus === 'error' && (
              <span className="text-[10px] text-red-400 font-bold">✗ Save failed</span>
            )}
            <span className="flex-1" />
            <button
              onClick={handleSaveNotes}
              disabled={notesSaving}
              className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs rounded-lg transition disabled:opacity-55"
            >
              {notesSaving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>
        </div>

        {/* CRM Broadcast Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">📡 Broadcast Message</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Distribute updates, template alerts, or legal files to multiple client profiles.
            </p>
          </div>

          {broadcastStatus && (
            <div className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-300 text-[10px] font-semibold">
              {broadcastStatus}
            </div>
          )}

          {/* Checklist selection of recipients */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
              <span>Recipients ({selectedClients.size})</span>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-indigo-400 hover:text-indigo-300 hover:underline">All</button>
                <button type="button" onClick={selectNone} className="text-indigo-400 hover:text-indigo-300 hover:underline">None</button>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto border border-white/10 rounded-xl p-2.5 bg-black/10 space-y-2 divide-y divide-white/5">
              {/* Current Client */}
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedClients.has(client.id)}
                  onChange={() => toggleClient(client.id)}
                  className="accent-indigo-500 w-3.5 h-3.5"
                />
                <span className="truncate">{client.companyName} (Active)</span>
              </label>

              {/* Other Clients */}
              {otherClients.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none pt-2 first:pt-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedClients.has(c.id)}
                    onChange={() => toggleClient(c.id)}
                    className="accent-indigo-500 w-3.5 h-3.5"
                  />
                  <span className="truncate">{c.companyName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Broadcast Message Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Message</label>
            <textarea
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Type update message..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-normal resize-none"
            />
          </div>

          {/* File Drag and Drop Zone */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Attachments</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : uploadedFile
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="broadcast-file"
              />
              <label htmlFor="broadcast-file" className="cursor-pointer block">
                {uploadedFile ? (
                  <div className="text-xs text-emerald-400 font-bold">
                    📎 {uploadedFile.name}
                    <span className="block text-[9px] text-gray-500 font-normal mt-0.5">
                      {(uploadedFile.size / 1024).toFixed(1)} KB · Click to replace
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-300 font-bold">Drag and drop file here</p>
                    <p className="text-[9px] text-gray-500">or click to browse from device</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleSendBroadcast}
            disabled={broadcastSending}
            className="w-full bg-gradient-to-r from-indigo-650 to-violet-650 hover:shadow-lg text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition-all disabled:opacity-55"
          >
            {broadcastSending ? 'Sending Broadcast…' : '📡 Send Broadcast'}
          </button>
        </div>
      </div>
    </div>
  )
}
