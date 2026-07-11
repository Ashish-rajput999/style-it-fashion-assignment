'use client'

import React, { useState, useMemo } from 'react'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts'

interface ComplianceFinding {
  code: string
  label: string
  compliant: boolean
  riskLevel: 'low' | 'medium' | 'high'
  coverage: number
  detail: string
}

interface ComplianceData {
  score: number
  compliantAreas: number
  missingDocuments: number
  recommendations: number
  criticalRisks: number
  findings: ComplianceFinding[]
  breakdown: { label: string; score: number }[]
  riskExposureLevel: string
}

const RISK_COLORS = {
  low: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC', label: 'Low Risk' },
  medium: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047', label: 'Medium Risk' },
  high: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', label: 'High Risk' },
}

const SCORE_COLOR = (score: number) =>
  score >= 80 ? '#198C61' : score >= 60 ? '#B98313' : '#D94B4B'

const TABS = [
  { id: 'risks', label: 'Risks', icon: '⚠️' },
  { id: 'missing', label: 'Missing Documents', icon: '📂' },
  { id: 'references', label: 'Compliance References', icon: '📋' },
  { id: 'recommendations', label: 'Recommendations', icon: '💡' },
]

interface ReportAnalyzerProps {
  data: ComplianceData
}

export function ReportAnalyzer({ data }: ReportAnalyzerProps) {
  const [activeTab, setActiveTab] = useState<string>('risks')
  const [filterRisk, setFilterRisk] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchText, setSearchText] = useState('')

  const scoreColor = SCORE_COLOR(data.score)
  const gaugeData = [{ value: data.score, fill: scoreColor }]

  // ── Filtered findings ─────────────────────────────────────────────────────
  const filteredFindings = useMemo(() => {
    return data.findings.filter((f) => {
      if (filterRisk !== 'ALL' && f.riskLevel !== filterRisk.toLowerCase()) return false
      if (filterStatus === 'COMPLIANT' && !f.compliant) return false
      if (filterStatus === 'NON_COMPLIANT' && f.compliant) return false
      if (searchText && !f.label.toLowerCase().includes(searchText.toLowerCase()) &&
          !f.code.toLowerCase().includes(searchText.toLowerCase()) &&
          !f.detail.toLowerCase().includes(searchText.toLowerCase())) return false
      return true
    })
  }, [data.findings, filterRisk, filterStatus, searchText])

  const tabFindings = useMemo(() => {
    switch (activeTab) {
      case 'risks':
        return filteredFindings.filter(f => !f.compliant)
      case 'missing':
        return filteredFindings.filter(f => f.riskLevel === 'high')
      case 'references':
        return filteredFindings
      case 'recommendations':
        return filteredFindings.filter(f => f.riskLevel === 'medium' || !f.compliant)
      default:
        return filteredFindings
    }
  }, [filteredFindings, activeTab])

  return (
    <div className="space-y-6">

      {/* ── Top section: Gauge + 4 Stat Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">

        {/* Radial gauge */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-3">
            Compliance Score
          </p>
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="65%" outerRadius="90%"
                startAngle={220} endAngle={-40}
                data={gaugeData}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: '#F1F5F9' }}
                  dataKey="value"
                  angleAxisId={0}
                  cornerRadius={8}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-4xl font-extrabold leading-none"
                style={{ color: scoreColor }}
              >
                {data.score}%
              </span>
              <span className="text-[10px] font-bold text-gray-400 mt-1">
                Overall Score
              </span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="w-full mt-4 space-y-2.5">
            {data.breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-[10px] text-gray-500 font-medium mb-0.5">
                  <span>{b.label}</span>
                  <span className="font-bold" style={{ color: SCORE_COLOR(b.score) }}>{b.score}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${b.score}%`, background: SCORE_COLOR(b.score) }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Risk level pill */}
          <div
            className="mt-4 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
            style={{
              background: data.score >= 70 ? '#DCFCE720' : '#FEE2E220',
              color: data.score >= 70 ? '#166534' : '#991B1B',
            }}
          >
            {data.riskExposureLevel} Exposure
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: 'Critical Risks',
              value: data.criticalRisks,
              icon: '🔴',
              color: '#D94B4B',
              bg: '#FEF2F2',
              border: '#FECACA',
              desc: 'Require immediate action',
            },
            {
              label: 'Recommendations',
              value: data.recommendations,
              icon: '💡',
              color: '#B98313',
              bg: '#FFFBEB',
              border: '#FDE68A',
              desc: 'Suggested improvements',
            },
            {
              label: 'Compliant Areas',
              value: data.compliantAreas,
              icon: '✅',
              color: '#198C61',
              bg: '#F0FDF4',
              border: '#BBF7D0',
              desc: 'Requirements satisfied',
            },
            {
              label: 'Missing Documents',
              value: data.missingDocuments,
              icon: '📂',
              color: '#7A5AF8',
              bg: '#F5F3FF',
              border: '#DDD6FE',
              desc: 'Not found in transcript',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border p-5 flex flex-col justify-between"
              style={{ background: card.bg, borderColor: card.border }}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{card.icon}</span>
                <span
                  className="text-3xl font-extrabold leading-none"
                  style={{ color: card.color }}
                >
                  {card.value}
                </span>
              </div>
              <div className="mt-3">
                <p className="font-extrabold text-sm" style={{ color: card.color }}>
                  {card.label}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Findings Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 pt-3 gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const count = (() => {
              switch (t.id) {
                case 'risks': return data.findings.filter(f => !f.compliant).length
                case 'missing': return data.findings.filter(f => f.riskLevel === 'high').length
                case 'references': return data.findings.length
                case 'recommendations': return data.findings.filter(f => f.riskLevel === 'medium' || !f.compliant).length
                default: return 0
              }
            })()
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold rounded-t-lg transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-[#6D5DF6] text-white shadow'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.icon} {t.label}
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ml-1 ${
                    activeTab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="px-5 py-3 flex flex-wrap gap-3 border-b border-gray-50 bg-gray-50/50">
          <input
            type="text"
            placeholder="Search findings…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-44"
          />

          <div className="flex gap-1.5 flex-wrap">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  filterRisk === r
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300'
                }`}
              >
                {r === 'ALL' ? 'All Risk Levels' : r}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 ml-auto flex-wrap">
            {['ALL', 'COMPLIANT', 'NON_COMPLIANT'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  filterStatus === s
                    ? 'bg-slate-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-slate-400'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s === 'COMPLIANT' ? 'Compliant' : 'Non-Compliant'}
              </button>
            ))}
          </div>
        </div>

        {/* Table body */}
        {tabFindings.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No findings match current filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tabFindings.map((f, i) => {
              const rc = RISK_COLORS[f.riskLevel]
              return (
                <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/60 transition-colors group">
                  {/* Risk pill */}
                  <div className="shrink-0 pt-0.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border"
                      style={{ background: rc.bg, color: rc.text, borderColor: rc.border }}
                    >
                      {rc.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {f.code}
                      </span>
                      <span className={`text-[9px] font-bold ${f.compliant ? 'text-emerald-600' : 'text-red-500'}`}>
                        {f.compliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 mb-1">{f.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.detail}</p>
                  </div>

                  {/* Impact bar + confidence */}
                  <div className="shrink-0 w-28 text-right">
                    <p className="text-[10px] text-gray-400 font-medium mb-1">Coverage</p>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${f.coverage}%`,
                          background: SCORE_COLOR(f.coverage),
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-extrabold"
                      style={{ color: SCORE_COLOR(f.coverage) }}
                    >
                      {f.coverage}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-[10px] text-gray-400 font-medium">
            Showing {tabFindings.length} of {data.findings.length} findings
          </span>
          <span className="text-[10px] text-gray-400">
            {data.findings.filter(f => f.compliant).length} compliant ·{' '}
            {data.findings.filter(f => !f.compliant).length} non-compliant
          </span>
        </div>
      </div>
    </div>
  )
}
