import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { DEMO_ACCOUNTS } from '../utils/constants'
import { validEmail, validPassword } from '../utils/validators'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname || null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailErr = validEmail(email)
    const passErr = validPassword(password)
    if (emailErr || passErr) {
      setError(emailErr || passErr)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const user = await login({ email, password })
      navigate(from || `/${user.role}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (acc) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div className="auth-card card">
      <div className="auth-brand">
        <span className="logo-dot" />
        <h1>EcoRoute</h1>
      </div>
      <p className="auth-tagline">Smart waste collection for cleaner cities</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="auth-divider">Demo accounts</div>
      <div className="demo-row">
        {DEMO_ACCOUNTS.map((acc) => (
          <button key={acc.role} type="button" className="btn btn-outline demo-btn" onClick={() => fillDemo(acc)}>
            {acc.label}
          </button>
        ))}
      </div>

      <p className="auth-footer">
        New resident or driver? <Link to="/signup">Create an account</Link>
      </p>
      <p className="auth-footer">
        City administrator? <Link to="/admin/login">Sign in to the admin console</Link>
      </p>
    </div>
  )
}
