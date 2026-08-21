import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'

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
      <aside className="community-sidebar">
        <div className="community-brand">
          <Logo size={28} />
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
          <p className="community-sidebar-user">{user.name}</p>
          <button className="btn btn-outline" type="button" onClick={logout}>
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
