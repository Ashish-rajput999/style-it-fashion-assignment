'use client'

import React, { useState } from 'react'
import { savePromptTemplate, deletePromptTemplate } from '@/app/actions/prompts'

interface PromptTemplateData {
  id: string
  name: string
  outputType: string
  tier: string
  promptText: string
  updatedBy: string | null
  updatedAt: string
}

interface PromptEditorProps {
  initialPrompts: PromptTemplateData[]
}

const OUTPUT_TYPES = [
  'SPEAKER_ANALYSIS',
  'REPORT_ANALYZER',
  'NUMERICAL_DATA',
  'MINUTES_REPORT',
  'PPT_EXPORT',
]

const TIERS = ['ESSENTIAL', 'SCOPE', 'PREMIUM', 'ALL']

export function PromptEditor({ initialPrompts }: PromptEditorProps) {
  const [prompts, setPrompts] = useState<PromptTemplateData[]>(initialPrompts)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [outputType, setOutputType] = useState('MINUTES_REPORT')
  const [tier, setTier] = useState('ALL')
  const [promptText, setPromptText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEdit = (p: PromptTemplateData) => {
    setEditingId(p.id)
    setName(p.name)
    setOutputType(p.outputType)
    setTier(p.tier)
    setPromptText(p.promptText)
    setError(null)
    setSuccess(null)
  }

  const handleReset = () => {
    setEditingId(null)
    setName('')
    setOutputType('MINUTES_REPORT')
    setTier('ALL')
    setPromptText('')
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await savePromptTemplate({
        id: editingId ?? undefined,
        name,
        outputType,
        tier,
        promptText,
      })

      setSuccess(editingId ? 'Prompt updated successfully ✓' : 'Prompt created successfully ✓')
      
      // Update local state by fetching latest or adjusting locally
      if (editingId) {
        setPrompts(prev => prev.map(p => p.id === editingId ? {
          ...p,
          name,
          outputType,
          tier,
          promptText,
          updatedAt: new Date().toISOString()
        } : p))
      } else {
        // Just reload window to fetch fresh db state or we can simply reload the page
        window.location.reload()
      }

      if (!editingId) {
        handleReset()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prompt template?')) return
    setError(null)
    setSuccess(null)
    
    try {
      await deletePromptTemplate(id)
      setPrompts(prev => prev.filter(p => p.id !== id))
      setSuccess('Prompt template deleted successfully.')
      if (editingId === id) {
        handleReset()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete template.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      
      {/* List section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Prompt Templates</h3>
        
        {prompts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] flex flex-col items-center justify-center p-8">
            <span className="text-3xl mb-4">📋</span>
            <h4 className="font-extrabold text-sm text-white mb-1">No Prompt Templates</h4>
            <p className="text-[11px] text-slate-400 text-center max-w-xs">
              No prompt templates have been created yet. Use the editor panel on the right to start drafting your first directive template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map((p) => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {p.outputType}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {p.tier}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-white mb-2">{p.name}</h4>
                  
                  <p className="text-xs text-gray-400 font-mono line-clamp-4 bg-black/20 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                    {p.promptText}
                  </p>
                </div>

                <div className="border-t border-white/5 mt-4 pt-3 flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 font-medium">
                    Updated {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-bold transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2 py-1 bg-red-650 hover:bg-red-750 text-white rounded text-[10px] font-bold transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor sidebar Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit sticky top-6">
        <h3 className="font-bold text-sm text-white mb-4">
          {editingId ? 'Edit Prompt Template' : 'Create Prompt Template'}
        </h3>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-500/15 border border-red-500/20 rounded-xl text-red-300 text-xs font-semibold">
            ✗ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-semibold">
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Template Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium Legal CSE Compliance Minutes"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Output Type
              </label>
              <select
                value={outputType}
                onChange={(e) => setOutputType(e.target.value)}
                className="w-full bg-[#1a1f36] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {OUTPUT_TYPES.map(o => (
                  <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Target Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-[#1a1f36] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TIERS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Prompt Instructions Text
            </label>
            <textarea
              required
              rows={8}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Provide clean instructions for the AI model to consume..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition disabled:opacity-55"
            >
              {loading ? 'Saving…' : editingId ? 'Update Prompt' : 'Create Prompt'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={handleReset}
                className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

    </div>
  )
}
