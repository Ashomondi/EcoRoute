import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { useAuth } from '../../hooks/useAuth'
import { validateEmail, validatePassword } from '../../utils/validators'

export default function AdminLogin() {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
      await adminLogin(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-auth-wrap">
      <div className="admin-auth-card">
        <div className="admin-auth-brand">
          <Logo size={40} />
          <div>
            <h1>EcoRoute</h1>
            <span className="admin-auth-sub">Admin Console</span>
          </div>
        </div>
        <p className="admin-auth-tagline">Sign in to manage your city&apos;s operations.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              className="input admin-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ecoroute.dev"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              className="input admin-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to Admin'}
          </button>
        </form>

        <p className="admin-auth-footer">
          New admin? <Link to="/admin/signup">Create an account</Link>
        </p>
        <p className="admin-auth-footer">
          Resident or driver? <Link to="/login">Use the resident portal</Link>
        </p>
      </div>
    </div>
  )
}
