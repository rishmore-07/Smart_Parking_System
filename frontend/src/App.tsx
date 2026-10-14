import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { ProfilePage } from './pages/ProfilePage';
import { FindParkingPage } from './pages/FindParkingPage';
import { FacilityDetailPage } from './pages/FacilityDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="parking" element={<FindParkingPage />} />
            <Route path="parking/:id" element={<FacilityDetailPage />} />
            <Route path="facilities/:id" element={<FacilityDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route
              path="vehicles"
              element={
                <ProtectedRoute allowedRoles={['driver', 'operator', 'admin']}>
                  <VehiclesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="bookings"
              element={
                <ProtectedRoute allowedRoles={['driver', 'operator', 'admin']}>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-bookings"
              element={
                <ProtectedRoute allowedRoles={['driver', 'operator', 'admin']}>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};


export default App;
