import { Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireRole } from './layouts/RootLayout'
import AuthLayout from './layouts/AuthLayout'
import CommunityLayout from './layouts/CommunityLayout'
import AdminLayout from './layouts/AdminLayout'
import DriverLayout from './layouts/DriverLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import CommunityDashboard from './pages/community/CommunityDashboard'
import ReportWaste from './pages/community/ReportWaste'
import CollectionSchedule from './pages/community/CollectionSchedule'
import RecycleWaste from './pages/community/RecycleWaste'
import Dashboard from './pages/admin/Dashboard'
import WastePoints from './pages/admin/WastePoints'
import Trucks from './pages/admin/Trucks'
import RoutesPage from './pages/admin/Routes'
import Reports from './pages/admin/Reports'
import Analytics from './pages/admin/Analytics'
import DriverDashboard from './pages/driver/DriverDashboard'
import MyRoute from './pages/driver/MyRoute'

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
            <Route path="trucks" element={<Trucks />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
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

          <Route path="*" element={<LandingPage />} />
        </Routes>
  )
}
