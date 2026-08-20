import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/waste-points', label: 'Waste Points' },
  { to: '/admin/trucks', label: 'Trucks' },
  { to: '/admin/routes', label: 'Routes' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/analytics', label: 'Analytics' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo-dot" />
          <strong>EcoRoute</strong>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="muted">{user.name || user.email}</p>
          <button className="btn btn-outline btn-block" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
