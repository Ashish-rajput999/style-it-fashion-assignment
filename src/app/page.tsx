export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Brand mark */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #6D5DF6 0%, #4F46E5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(109, 93, 246, 0.3)',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 8h16v3H8V8zm0 5h12v3H8v-3zm0 5h14v3H8v-3zm0 5h10v3H8v-3z" fill="white" opacity="0.9"/>
          <path d="M24 20l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1
        style={{
          fontSize: 40,
          fontWeight: 800,
          color: 'var(--brand-ink)',
          margin: '0 0 12px 0',
          letterSpacing: '-0.02em',
          textAlign: 'center',
        }}
      >
        MeetingMind
      </h1>

      <p
        style={{
          fontSize: 18,
          color: '#6B7280',
          margin: '0 0 8px 0',
          textAlign: 'center',
          maxWidth: 480,
          lineHeight: 1.6,
        }}
      >
        AI-Powered Compliance Meeting Minutes
      </p>

      <p
        style={{
          fontSize: 13,
          color: '#9CA3AF',
          margin: '0 0 40px 0',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        Styleit Fashion · Phase 1 Scaffold ✓
      </p>

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <a
          href="/login"
          style={{
            padding: '12px 24px',
            background: '#6D5DF6',
            color: '#fff',
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 4px 20px rgba(109, 93, 246, 0.25)',
            transition: 'all 150ms',
          }}
        >
          Client Login →
        </a>
        <a
          href="/login"
          style={{
            padding: '12px 24px',
            background: '#fff',
            color: '#0F1226',
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 14,
            border: '1px solid #E7E7F2',
          }}
        >
          Admin Panel →
        </a>
      </div>

      {/* Phase checklist */}
      <div
        style={{
          marginTop: 60,
          padding: '24px 32px',
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E7E7F2',
          boxShadow: '0 4px 16px rgba(15, 18, 38, 0.06)',
          maxWidth: 480,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#6D5DF6',
            margin: '0 0 16px 0',
          }}
        >
          Phase 1 — Scaffold Complete
        </p>
        {[
          ['✅', 'Next.js 16 App Router + TypeScript strict'],
          ['✅', 'Tailwind CSS v4 + design token system'],
          ['✅', 'Prisma schema + SQLite datasource'],
          ['✅', 'Auth.js credentials provider + role gating'],
          ['✅', 'Route groups: (marketing) / (auth) / (client) / (admin)'],
          ['✅', 'Provider abstraction: STT / LLM / TTS'],
          ['✅', 'Mock providers (offline, no API keys needed)'],
          ['✅', 'Real adapters: Deepgram, OpenAI, Gemini, DeepSeek'],
          ['✅', 'Compliance regions config (France/CSE active)'],
          ['✅', 'Tier config (Essential / Scope / Premium)'],
          ['✅', 'Report schema TypeScript types'],
          ['✅', 'Storage abstraction (local → S3 ready)'],
          ['⏳', 'Phase 2: Design system + report components'],
        ].map(([icon, text]) => (
          <div
            key={String(text)}
            style={{
              display: 'flex',
              gap: 10,
              padding: '6px 0',
              fontSize: 13,
              color: String(icon) === '⏳' ? '#9CA3AF' : '#374151',
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            <span>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
