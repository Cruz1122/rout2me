import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import Layout from '../components/Layout';
import GlobalLoader from '../components/GlobalLoader';

// Lazy loading de componentes
const HomePage = lazy(() => import('../pages/HomePage'));
const Vehicles = lazy(() => import('../pages/Vehicles'));
const Users = lazy(() => import('../pages/Users'));
const LiveFleet = lazy(() => import('../pages/LiveFleet'));
const RoutesPage = lazy(() => import('../pages/Routes'));
const SignIn = lazy(() => import('../pages/SignIn'));
const SignUp = lazy(() => import('../pages/SignUp'));
const AuthCallback = lazy(() => import('../pages/AuthCallback'));
const EmailVerified = lazy(() => import('../pages/EmailVerified'));
const App = lazy(() => import('../App'));

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<GlobalLoader />}>
        <Layout>
          <Routes>
            <Route path="/" element={<AuthCallback />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/live-fleet"
              element={
                <ProtectedRoute>
                  <LiveFleet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routes"
              element={
                <ProtectedRoute>
                  <RoutesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/signin"
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />
            <Route path="/email-verified" element={<EmailVerified />} />
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </Routes>
        </Layout>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRoutes;
