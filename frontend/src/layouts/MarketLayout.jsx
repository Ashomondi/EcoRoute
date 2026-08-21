import { Link, NavLink, Outlet } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useMarketplace'

const NAV = [
  { to: '/market', label: 'Shop', end: true },
  { to: '/market/sellers', label: 'Sellers', end: false },
]

export default function MarketLayout() {
  const { isAuthenticated } = useAuth()
  const { cart } = useCart()

  const cartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className="market-theme">
      <header className="market-header">
        <div className="market-header-inner">
          <Link to="/market" className="market-brand">
            <Logo size={34} />
            <span className="market-brand-text">
              <strong>EcoRoute</strong>
              <span className="market-brand-sub">EcoMarket</span>
            </span>
          </Link>

          <nav className="market-nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `market-nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="market-actions">
            {isAuthenticated ? (
              <>
                <NavLink to="/market/orders" className="market-account-link">
                  My Orders
                </NavLink>
                <NavLink to="/market/seller" className="market-account-link">
                  Sell on EcoRoute
                </NavLink>
              </>
            ) : (
              <Link to="/login" className="market-account-link">
                Sign in
              </Link>
            )}
            <NavLink to="/market/cart" className="market-cart-link" aria-label="Cart">
              <span className="market-cart-icon">🛒</span>
              {cartCount > 0 && <span className="market-cart-badge">{cartCount}</span>}
            </NavLink>
          </div>
        </div>
      </header>

      <main className="market-main">
        <Outlet />
      </main>

      <footer className="market-footer">
        <div className="market-footer-inner">
          <div className="market-brand">
            <Logo size={26} />
            <span className="market-brand-text">
              <strong>EcoRoute</strong>
              <span className="market-brand-sub">Waste → Recycle → Create → Sell</span>
            </span>
          </div>
          <p className="market-footer-note">
            Every product on EcoMarket is made from material recovered through the EcoRoute recycling pipeline.
          </p>
        </div>
      </footer>
    </div>
  )
}
