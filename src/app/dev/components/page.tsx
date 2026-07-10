'use client'

import React, { useState } from 'react'
import { CoverPage } from '@/components/report/CoverPage'
import { DocDetailsTable } from '@/components/report/DocDetailsTable'
import { NoticeSection } from '@/components/report/NoticeSection'
import { ExecSummaryCards } from '@/components/report/ExecSummaryCards'
import { AttendanceTable } from '@/components/report/AttendanceTable'
import { SpeakerBubble } from '@/components/report/SpeakerBubble'
import { AlertCallout } from '@/components/report/AlertCallout'
import { Timeline } from '@/components/report/Timeline'
import { VoteBlock } from '@/components/report/VoteBlock'
import { PageChrome } from '@/components/report/PageChrome'
import { DataTable } from '@/components/report/DataTable'

// Mock Data
const mockMeta = {
  title: 'Extraordinary Work Council Meeting (CSE)',
  company: 'Styleit Fashion Pvt Ltd',
  date: '2026-06-24T10:00:00.000Z',
  location: 'Mumbai HQ & Video Conference',
  meetingType: 'Extraordinary',
  complianceType: 'CSE',
  preparedBy: 'MeetingMind AI System',
  reference: 'REF-2026-CSE-0042',
}

const mockStats = {
  attendees: 5,
  duration: '1h 45m',
  decisions: 3,
  actionItems: 5,
}

const mockAttendees = [
  { name: 'Mohit Dandwani', role: 'Chairperson / President', status: 'Present' as const, arrival: '10:00', departure: '11:45' },
  { name: 'Ashish Rajput', role: 'Secretary of CSE', status: 'Present' as const, arrival: '10:02', departure: '11:45' },
  { name: 'Sarah Bernard', role: 'HR Director', status: 'Present' as const, arrival: '10:00', departure: '11:45' },
  { name: 'Pierre Dubois', role: 'Staff Representative (Union A)', status: 'Present' as const, arrival: '10:05', departure: '11:45' },
  { name: 'Jean Dupont', role: 'Staff Representative (Union B)', status: 'Excused' as const },
]

const mockExecSummary = [
  { label: 'Executive Summary', text: 'The extraordinary session addressed the urgent restructuring plans for the logistics department. A compromise was negotiated regarding transitional support packages, resulting in a formal resolution approved by majority vote.' },
  { label: 'Key Objectives', text: 'Define worker relocation guidelines, ratify package details, and establish training pathways for impacted operators.' },
]

const mockTimeline = [
  { date: '10:05 AM', description: 'Meeting called to order by Chairperson Mohit Dandwani.' },
  { date: '10:20 AM', description: 'Presentation of the logistics relocation package.' },
  { date: '10:45 AM', description: 'Negotiation on training support budget.' },
  { date: '11:15 AM', description: 'Formal vote called on Resolution #1.' },
  { date: '11:35 AM', description: 'Session adjourned; scheduling next followup.' },
]

const mockVoters = [
  { name: 'Ashish Rajput', group: 'CSE Secretary', vote: 'Favorable' as const },
  { name: 'Pierre Dubois', group: 'Union A Representative', vote: 'Favorable' as const },
  { name: 'Jean Dupont', group: 'Union B Representative', vote: 'Abstention' as const },
]

export default function DevComponentsPage() {
  const [activeTab, setActiveTab] = useState<'individual' | 'pages'>('individual')

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--brand-ink)] p-8">
      {/* Dev Header */}
      <div className="max-w-6xl mx-auto mb-8 bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="pill pill-previewed mb-2">Dev Sandbox</span>
          <h1 className="text-2xl font-extrabold tracking-tight">Report Component Library Storybook</h1>
          <p className="text-sm text-gray-500 mt-1">Sanity-check all generated report elements and pages matching style-it templates</p>
        </div>
        <div className="flex bg-[var(--brand-primary-soft)] p-1 rounded-full border border-[var(--border)]">
          <button 
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'individual' ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'text-[var(--brand-primary)]'}`}
            onClick={() => setActiveTab('individual')}
          >
            Individual Components
          </button>
          <button 
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'pages' ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'text-[var(--brand-primary)]'}`}
            onClick={() => setActiveTab('pages')}
          >
            Page Flow Layout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === 'individual' ? (
          <div className="grid grid-cols-1 gap-12">
            
            {/* Cover Page */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">1. Cover Page Component</h3>
              <div className="border border-dashed border-gray-300 p-2 bg-gray-50 rounded-xl overflow-auto">
                <div className="w-[800px] mx-auto scale-90 origin-top">
                  <CoverPage meta={mockMeta} stats={mockStats} attendees={mockAttendees} />
                </div>
              </div>
            </section>

            {/* Doc Details KV Table */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">2. Key/Value Details Table</h3>
              <div className="max-w-3xl mx-auto border p-4 rounded-xl bg-white">
                <DocDetailsTable meta={mockMeta} />
              </div>
            </section>

            {/* Notice Section */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">3. Notice Section</h3>
              <div className="max-w-3xl mx-auto border p-6 rounded-xl bg-white text-left">
                <NoticeSection />
              </div>
            </section>

            {/* Exec Summary Cards */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">4. Executive Summary Cards</h3>
              <div className="max-w-3xl mx-auto">
                <ExecSummaryCards cards={mockExecSummary} />
              </div>
            </section>

            {/* Attendance Table */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">5. Attendance/Striped Data Table</h3>
              <div className="max-w-4xl mx-auto">
                <AttendanceTable attendees={mockAttendees} />
              </div>
            </section>

            {/* Discussion Bubbles */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">6. Speaker Discussion Bubbles</h3>
              <div className="max-w-3xl mx-auto space-y-4">
                <SpeakerBubble 
                  speaker="Mohit Dandwani" 
                  role="Chairperson" 
                  text="Welcome everyone. Today we must reach an agreement on the relocation budget." 
                  timestamp="10:05"
                  roleVariant="neutral"
                />
                <SpeakerBubble 
                  speaker="Pierre Dubois" 
                  role="Staff Rep" 
                  text="We demand a 15% increase in transitional training packages. The current 10% is not sufficient to retrain senior logistics operators." 
                  timestamp="10:21"
                  roleVariant="role-a"
                />
                <SpeakerBubble 
                  speaker="Sarah Bernard" 
                  role="HR Director" 
                  text="The budget is fixed at corporate level, but we can offer flexible transition timelines instead." 
                  timestamp="10:35"
                  roleVariant="role-b"
                />
              </div>
            </section>

            {/* Alert Callouts */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">7. Alert Callouts</h3>
              <div className="max-w-3xl mx-auto space-y-4">
                <AlertCallout 
                  type="decision" 
                  subject="Resolution #1 Approved" 
                  fact="Logistics relocation packages approved at 12% training compensation."
                  implication="Staff union will recommend package acceptance next week."
                  relatedArticle="Art. L.2315-34"
                />
                <AlertCallout 
                  type="unresolved" 
                  subject="Relocation Schedule" 
                  fact="The transition timeline is still open pending regional manager sign-off."
                  nextStep="Sarah Bernard to procure timeline by July 15."
                />
                <AlertCallout 
                  type="tension" 
                  subject="Operator Relocation" 
                  fact="Union representative Dubois raised strong objections regarding travel times."
                  implication="Possible workplace arbitration if not resolved by end of month."
                />
                <AlertCallout 
                  type="projection" 
                  subject="Followup Meeting" 
                  fact="Special committee scheduled for next Friday."
                  responsibleEntity="Mohit Dandwani"
                />
              </div>
            </section>

            {/* Dotted Timeline */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">8. Dotted Timeline</h3>
              <div className="max-w-3xl mx-auto">
                <Timeline title="Relocation Discussion Flow" entries={mockTimeline} />
              </div>
            </section>

            {/* Vote Block */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">9. Vote Block</h3>
              <div className="max-w-3xl mx-auto">
                <VoteBlock 
                  question="Approve 12% transitional support packages with 4-month retraining timeline?"
                  date="2026-06-24"
                  voters={mockVoters}
                  result="Adopted by majority vote."
                />
              </div>
            </section>

            {/* Generic Data Table */}
            <section className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b">10. Generic Data Table</h3>
              <div className="max-w-4xl mx-auto">
                <DataTable 
                  headers={['Item', 'Quantity', 'Status', 'Cost']} 
                  rows={[
                    ['Office Ergonomic Chairs', '15', 'Delivered', '4,500 EUR'],
                    ['Standing Desks v2', '10', 'Pending', '3,200 EUR'],
                    ['Logitech MX Master Mouse', '20', 'Ordered', '1,800 EUR']
                  ]} 
                  widths={['40%', '20%', '20%', '20%']}
                />
              </div>
            </section>

          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Page 1: Cover */}
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-2 tracking-wider text-center">Page 1: Cover Page</p>
              <CoverPage meta={mockMeta} stats={mockStats} attendees={mockAttendees} />
            </div>

            {/* Page 2: Details & Notice */}
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-2 tracking-wider text-center">Page 2: Document Details & Legal Notice</p>
              <PageChrome pageNumber={2} totalPages={4} headerLeft="Document Details" headerRight={mockMeta.reference}>
                <p className="doc-section-label">Section 1</p>
                <h2 className="doc-section-title">Document Details</h2>
                <DocDetailsTable meta={mockMeta} />
                
                <p className="doc-section-label mt-8">Section 2</p>
                <h2 className="doc-section-title">Notice & Scope</h2>
                <NoticeSection />
              </PageChrome>
            </div>

            {/* Page 3: Overview & Attendance */}
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-2 tracking-wider text-center">Page 3: Overview & Attendance</p>
              <PageChrome pageNumber={3} totalPages={4} headerLeft="Overview & Attendance" headerRight={mockMeta.reference}>
                <p className="doc-section-label">Section 3</p>
                <h2 className="doc-section-title">Executive Summary</h2>
                <ExecSummaryCards cards={mockExecSummary} />

                <p className="doc-section-label mt-8">Section 4</p>
                <h2 className="doc-section-title">Attendance Register</h2>
                <AttendanceTable attendees={mockAttendees} />
              </PageChrome>
            </div>

            {/* Page 4: Discussion & Decisions */}
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-2 tracking-wider text-center">Page 4: Detailed Discussion & Votes</p>
              <PageChrome pageNumber={4} totalPages={4} headerLeft="Discussion & Actions" headerRight={mockMeta.reference}>
                <p className="doc-section-label">Section 5</p>
                <h2 className="doc-section-title">Discussion Log</h2>
                
                <div className="space-y-4 mb-8">
                  <SpeakerBubble 
                    speaker="Mohit Dandwani" 
                    role="Chairperson" 
                    text="We must finalize the logistics restructure plan. The floor is open." 
                    timestamp="10:05"
                  />
                  <SpeakerBubble 
                    speaker="Pierre Dubois" 
                    role="Staff Rep" 
                    text="We reject the first draft of retraining packages because travel stipends are missing." 
                    timestamp="10:15"
                  />
                </div>

                <AlertCallout 
                  type="decision" 
                  subject="Relocation Package Ratification" 
                  fact="Relocation packages ratified with addition of travel stipends up to 150 EUR/month."
                />

                <p className="doc-section-label mt-8">Section 6</p>
                <h2 className="doc-section-title">Formal Vote Log</h2>
                <VoteBlock 
                  question="Ratify final logistics relocation packages?"
                  date="2026-06-24"
                  voters={mockVoters}
                  result="Approved."
                />
              </PageChrome>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
