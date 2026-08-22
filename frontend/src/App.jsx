import { Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireRole } from './layouts/RootLayout'
import AuthLayout from './layouts/AuthLayout'
import CommunityLayout from './layouts/CommunityLayout'
import AdminLayout from './layouts/AdminLayout'
import DriverLayout from './layouts/DriverLayout'
import MarketLayout from './layouts/MarketLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminAuthLayout from './layouts/AdminAuthLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminSignup from './pages/admin/AdminSignup'
import CommunityDashboard from './pages/community/CommunityDashboard'
import ReportWaste from './pages/community/ReportWaste'
import CollectionSchedule from './pages/community/CollectionSchedule'
import RecycleWaste from './pages/community/RecycleWaste'
import Dashboard from './pages/admin/Dashboard'
import WastePoints from './pages/admin/WastePoints'
import SmartBins from './pages/admin/SmartBins'
import Trucks from './pages/admin/Trucks'
import RoutesPage from './pages/admin/Routes'
import Reports from './pages/admin/Reports'
import Analytics from './pages/admin/Analytics'
import AdminMarketplace from './pages/admin/Marketplace'
import DriverDashboard from './pages/driver/DriverDashboard'
import MyRoute from './pages/driver/MyRoute'
import MarketHome from './pages/market/MarketHome'
import MarketSellers from './pages/market/Sellers'
import ProductDetail from './pages/market/ProductDetail'
import CartPage from './pages/market/Cart'
import CheckoutPage from './pages/market/Checkout'
import MyOrders from './pages/market/MyOrders'
import SellerDashboard from './pages/market/SellerDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            }
          />

          <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
          <Route element={<AdminAuthLayout />}>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
          </Route>

          <Route
            path="/community"
            element={
              <RequireAuth>
                <CommunityLayout />
              </RequireAuth>
            }
          >
            <Route index element={<CommunityDashboard />} />
            <Route path="report" element={<ReportWaste />} />
            <Route path="schedule" element={<CollectionSchedule />} />
            <Route path="recycle" element={<RecycleWaste />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="waste-points" element={<WastePoints />} />
            <Route path="smart-bins" element={<SmartBins />} />
            <Route path="trucks" element={<Trucks />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="marketplace" element={<AdminMarketplace />} />
          </Route>

          <Route
            path="/driver"
            element={
              <RequireRole role="driver">
                <DriverLayout />
              </RequireRole>
            }
          >
            <Route index element={<DriverDashboard />} />
            <Route path="route" element={<MyRoute />} />
          </Route>

          <Route path="/market" element={<MarketLayout />}>
            <Route index element={<MarketHome />} />
            <Route path="sellers" element={<MarketSellers />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route
              path="cart"
              element={
                <RequireAuth>
                  <CartPage />
                </RequireAuth>
              }
            />
            <Route
              path="checkout"
              element={
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              }
            />
            <Route
              path="orders"
              element={
                <RequireAuth>
                  <MyOrders />
                </RequireAuth>
              }
            />
            <Route
              path="seller"
              element={
                <RequireAuth>
                  <SellerDashboard />
                </RequireAuth>
              }
            />
          </Route>

          <Route path="*" element={<LandingPage />} />
        </Routes>
  )
}
