'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Invalid email or password. Please try again.')
    } else {
      // Fetch the session to determine the role and redirect accordingly
      try {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/wizard/region')
        }
      } catch {
        router.push('/wizard/region')
      }
    }

  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-card-title">Welcome back</h2>
        <p className="auth-card-sub">Sign in to your MeetingMind account</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="email" className="auth-label">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@company.com"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="auth-label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="auth-submit-btn"
          id="login-submit"
        >
          {loading ? (
            <span className="auth-btn-loading">
              <span className="auth-spinner" /> Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>Demo credentials</span>
      </div>
      <div className="auth-demo-creds">
        <div className="auth-demo-row">
          <span className="auth-demo-badge auth-demo-badge--admin">Admin</span>
          <code>admin@meetingmind.com / password123</code>
        </div>
        <div className="auth-demo-row">
          <span className="auth-demo-badge auth-demo-badge--client">Client</span>
          <code>client1@meetingmind.com / password123</code>
        </div>
      </div>

      <p className="auth-switch-link">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="auth-link">
          Create one free →
        </Link>
      </p>
    </div>
  )
}
