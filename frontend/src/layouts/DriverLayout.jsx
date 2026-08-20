import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/driver', label: 'Dashboard', end: true },
  { to: '/driver/my-route', label: 'My Route' },
]

export default function DriverLayout() {
  const { user, logout } = useAuth()
  if (!user || user.role !== 'driver') {
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
              end={item.end}
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
