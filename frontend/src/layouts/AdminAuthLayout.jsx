import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminAuthLayout() {
  const { user } = useAuth()
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    const home = user.role === 'driver' ? '/driver' : '/community'
    return <Navigate to={home} replace />
  }
  return <Outlet />
}
