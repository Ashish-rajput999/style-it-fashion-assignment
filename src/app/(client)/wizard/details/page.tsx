'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CoverPage } from '@/components/report/CoverPage'

const meetingTypes = ['Ordinary', 'Extraordinary', 'Emergency', 'Constitutive']

export default function WizardDetailsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const draftId = params.get('draftId') ?? ''

  const [form, setForm] = useState({
    title: '',
    location: '',
    meetingType: 'Ordinary',
    meetingDate: '',
    meetingTime: '10:00',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Breadcrumb values from wizard state (in real app read from DB/cookie)
  const breadcrumb = { region: 'France', compliance: 'CSE', language: 'French' }

  // Live preview data — updates as fields change
  const previewMeta = {
    title: form.title || 'Meeting Title',
    company: 'Your Company Name',
    date: form.meetingDate
      ? new Date(`${form.meetingDate}T${form.meetingTime}`).toISOString()
      : new Date().toISOString(),
    location: form.location || 'Location',
    meetingType: form.meetingType,
    complianceType: 'CSE',
    preparedBy: 'MeetingMind AI',
    reference: 'REF-2026-CSE-DRAFT',
  }
  const previewStats = { attendees: 0, duration: '—', decisions: 0, actionItems: 0 }
  const previewAttendees: any[] = []

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.location || !form.meetingDate) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('draftId', draftId)
    formData.append('title', form.title)
    formData.append('location', form.location)
    formData.append('meetingType', form.meetingType)
    formData.append('meetingDate', `${form.meetingDate}T${form.meetingTime}`)

    const res = await fetch('/api/wizard/details', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (data.ok) {
      router.push(`/wizard/upload?draftId=${draftId}`)
    } else {
      setError(data.error || 'Failed to save. Please try again.')
      setLoading(false)
    }
  }

  if (!draftId) {
    return (
      <div className="wizard-error-state">
        <p>No wizard session found. <a href="/wizard/region" className="auth-link">Start over →</a></p>
      </div>
    )
  }

  return (
    <div className="wizard-details-layout">
      {/* Left: form panel */}
      <div className="wizard-details-form-panel">
        {/* Breadcrumb */}
        <div className="wizard-breadcrumb">
          <span className="wizard-breadcrumb-item wizard-breadcrumb-item--active">
            🌐 {breadcrumb.region}
          </span>
          <span className="wizard-breadcrumb-sep">›</span>
          <span className="wizard-breadcrumb-item wizard-breadcrumb-item--active">
            🛡️ {breadcrumb.compliance}
          </span>
          <span className="wizard-breadcrumb-sep">›</span>
          <span className="wizard-breadcrumb-item wizard-breadcrumb-item--active">
            🇫🇷 {breadcrumb.language}
          </span>
          <button type="button" onClick={() => router.push('/wizard/region')} className="wizard-breadcrumb-change">Change →</button>
        </div>

        <h2 className="wizard-details-title">Meeting Details</h2>
        <p className="wizard-details-sub">
          Fill in the meeting metadata. Your report cover page updates live as you type.
        </p>

        <form onSubmit={handleSubmit} className="wizard-details-form">
          {/* Meeting name */}
          <div className="auth-field">
            <label htmlFor="title" className="auth-label">Meeting Name <span className="required">*</span></label>
            <input
              id="title"
              type="text"
              required
              value={form.title}
              onChange={update('title')}
              className="auth-input"
              placeholder="e.g. Extraordinary Works Council Meeting"
            />
          </div>

          {/* Location */}
          <div className="auth-field">
            <label htmlFor="location" className="auth-label">Meeting Location <span className="required">*</span></label>
            <input
              id="location"
              type="text"
              required
              value={form.location}
              onChange={update('location')}
              className="auth-input"
              placeholder="e.g. Paris HQ – Salle Conseil"
            />
          </div>

          {/* Type + Date row */}
          <div className="auth-field-row">
            <div className="auth-field">
              <label htmlFor="meetingType" className="auth-label">Meeting Type <span className="required">*</span></label>
              <select
                id="meetingType"
                value={form.meetingType}
                onChange={update('meetingType')}
                className="auth-input auth-select"
              >
                {meetingTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="meetingDate" className="auth-label">Date <span className="required">*</span></label>
              <input
                id="meetingDate"
                type="date"
                required
                value={form.meetingDate}
                onChange={update('meetingDate')}
                className="auth-input"
              />
            </div>
          </div>

          {/* Time */}
          <div className="auth-field" style={{ maxWidth: 200 }}>
            <label htmlFor="meetingTime" className="auth-label">Start Time</label>
            <input
              id="meetingTime"
              type="time"
              value={form.meetingTime}
              onChange={update('meetingTime')}
              className="auth-input"
            />
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">⚠</span>
              {error}
            </div>
          )}

          <div className="wizard-details-actions">
            <button
              type="button"
              onClick={() => router.back()}
              className="wizard-back-btn"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
              id="details-continue"
              style={{ maxWidth: 200 }}
            >
              {loading ? 'Saving…' : 'Continue →'}
            </button>
          </div>
        </form>
      </div>

      {/* Right: live cover preview */}
      <div className="wizard-details-preview-panel">
        <div className="wizard-preview-label">
          <span className="wizard-preview-dot" /> Live Preview
        </div>
        <div className="wizard-preview-scale-wrapper">
          <div className="wizard-preview-scale-inner">
            <CoverPage
              meta={previewMeta}
              stats={previewStats}
              attendees={previewAttendees}
            />
          </div>
        </div>
        <p className="wizard-preview-hint">
          Updates in real-time as you fill in the form
        </p>
      </div>
    </div>
  )
}
