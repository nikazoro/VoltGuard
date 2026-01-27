import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthGuard, PublicRoute } from '@/components/shared/AuthGuard';
import { Navbar } from '@/components/shared/Navbar';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import MapExplorer from '@/pages/driver/MapExplorer';
import MyBookings from '@/pages/driver/MyBookings';
import OwnerDashboard from '@/pages/owner/Dashboard';
import StationMonitor from '@/pages/owner/StationMonitor';
import OwnerStations from '@/pages/owner/Stations';
import AdminConsole from '@/pages/admin/AdminConsole';
import Profile from '@/pages/Profile';
import LandingPage from '@/pages/LandingPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background">
              <Navbar />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />

                {/* Driver Routes */}
                <Route
                  path="/map"
                  element={
                    <AuthGuard allowedRoles={['driver']}>
                      <MapExplorer />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <AuthGuard allowedRoles={['driver']}>
                      <MyBookings />
                    </AuthGuard>
                  }
                />

                {/* Owner Routes */}
                <Route
                  path="/owner/dashboard"
                  element={
                    <AuthGuard allowedRoles={['station_owner']}>
                      <OwnerDashboard />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/owner/stations"
                  element={
                    <AuthGuard allowedRoles={['station_owner']}>
                      <OwnerStations />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/owner/stations/:stationId"
                  element={
                    <AuthGuard allowedRoles={['station_owner']}>
                      <StationMonitor />
                    </AuthGuard>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/console"
                  element={
                    <AuthGuard allowedRoles={['admin']}>
                      <AdminConsole />
                    </AuthGuard>
                  }
                />

                {/* Profile (All authenticated users) */}
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;