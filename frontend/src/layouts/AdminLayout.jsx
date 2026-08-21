import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'

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
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="shell admin-theme">
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-brand">
          <Logo size={28} />
          <strong>EcoRoute</strong>
          <span className="community-role-pill">Admin</span>
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
          <p className="admin-sidebar-user">{user.name}</p>
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
