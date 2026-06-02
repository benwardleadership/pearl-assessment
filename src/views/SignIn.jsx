import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function SignIn() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="signin-shell">
      <div className="signin-card">
        <div className="signin-brand">
          <img src="/s-mark-on-navy.png" alt="Sellership mark" className="signin-mark" />
          <div className="signin-brand-text">
            <span className="signin-eyebrow">The Sellership System<span style={{ fontSize: 7, verticalAlign: 'super' }}>®</span></span>
            <span className="signin-title">PEARL Assessment</span>
          </div>
        </div>

        <h1 className="signin-heading">Sign in</h1>
        <p className="signin-sub">Enter your credentials to access your workspace.</p>

        <form onSubmit={handleSubmit} className="signin-form">
          <div>
            <label className="field-label">Email</label>
            <input
              className="text-field"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              className="text-field"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="signin-error">{error}</div>}

          <button className="btn btn-primary signin-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
