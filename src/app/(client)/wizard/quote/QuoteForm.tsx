'use client'

import React, { useState } from 'react'
import { submitQuotation } from '@/app/actions/wizard'
import { TIERS, TIER_FEATURES, type Tier } from '@/lib/tiers'

interface QuoteFormProps {
  draftId: string
  initialTier: Tier
  meetingTitle: string
}

export function QuoteForm({ draftId, initialTier, meetingTitle }: QuoteFormProps) {
  const [selectedTier, setSelectedTier] = useState<Tier>(initialTier)
  const [notes, setNotes] = useState('')

  const handleSelectTier = (tierId: Tier) => {
    setSelectedTier(tierId)
  }

  return (
    <form action={submitQuotation} className="max-w-5xl mx-auto px-4 py-8">
      <input type="hidden" name="draftId" value={draftId} />
      <input type="hidden" name="tier" value={selectedTier} />

      {/* Hero Header */}
      <div className="text-center mb-10">
        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Step 4: Quotation & Tier Selection
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-3 mb-2 font-sans">
          Select Your Service Level
        </h1>
        <p className="text-gray-600 text-sm max-w-xl mx-auto">
          Choose the right tier for <span className="font-semibold text-gray-800">"{meetingTitle}"</span>. 
          Each plan is tailored to different organizational compliance requirements.
        </p>
      </div>

      {/* 3-Column Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {TIERS.map((tier) => {
          const isSelected = selectedTier === tier.id
          return (
            <div
              key={tier.id}
              onClick={() => handleSelectTier(tier.id)}
              className={`relative flex flex-col justify-between p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                isSelected
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/20'
                  : 'border-gray-200 bg-gray-50/50 opacity-90'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-sm">
                  Active Choice
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{tier.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{tier.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">Compliance Package</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-5 min-h-[32px]">{tier.tagline}</p>
                
                <div className="border-t border-gray-100 pt-4 mb-5">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Key Deliverables</p>
                  <ul className="space-y-2 text-xs text-gray-600">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold flex-shrink-0">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div className="bg-gray-100/50 rounded-xl p-3 text-center mb-4">
                  <p className="text-xs text-gray-500 font-medium">Pricing tier</p>
                  <p className="font-extrabold text-indigo-950 text-base">{tier.priceLabel}</p>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-colors duration-150 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isSelected ? 'Selected Plan' : 'Select Plan'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-10">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-base text-gray-900">Plan Comparison</h2>
          <p className="text-xs text-gray-500 mt-1">Detailed feature breakdown of all compliance tiers.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider bg-gray-50/20">
                <th className="p-4 font-semibold w-1/3">Feature Category</th>
                <th className={`p-4 text-center font-bold ${selectedTier === 'ESSENTIAL' ? 'bg-indigo-50/30 text-indigo-950' : ''}`}>Essential</th>
                <th className={`p-4 text-center font-bold ${selectedTier === 'SCOPE' ? 'bg-indigo-50/30 text-indigo-950' : ''}`}>Scope</th>
                <th className={`p-4 text-center font-bold ${selectedTier === 'PREMIUM' ? 'bg-indigo-50/30 text-indigo-950' : ''}`}>Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TIER_FEATURES.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-gray-900">
                    <div>
                      <p className="font-semibold text-gray-850">{item.feature}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{item.category}</p>
                    </div>
                  </td>
                  
                  {/* Essential */}
                  <td className={`p-4 text-center ${selectedTier === 'ESSENTIAL' ? 'bg-indigo-50/20 font-medium' : ''}`}>
                    {typeof item.essential === 'string' ? (
                      <span className="text-gray-700 font-medium">{item.essential}</span>
                    ) : item.essential ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-gray-300 font-bold">—</span>
                    )}
                  </td>

                  {/* Scope */}
                  <td className={`p-4 text-center ${selectedTier === 'SCOPE' ? 'bg-indigo-50/20 font-medium' : ''}`}>
                    {typeof item.scope === 'string' ? (
                      <span className="text-gray-700 font-medium">{item.scope}</span>
                    ) : item.scope ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-gray-300 font-bold">—</span>
                    )}
                  </td>

                  {/* Premium */}
                  <td className={`p-4 text-center ${selectedTier === 'PREMIUM' ? 'bg-indigo-50/20 font-medium' : ''}`}>
                    {typeof item.premium === 'string' ? (
                      <span className="text-indigo-900 font-semibold">{item.premium}</span>
                    ) : item.premium ? (
                      <span className="text-indigo-600 font-bold">✓</span>
                    ) : (
                      <span className="text-gray-300 font-bold">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Comments / Notes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
        <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Notes to Admin & Special Instructions (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Include any specific guidance, requirements for compliance check, agenda lists, or spelling checks for speaker names.
        </p>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter notes for the administration team..."
          className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 bg-slate-50/50"
        />
      </div>

      {/* Form Submission Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="text-center sm:text-left">
          <p className="text-xs text-gray-500 font-medium">Selected Tier</p>
          <p className="font-extrabold text-indigo-950 text-lg">
            {TIERS.find((t) => t.id === selectedTier)?.name} Package
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex-1 sm:flex-none px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition"
          >
            ← Back to Preview
          </button>
          <button
            type="submit"
            className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
          >
            Submit Request & Distribution →
          </button>
        </div>
      </div>
    </form>
  )
}
