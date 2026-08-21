import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/community', label: 'Dashboard', end: true },
  { to: '/community/report', label: 'Report Waste' },
  { to: '/community/schedule', label: 'Collection Schedule' },
  { to: '/community/recycle', label: 'Recycle Waste' },
]

export default function CommunityLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="community-shell">
      <aside className="community-sidebar">
        <div className="community-brand">
          <span className="logo-dot" />
          <div className="community-brand-title">
            <strong>EcoRoute</strong>
            <span className="community-role-pill">Resident</span>
          </div>
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
        <div className="community-sidebar-footer">
          <span className="community-sidebar-user">{user?.name}</span>
          <span className="muted">{user?.email}</span>
          <button type="button" className="btn btn-outline" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
