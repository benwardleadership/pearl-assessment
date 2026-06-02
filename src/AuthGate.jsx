import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import SignIn from './views/SignIn.jsx'

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecovering(true)
        setSession(s)
      } else {
        setRecovering(false)
        setSession(s)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return <LoadingScreen />
  if (recovering) return <SetPassword />
  if (!session) return <SignIn />
  return children
}

function SetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [done, setDone]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else setDone(true)
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

        {done ? (
          <>
            <h1 className="signin-heading">Password set!</h1>
            <p className="signin-sub">You're signed in. <a href="/" style={{ color: 'var(--teal)' }}>Go to the app →</a></p>
          </>
        ) : (
          <>
            <h1 className="signin-heading">Set your password</h1>
            <p className="signin-sub">Choose a password for your account.</p>
            <form onSubmit={handleSubmit} className="signin-form">
              <div>
                <label className="field-label">New password</label>
                <input className="text-field" type="password" required minLength={8}
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="field-label">Confirm password</label>
                <input className="text-field" type="password" required minLength={8}
                  value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
              </div>
              {error && <div className="signin-error">{error}</div>}
              <button className="btn btn-primary signin-btn" type="submit" disabled={loading}>
                {loading ? 'Setting password…' : 'Set password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="signin-shell">
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', fontSize: 14 }}>
        <img src="/s-mark-on-navy.png" alt="" style={{ height: 40, opacity: .7, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
        Loading…
      </div>
    </div>
  )
}
