import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { useAuth } from '../../hooks/useAuth'
import { validateAdminSignup } from '../../utils/validators'

export default function AdminSignup() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    const err = validateAdminSignup({ name, email, password, confirm, inviteCode })
    if (err) {
      setError(err)
      return
    }
    setBusy(true)
    try {
      await register({ name, email, password, role: 'admin', invite_code: inviteCode })
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
        <p className="admin-auth-tagline">Create an administrator account for your city.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="admin-name">Full Name</label>
            <input
              id="admin-name"
              className="input admin-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              className="input admin-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ecoroute.dev"
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
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-confirm">Confirm Password</label>
            <input
              id="admin-confirm"
              className="input admin-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-invite">Invite Code</label>
            <input
              id="admin-invite"
              className="input admin-input"
              type="password"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Provided by your city operations lead"
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Create Admin Account'}
          </button>
        </form>

        <p className="admin-auth-footer">
          Already have an account? <Link to="/admin/login">Sign in</Link>
        </p>
        <p className="admin-auth-footer">
          Resident or driver? <Link to="/signup">Create a resident account</Link>
        </p>
      </div>
    </div>
  )
}
