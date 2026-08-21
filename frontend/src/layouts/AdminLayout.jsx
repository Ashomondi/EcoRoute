import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/smart-bins', label: 'Smart Bins' },
  { to: '/admin/waste-points', label: 'Waste Points' },
  { to: '/admin/trucks', label: 'Trucks' },
  { to: '/admin/routes', label: 'Routes' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/marketplace', label: '🛒 EcoMarket' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="admin-theme">
      <div className="shell">
        <aside className="sidebar admin-sidebar">
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
            <span className="admin-sidebar-user">{user?.name}</span>
            <button type="button" className="btn btn-outline" onClick={logout}>
              Sign out
            </button>
          </div>
        </aside>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
