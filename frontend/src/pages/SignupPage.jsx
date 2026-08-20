import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('community')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setBusy(true)
    try {
      const user = await register({ name, email, password, role })
      navigate(role === 'driver' ? '/driver' : '/community')
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
          <span className="logo-dot" />
          <h1>EcoRoute</h1>
        </div>
        <p className="auth-tagline">Join your city&apos;s clean-up</p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>
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
          <div className="field">
            <label htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              className="input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="role">I am a…</label>
            <select
              id="role"
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="community">Resident / Community member</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
