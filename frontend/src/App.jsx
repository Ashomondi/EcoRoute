import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import RootLayout from './layouts/RootLayout'
import AdminLayout from './layouts/AdminLayout'
import CommunityLayout from './layouts/CommunityLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/admin/Dashboard'
import WastePoints from './pages/admin/WastePoints'
import Trucks from './pages/admin/Trucks'
import Reports from './pages/admin/Reports'
import Analytics from './pages/admin/Analytics'
import CommunityDashboard from './pages/community/CommunityDashboard'
import ReportWaste from './pages/community/ReportWaste'
import CollectionSchedule from './pages/community/CollectionSchedule'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<LandingPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="waste-points" element={<WastePoints />} />
          <Route path="trucks" element={<Trucks />} />
          <Route path="reports" element={<Reports />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="/community" element={<CommunityLayout />}>
          <Route index element={<CommunityDashboard />} />
          <Route path="report" element={<ReportWaste />} />
          <Route path="schedule" element={<CollectionSchedule />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  )
}
