import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Eye, EyeOff, KeyRound, Loader2, ShieldAlert, UserPlus } from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const { config, session, profile, loading, authError, refreshProfile } = useAuth();

  const [mode, setMode] = useState<'login' | 'first_admin'>('login');
  const [hasUsers, setHasUsers] = useState<boolean>(true);
  const [checkingFirstUser, setCheckingFirstUser] = useState<boolean>(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && session && profile) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [loading, session, profile, navigate]);

  useEffect(() => {
    let active = true;
    async function checkFirstUser() {
      try {
        const res = await fetch('/api/auth/first-user-status');
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setHasUsers(Boolean(data.hasUsers));
            if (data.configured && !data.hasUsers) {
              setMode('first_admin');
            }
          }
        }
      } catch {
        // Ignore network error
      } finally {
        if (active) setCheckingFirstUser(false);
      }
    }
    checkFirstUser();
    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = await getSupabaseClient();
    if (!supabase) {
      setErrorMsg('Supabase belum dikonfigurasi. Lengkapi variabel lingkungan terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Email atau kata sandi tidak sesuai.'
            : error.message
        );
        return;
      }

      await refreshProfile();
      navigate('/app/dashboard', { replace: true });
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi saat masuk.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFirstAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = await getSupabaseClient();
    if (!supabase) {
      setErrorMsg('Supabase belum dikonfigurasi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      // If service role is configured, use server bootstrap endpoint for instant confirmation
      if (config?.hasServiceRole) {
        const res = await fetch('/api/auth/register-first-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            full_name: fullName.trim(),
            nip: nip.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Gagal mendaftarkan admin pertama.');
          return;
        }

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInErr) {
          setSuccessMsg('Akun Admin pertama berhasil dibuat. Silakan masuk.');
          setMode('login');
          setHasUsers(true);
          return;
        }
        await refreshProfile();
        navigate('/app/dashboard', { replace: true });
        return;
      }

      // Fallback via standard Supabase Auth SignUp (DB trigger handle_new_user assigns first user = admin)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            nip: nip.trim(),
            role: 'admin',
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        await refreshProfile();
        navigate('/app/dashboard', { replace: true });
      } else {
        setSuccessMsg(
          'Pendaftaran berhasil. Periksa email Anda untuk verifikasi (atau nonaktifkan Confirm Email di Supabase Auth), lalu masuk.'
        );
        setMode('login');
      }
    } catch {
      setErrorMsg('Gagal memproses pendaftaran admin pertama.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-slate-900 grid grid-cols-1 lg:grid-cols-12">
      {/* Left Crimson Architectural Panel */}
      <aside className="lg:col-span-5 bg-red-800 text-white p-8 sm:p-12 flex flex-col justify-between">
        <div className="space-y-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-red-100 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <div className="space-y-4 pt-4">
            <SchoolLogo light />
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-balance pt-2">
              Portal Sistem Absensi Siswa &amp; Karyawan
            </h1>
            <p className="text-sm leading-relaxed text-red-100 max-w-md">
              Masuk menggunakan akun resmi SMK Prima Unggul yang terdaftar pada Supabase Authentication untuk mengakses
              dasbor, presensi karyawan, presensi siswa, serta rekapitulasi kehadiran.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-4 border-t border-red-700/70 pt-6 text-xs text-red-100">
          <p className="font-semibold text-white">Ketentuan Hak Akses Peran:</p>
          <ul className="space-y-1.5 leading-relaxed">
            <li>• User pertama yang dibuat di Supabase Authentication otomatis berperan sebagai Admin.</li>
            <li>• Guru mencatat absensi siswa dan absensi karyawan mandiri.</li>
            <li>• Tenaga Kependidikan mencatat absensi karyawan mandiri.</li>
          </ul>
          <button
            type="button"
            onClick={() => setSetupModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/60 bg-red-900/50 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-900 transition-colors"
          >
            <Database className="h-3.5 w-3.5" />
            Lihat Panduan &amp; Schema SQL Supabase
          </button>
        </div>
      </aside>

      {/* Right Authentication Form */}
      <main className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {config && !config.configured && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Kredensial Supabase Belum Terpasang</p>
                  <p className="text-xs leading-relaxed text-amber-800">
                    Tambahkan <code className="font-mono">SUPABASE_URL</code>,{' '}
                    <code className="font-mono">SUPABASE_ANON_KEY</code>, dan{' '}
                    <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> pada Secrets /{' '}
                    <code className="font-mono">.env</code> untuk mengaktifkan login &amp; database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSetupModalOpen(true)}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Buka Panduan &amp; Salin SQL Schema
              </button>
            </div>
          )}

          {authError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{authError}</div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMsg}</div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {successMsg}
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
            {/* Mode Switcher */}
            {!checkingFirstUser && !hasUsers && (
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors ${
                    mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('first_admin');
                    setErrorMsg(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors ${
                    mode === 'first_admin'
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Daftar Admin Pertama
                </button>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {mode === 'first_admin' ? 'Registrasi Admin Pertama' : 'Masuk ke Aplikasi'}
              </h2>
              <p className="text-sm text-slate-600">
                {mode === 'first_admin'
                  ? 'Belum ada pengguna terdaftar. Akun pertama otomatis memperoleh peran Administrator.'
                  : 'Gunakan email dan kata sandi akun karyawan Anda.'}
              </p>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                    Alamat Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@smkprimaunggul.sch.id"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !config?.configured}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Memverifikasi...' : 'Masuk ke /app'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleFirstAdminSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="admin-name" className="block text-sm font-medium text-slate-700">
                    Nama Lengkap
                  </label>
                  <input
                    id="admin-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Drs. Ahmad Suryadi"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-nip" className="block text-sm font-medium text-slate-700">
                    NIP / Nomor Induk Karyawan (Opsional)
                  </label>
                  <input
                    id="admin-nip"
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="198501012010011001"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700">
                    Email Admin
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@smkprimaunggul.sch.id"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700">
                    Kata Sandi (Minimal 6 karakter)
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Buat kata sandi kuat"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !config?.configured}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Mendaftarkan...' : 'Buat Akun Admin Pertama'}
                </button>
              </form>
            )}

            {hasUsers && (
              <p className="text-xs text-slate-500 border-t border-neutral-100 pt-4">
                Belum memiliki akun? Hubungi Administrator sekolah untuk dibuatkan akun pada menu User Management.
              </p>
            )}
          </div>
        </div>
      </main>

      <SupabaseSetupModal open={setupModalOpen} onClose={() => setSetupModalOpen(false)} />
    </div>
  );
}
