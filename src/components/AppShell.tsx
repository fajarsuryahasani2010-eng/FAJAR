import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ClipboardCheck,
  FileBarChart2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SchoolLogo } from './SchoolLogo';
import { getRoleLabel } from '../lib/utils';

export function AppShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rekapOpen, setRekapOpen] = useState(true);

  if (!profile) return null;

  const role = profile.role;
  const isAdmin = role === 'admin';
  const isGuru = role === 'guru';

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const getBreadcrumbTitle = () => {
    const p = location.pathname;
    if (p.includes('/app/absensi-karyawan')) return 'Absensi Karyawan';
    if (p.includes('/app/absensi-siswa')) return 'Absensi Siswa';
    if (p.includes('/app/rekap/karyawan')) return 'Rekap Absensi / Absensi Karyawan';
    if (p.includes('/app/rekap/siswa')) return 'Rekap Absensi / Absensi Siswa';
    if (p.includes('/app/data-siswa')) return 'Data Siswa';
    if (p.includes('/app/users')) return 'User Management';
    return 'Dashboard';
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-red-700 text-white'
        : 'text-slate-700 hover:bg-red-50 hover:text-red-800'
    }`;

  const subLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-lg py-2 pl-10 pr-3 text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-red-50 text-red-800 font-semibold'
        : 'text-slate-600 hover:bg-neutral-100 hover:text-slate-900'
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-neutral-200">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-5">
          <SchoolLogo />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-neutral-100 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-3" aria-label="Menu Utama">
          <NavLink
            to="/app/dashboard"
            className={navLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/app/absensi-karyawan"
            className={navLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>Absensi Karyawan</span>
          </NavLink>

          {(isAdmin || isGuru) && (
            <NavLink
              to="/app/absensi-siswa"
              className={navLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              <span>Absensi Siswa</span>
            </NavLink>
          )}

          {(isAdmin || isGuru) && (
            <div className="space-y-1 pt-0.5">
              <button
                type="button"
                onClick={() => setRekapOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  location.pathname.includes('/app/rekap')
                    ? 'text-red-800 bg-red-50/70'
                    : 'text-slate-700 hover:bg-red-50 hover:text-red-800'
                }`}
              >
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <FileBarChart2 className="h-4 w-4 shrink-0" />
                  <span>Rekap Absensi</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    rekapOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {rekapOpen && (
                <div className="space-y-1">
                  {isAdmin && (
                    <NavLink
                      to="/app/rekap/karyawan"
                      className={subLinkClass}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Absensi Karyawan</span>
                    </NavLink>
                  )}
                  <NavLink
                    to="/app/rekap/siswa"
                    className={subLinkClass}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Absensi Siswa</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <NavLink
              to="/app/data-siswa"
              className={navLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>Data Siswa</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/app/users"
              className={navLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>User Management</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* User Summary Footer inside Sidebar */}
      <div className="border-t border-neutral-200 p-4">
        <div className="space-y-0.5">
          <p className="truncate text-sm font-semibold text-slate-900">{profile.full_name}</p>
          <p className="text-xs text-slate-500">
            {getRoleLabel(profile.role)}
            {profile.nip ? ` · ${profile.nip}` : ''}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-slate-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-64 max-w-[80vw] h-full">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header with Breadcrumb Left & Logout Right */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-neutral-100 lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400">Portal</span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="truncate font-semibold text-slate-900">{getBreadcrumbTitle()}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-800">{profile.full_name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-red-700">{getRoleLabel(profile.role)}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-800 hover:bg-red-700 hover:text-white hover:border-red-700 transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
