import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AuthLayout() {
  const { user } = useAuth()
  if (user) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/community'
    return <Navigate to={home} replace />
  }
  return <Outlet />
}
