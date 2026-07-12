import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { TIERS, TIER_FEATURES } from '@/lib/tiers'
import { SampleReportLibrary } from '@/components/marketing/SampleReportLibrary'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Query 3 dispatched sample reports from the database
  let sortedReports: any[] = []
  try {
    const meetings = await db.meetingRequest.findMany({
      where: {
        status: 'DISPATCHED',
      },
      include: {
        generatedOutputs: {
          where: {
            type: 'MINUTES_REPORT',
          },
        },
      },
    })

    const orderedTiers = ['ESSENTIAL', 'SCOPE', 'PREMIUM']
    sortedReports = meetings
      .filter((m) => m.generatedOutputs.length > 0)
      .map((m) => ({
        id: m.id,
        title: m.title,
        meetingDate: m.meetingDate.toISOString(),
        region: m.region,
        complianceType: m.complianceType,
        meetingType: m.meetingType,
        status: m.status,
        tier: m.tier,
        contentJson: m.generatedOutputs[0].contentJson,
        outputId: m.generatedOutputs[0].id,
      }))
      .sort((a, b) => orderedTiers.indexOf(a.tier) - orderedTiers.indexOf(b.tier))
  } catch (err) {
    console.error('Error fetching sample reports:', err)
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-[#0F1226] font-sans flex flex-col">
      {/* Premium Header */}
      <header className="bg-[#0F1226] text-white py-5 px-6 md:px-12 flex justify-between items-center border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center font-extrabold text-base shadow-brand">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none">MeetingMind</h1>
            <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest mt-0.5">Compliance Portal</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-300">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#sample-reports" className="hover:text-white transition-colors">Sample Reports</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing & Tiers</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-bold text-gray-300 hover:text-white transition-colors">
            Client Login
          </Link>
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-brand transition-all hover:scale-[1.02]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#0F1226] text-white py-20 md:py-28 px-6 md:px-12 text-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(109,93,246,0.15),transparent_45%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(47,105,255,0.1),transparent_45%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block mb-6">
            ✨ Premium Work Council Compliance Automation
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight leading-tight mb-6">
            Automated, Compliance-Ready <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-300">
              Meeting Minutes for CSE Boards
            </span>
          </h2>
          <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Transform raw meeting audio files into signed, agenda-structured, and fully audited minutes conforming to the French Labor Code. Fully sandboxed, secure, and ready in seconds.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm py-3.5 px-8 rounded-xl shadow-brand transition-all hover:scale-[1.02]"
            >
              Get Started Free →
            </Link>
            <a
              href="#sample-reports"
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs md:text-sm py-3.5 px-8 rounded-xl transition-all"
            >
              Explore Sample Reports
            </a>
          </div>
        </div>
      </section>

      {/* Before / After Split Panels */}
      <section id="how-it-works" className="py-20 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-serif font-black text-gray-950 mb-3">
            Designed for Strict Regulatory Standards
          </h2>
          <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto">
            Traditional transcript writing is error-prone, clunky, and fails audits. Here is how MeetingMind modernizes your board documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Before Panel */}
          <div className="bg-white rounded-2xl border border-red-100 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                  ✕
                </div>
                <h3 className="font-extrabold text-base text-gray-950">Manual, Unstructured Process</h3>
              </div>
              <ul className="space-y-4 text-xs text-gray-500">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span><strong>Messy Transcripts:</strong> Non-diarized voice-to-text outputs require hours of manual speaker correction.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span><strong>Loose Agenda Formats:</strong> Manually identifying decisions, action lists, and attendee statements.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span><strong>Compliance Blindspots:</strong> No real checks for French Labor Code requirements (quorum, vote details, legal phrasing).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span><strong>Insecure Storage:</strong> Sharing raw transcripts and confidential files over unencrypted email attachments.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-red-50 text-[10px] text-red-500/80 font-bold uppercase tracking-widest">
              Unstable & Risky Workflow
            </div>
          </div>

          {/* After Panel */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-emerald-100">
              MeetingMind Way
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <h3 className="font-extrabold text-base text-gray-950">Automated Compliance Pipeline</h3>
              </div>
              <ul className="space-y-4 text-xs text-gray-500">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span><strong>Multi-Channel Diarization:</strong> Precise voice segmentation with automated, context-aware speaker mapping.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span><strong>Interactive E-Book Viewer:</strong> Read-only 3D flip e-books ready for formal review, complete with agenda-based indexing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span><strong>Regulatory Checklist Audits:</strong> Integrated clause-by-clause Labor Code checks and quorum validation cards.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span><strong>Sandboxed Storage:</strong> Encrypted localized databases, keeping confidential board discussions completely locked down.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-emerald-50 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
              Audit-Ready in Seconds
            </div>
          </div>
        </div>
      </section>

      {/* Sample Report Library */}
      <section id="sample-reports" className="bg-slate-100/50 border-y border-gray-200/50 py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 inline-block mb-3">
              📚 Public Report Showcase
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-gray-950 mb-3">
              Explore Our Live Compliance Output
            </h2>
            <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto">
              Select one of the seeded work council minutes reports below to read the output in our page-flip BookViewer. No account registration required.
            </p>
          </div>

          {sortedReports && sortedReports.length > 0 ? (
            <SampleReportLibrary reports={sortedReports} />
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-white max-w-lg mx-auto">
              <span className="text-3xl">📭</span>
              <p className="text-gray-500 text-xs font-bold mt-2">No seeded reports found in database.</p>
              <p className="text-gray-400 text-[10px] mt-1">Please make sure `pnpm prisma db seed` has been executed.</p>
            </div>
          )}
        </div>
      </section>

      {/* Pricing / Tier Comparison matrix */}
      <section id="pricing" className="py-20 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-serif font-black text-gray-950 mb-3">
            Compare Feature Capabilities
          </h2>
          <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto">
            Choose the operational coverage required for your organization's legal board and union committee reviews.
          </p>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{tier.icon}</span>
                  <h3 className="font-extrabold text-base text-gray-950">{tier.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed min-h-[32px]">{tier.tagline}</p>
                <div className="text-xl font-black text-gray-950 mb-6">
                  {tier.priceLabel}
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-indigo-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/login"
                className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                Choose {tier.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hidden md:block">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6 font-extrabold text-[10px]">Feature Matrix</th>
                <th className="py-4 px-6 font-extrabold text-[10px]">Essential</th>
                <th className="py-4 px-6 font-extrabold text-[10px]">Scope</th>
                <th className="py-4 px-6 font-extrabold text-[10px]">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {TIER_FEATURES.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="block font-bold text-gray-950">{row.feature}</span>
                    <span className="text-[10px] text-gray-400">{row.category}</span>
                  </td>
                  <td className="py-4 px-6 font-medium">
                    {typeof row.essential === 'boolean' ? (
                      row.essential ? '✓ Yes' : '—'
                    ) : (
                      row.essential
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-indigo-600">
                    {typeof row.scope === 'boolean' ? (
                      row.scope ? '✓ Yes' : '—'
                    ) : (
                      row.scope
                    )}
                  </td>
                  <td className="py-4 px-6 font-semibold text-amber-600">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? '✓ Yes' : '—'
                    ) : (
                      row.premium
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0F1E] text-white border-t border-white/5 py-12 px-6 md:px-12 mt-auto">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-extrabold text-sm text-white shadow-brand">
                M
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">MeetingMind</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              Modern automation pipelines built specifically to keep work councils and union delegates secure and in line with regional regulatory requirements.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#sample-reports" className="hover:text-white transition-colors">Sample Reports</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Plans</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-widest mb-4">Compliance</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><span className="text-gray-500">France (CSE / CSSCT) — Active</span></li>
              <li><span className="text-gray-500">Germany (Betriebsrat) — Soon</span></li>
              <li><span className="text-gray-500">UK (Governance) — Soon</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">About Us</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Contact Support</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Security & Privacy</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto w-full border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-500">
          <p>© 2026 Styleit Fashion / MeetingMind. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
