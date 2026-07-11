'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', companyName: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Sign up failed. Please try again.')
      setLoading(false)
      return
    }

    // Auto-sign in after successful signup
    const signInRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (signInRes?.error) {
      setError('Account created but auto sign-in failed. Please log in manually.')
    } else {
      router.push('/wizard/region')
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-card-title">Create your account</h2>
        <p className="auth-card-sub">Start generating compliance-ready meeting reports</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field-row">
          <div className="auth-field">
            <label htmlFor="name" className="auth-label">Full name</label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              className="auth-input"
              placeholder="Jean Dupont"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="companyName" className="auth-label">Company name</label>
            <input
              id="companyName"
              type="text"
              required
              value={form.companyName}
              onChange={update('companyName')}
              className="auth-input"
              placeholder="Acme Corp"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="email" className="auth-label">Work email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            className="auth-input"
            placeholder="you@company.com"
          />
        </div>

        <div className="auth-field-row">
          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              className="auth-input"
              placeholder="Min. 8 characters"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirm" className="auth-label">Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              value={form.confirm}
              onChange={update('confirm')}
              className="auth-input"
              placeholder="Repeat password"
            />
          </div>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          id="signup-submit"
          disabled={loading}
          className="auth-submit-btn"
        >
          {loading ? (
            <span className="auth-btn-loading">
              <span className="auth-spinner" /> Creating account…
            </span>
          ) : (
            'Create account →'
          )}
        </button>

        <p className="auth-terms">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      <p className="auth-switch-link">
        Already have an account?{' '}
        <Link href="/login" className="auth-link">
          Sign in →
        </Link>
      </p>
    </div>
  )
}
