import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/community', label: 'Dashboard', end: true },
  { to: '/community/report', label: 'Report Waste' },
  { to: '/community/schedule', label: 'Collection Schedule' },
]

export default function CommunityLayout() {
  const { user, logout } = useAuth()
  if (!user || user.role !== 'community') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="community-shell">
      <header className="community-header">
        <div className="community-brand">
          <span className="logo-dot" />
          <strong>EcoRoute</strong>
        </div>
        <nav className="community-nav">
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
        <button className="btn btn-outline" type="button" onClick={logout}>
          Log out
        </button>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
