/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import LandingPage from './pages/LandingPage';
import JurusanDetailPage from './pages/JurusanDetailPage';
import LoginPage from './pages/LoginPage';
import DashboardView from './pages/app/DashboardView';
import AbsensiKaryawanView from './pages/app/AbsensiKaryawanView';
import AbsensiSiswaView from './pages/app/AbsensiSiswaView';
import RekapKaryawanView from './pages/app/RekapKaryawanView';
import RekapSiswaView from './pages/app/RekapSiswaView';
import DataSiswaView from './pages/app/DataSiswaView';
import UserManagementView from './pages/app/UserManagementView';
import { UserRole } from './types';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-3 text-slate-600">
      <Loader2 className="h-6 w-6 animate-spin text-red-700" />
      <p className="text-sm font-medium">Memuat sesi portal...</p>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireRole({ allowed, children }: { allowed: UserRole[]; children: React.ReactNode }) {
  const { profile } = useAuth();

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(profile.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Dynamic Department Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/jurusan/:slug" element={<JurusanDetailPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="absensi-karyawan" element={<AbsensiKaryawanView />} />

            <Route
              path="absensi-siswa"
              element={
                <RequireRole allowed={['admin', 'guru']}>
                  <AbsensiSiswaView />
                </RequireRole>
              }
            />

            <Route
              path="rekap/karyawan"
              element={
                <RequireRole allowed={['admin']}>
                  <RekapKaryawanView />
                </RequireRole>
              }
            />

            <Route
              path="rekap/siswa"
              element={
                <RequireRole allowed={['admin', 'guru']}>
                  <RekapSiswaView />
                </RequireRole>
              }
            />

            <Route
              path="data-siswa"
              element={
                <RequireRole allowed={['admin']}>
                  <DataSiswaView />
                </RequireRole>
              }
            />

            <Route
              path="users"
              element={
                <RequireRole allowed={['admin']}>
                  <UserManagementView />
                </RequireRole>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
