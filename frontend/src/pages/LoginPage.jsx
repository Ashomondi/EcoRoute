import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import { validateEmail, validatePassword } from '../utils/validators'

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@ecoroute.dev', password: 'admin123' },
  { role: 'Driver', email: 'driver@ecoroute.dev', password: 'driver123' },
  { role: 'Community', email: 'community@ecoroute.dev', password: 'community123' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const homeFor = (role) =>
    role === 'admin' ? '/admin' : role === 'driver' ? '/driver' : '/community'

  async function submit(e) {
    e.preventDefault()
    setError('')
    const err = validateEmail(email) || validatePassword(password)
    if (err) {
      setError(err)
      return
    }
    setBusy(true)
    try {
      const user = await login(email, password)
      navigate(homeFor(user.role))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function demo(email, password) {
    setError('')
    setBusy(true)
    try {
      const user = await login(email, password)
      navigate(homeFor(user.role))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div className="auth-brand">
          <Logo size={30} />
          <h1>EcoRoute</h1>
        </div>
        <p className="auth-tagline">Smart waste collection for cleaner cities</p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR TRY A DEMO ACCOUNT</span>
        </div>

        <div className="demo-row">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              className="btn btn-outline demo-btn"
              type="button"
              disabled={busy}
              onClick={() => demo(acc.email, acc.password)}
            >
              {acc.role}
            </button>
          ))}
        </div>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </p>
        <p className="auth-footer">
          City operator? <Link to="/admin/login">Sign in to the Admin Console</Link>
        </p>
      </div>
    </div>
  )
}
