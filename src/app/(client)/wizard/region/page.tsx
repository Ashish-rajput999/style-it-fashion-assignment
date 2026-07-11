'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { REGIONS } from '@/lib/compliance/regions'
import { TIERS } from '@/lib/tiers'

export default function WizardRegionPage() {
  const router = useRouter()
  const [selectedRegion, setSelectedRegion] = useState('FR')
  const [selectedCompliance, setSelectedCompliance] = useState('CSE')
  const [loading, setLoading] = useState(false)

  const region = REGIONS.find((r) => r.code === selectedRegion)!
  const complianceTypes = region.complianceTypes

  async function handleContinue() {
    setLoading(true)
    const formData = new FormData()
    formData.append('region', selectedRegion)
    formData.append('complianceType', selectedCompliance)
    formData.append('language', 'fr')

    const res = await fetch('/api/wizard/draft', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (data.draftId) {
      router.push(`/wizard/details?draftId=${data.draftId}`)
    }
    setLoading(false)
  }

  return (
    <div className="wizard-region-layout">
      {/* Left: brand panel */}
      <div className="wizard-brand-panel">
        <p className="wizard-brand-tag">● AI POWERED</p>
        <h1 className="wizard-brand-headline">
          Turn Meeting into{' '}
          <span className="wizard-brand-accent">Compliance Ready Report</span>
        </h1>
        <p className="wizard-brand-desc">
          Enterprise grade reports that capture every risk, insight, and recommendation.
          Select compliance and let the system do the work.
        </p>
        <div className="wizard-trust-badge">
          <div className="wizard-trust-avatars">
            <span className="wizard-trust-avatar">A</span>
            <span className="wizard-trust-avatar">S</span>
            <span className="wizard-trust-avatar">M</span>
          </div>
          <span>Trusted by 500+ Enterprises</span>
        </div>
      </div>

      {/* Center: main wizard card */}
      <div className="wizard-main-card">
        <div className="wizard-card-header">
          <h2 className="wizard-card-title">Create Meeting Report</h2>
          <p className="wizard-card-subtitle">Choose your compliance to begin.</p>
          <div className="wizard-card-controls">
            <button className="wizard-lang-btn">🇫🇷 French ▾</button>
          </div>
        </div>

        {/* Region Picker */}
        <section className="wizard-section">
          <div className="wizard-section-label">
            <span className="wizard-section-icon">🌐</span>
            Select Region / Country
          </div>
          <div className="wizard-region-grid">
            {REGIONS.map((region) => (
              <button
                key={region.code}
                onClick={() => {
                  if (!region.active) return
                  setSelectedRegion(region.code)
                  setSelectedCompliance('')
                }}
                disabled={!region.active}
                className={[
                  'wizard-region-card',
                  region.code === selectedRegion && region.active ? 'wizard-region-card--active' : '',
                  !region.active ? 'wizard-region-card--disabled' : '',
                ].join(' ')}
                id={`region-card-${region.code}`}
              >
                <span className="wizard-region-flag">{region.flag}</span>
                <span className="wizard-region-name">{region.name}</span>
                {!region.active && (
                  <span className="wizard-coming-soon">Coming soon</span>
                )}
                {region.code === selectedRegion && region.active && (
                  <span className="wizard-region-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Compliance Type Picker */}
        <section className="wizard-section">
          <div className="wizard-section-label">
            <span className="wizard-section-icon">🛡️</span>
            Select Compliance
          </div>
          <div className="wizard-compliance-grid">
            {complianceTypes.map((ct) => (
              <button
                key={ct.code}
                onClick={() => ct.active && setSelectedCompliance(ct.code)}
                disabled={!ct.active}
                className={[
                  'wizard-compliance-card',
                  ct.code === selectedCompliance && ct.active ? 'wizard-compliance-card--active' : '',
                  !ct.active ? 'wizard-compliance-card--disabled' : '',
                ].join(' ')}
                id={`compliance-card-${ct.code}`}
              >
                <div className="wizard-compliance-icon">
                  {ct.active ? '🛡️' : '?'}
                </div>
                <span className="wizard-compliance-name">{ct.name}</span>
                {ct.code === selectedCompliance && ct.active && (
                  <span className="wizard-compliance-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="wizard-actions">
          <button
            onClick={handleContinue}
            disabled={!selectedRegion || !selectedCompliance || loading}
            className="wizard-continue-btn"
            id="wizard-continue"
          >
            {loading ? 'Starting…' : 'Continue →'}
          </button>
          <button className="wizard-analyzer-btn">
            ✦ Report Analyzer
          </button>
        </div>
      </div>

      {/* Right: tier preview cards */}
      <div className="wizard-tier-panel">
        {TIERS.map((t) => (
          <div key={t.id} className="wizard-tier-card">
            <div className="wizard-tier-card-header">
              <span className="wizard-tier-icon" style={{ color: t.color }}>{t.icon}</span>
              <span className="wizard-tier-name" style={{ color: t.color }}>{t.name}</span>
            </div>
            <div className="wizard-tier-brand">MeetingMind</div>
            {/* Real Feature Bullets */}
            <ul className="mt-2 space-y-1.5 border-t border-gray-100 pt-2 text-[11px] text-gray-500 list-disc list-inside">
              {t.features.slice(0, 4).map((feat, idx) => (
                <li key={idx} className="truncate" title={feat}>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
