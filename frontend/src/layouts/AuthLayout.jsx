import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AuthLayout({ children }) {
  const { user } = useAuth()
  if (user) {
    return <Navigate to={`/${user.role}`} replace />
  }
  return <div className="auth-wrap">{children}</div>
}
