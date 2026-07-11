import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MeetingMind — Sign In',
  description: 'Sign in to your MeetingMind compliance reporting account.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      {/* Left brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-mark">M</div>
            <span className="auth-logo-text">MeetingMind</span>
          </div>

          {/* Tagline */}
          <h1 className="auth-brand-headline">
            Turn meetings into<br />
            <span className="auth-brand-accent">compliance-ready</span><br />
            reports.
          </h1>
          <p className="auth-brand-sub">
            AI-powered transcription, analysis, and report generation for works councils &amp; HR compliance bodies.
          </p>

          {/* Feature pillars */}
          <div className="auth-feature-list">
            {[
              { icon: '🎙️', label: 'Auto-transcription with speaker diarization' },
              { icon: '⚖️', label: 'French Labor Code compliance audit' },
              { icon: '📄', label: 'Signed, legally-ready PDF reports' },
            ].map((f) => (
              <div key={f.label} className="auth-feature-item">
                <span className="auth-feature-icon">{f.icon}</span>
                <span className="auth-feature-label">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="auth-trust-badge">
            <span className="auth-trust-dot" />
            <span>Trusted by 500+ enterprises</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        {children}
      </div>
    </div>
  )
}
