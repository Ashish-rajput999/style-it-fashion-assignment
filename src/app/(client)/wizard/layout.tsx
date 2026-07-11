import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MeetingMind — Create Report',
}

const steps = [
  { num: 1, label: 'Region & Compliance', href: '/wizard/region' },
  { num: 2, label: 'Meeting Details', href: '/wizard/details' },
  { num: 3, label: 'Upload Recording', href: '/wizard/upload' },
]

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wizard-shell">
      {/* Top header */}
      <header className="wizard-header">
        <div className="wizard-header-inner">
          <div className="wizard-logo">
            <div className="wizard-logo-mark">M</div>
            <span className="wizard-logo-name">MeetingMind</span>
          </div>
          <div className="wizard-header-steps">
            {steps.map((step, i) => (
              <div key={step.num} className="wizard-header-step-group">
                <div className="wizard-header-step">
                  <div className="wizard-step-num">{step.num}</div>
                  <span className="wizard-step-label">{step.label}</span>
                </div>
                {i < steps.length - 1 && <div className="wizard-step-connector" />}
              </div>
            ))}
          </div>
          <div className="wizard-header-right">
            <span className="wizard-ai-badge">✦ AI Powered</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="wizard-main">
        {children}
      </main>

      {/* Bottom process steps */}
      <footer className="wizard-footer">
        <div className="wizard-process-steps">
          {[
            { num: '01', icon: '🎙️', label: 'Upload Recordings' },
            { num: '02', icon: '🎵', label: 'AI Transcribes Audio' },
            { num: '03', icon: '✏️', label: 'Reformulate & Edit Minutes' },
            { num: '04', icon: '🛡️', label: 'Compliance Check' },
            { num: '05', icon: '📄', label: 'Report Ready to Distribute' },
          ].map((s, i) => (
            <div key={s.num} className="wizard-process-step-group">
              <div className="wizard-process-step">
                <div className="wizard-process-icon">{s.icon}</div>
                <span className="wizard-process-num">{s.num}</span>
                <span className="wizard-process-label">{s.label}</span>
              </div>
              {i < 4 && <div className="wizard-process-arrow">›</div>}
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
