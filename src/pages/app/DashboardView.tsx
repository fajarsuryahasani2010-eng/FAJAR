import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ClipboardCheck, Clock, GraduationCap, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import { formatJam, formatTanggalID, getRoleLabel, getTodayDateISO } from '../../lib/utils';
import { EmployeeAttendance, StudentAttendance } from '../../types';

interface DashboardStats {
  todayAttendance: EmployeeAttendance | null;
  totalStudents: number;
  studentsHadirToday: number;
  studentsAbsentToday: number;
  employeesHadirToday: number;
  totalActiveEmployees: number;
  recentEmployeeLogs: EmployeeAttendance[];
  recentStudentLogs: StudentAttendance[];
}

export default function DashboardView() {
  const { profile } = useAuth();
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayAttendance: null,
    totalStudents: 0,
    studentsHadirToday: 0,
    studentsAbsentToday: 0,
    employeesHadirToday: 0,
    totalActiveEmployees: 0,
    recentEmployeeLogs: [],
    recentStudentLogs: [],
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile) return;
    let active = true;

    async function loadDashboard() {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        if (active) setLoading(false);
        return;
      }

      const today = getTodayDateISO();
      const isAdmin = profile!.role === 'admin';
      const isGuru = profile!.role === 'guru';

      try {
        const { data: myToday } = await supabase
          .from('employee_attendance')
          .select('*')
          .eq('user_id', profile!.id)
          .eq('tanggal', today)
          .maybeSingle();

        const { data: myRecent } = await supabase
          .from('employee_attendance')
          .select('*')
          .eq('user_id', profile!.id)
          .order('tanggal', { ascending: false })
          .limit(5);

        let totalStudents = 0;
        let studentsHadirToday = 0;
        let studentsAbsentToday = 0;
        let recentStudentLogs: StudentAttendance[] = [];

        if (isAdmin || isGuru) {
          const { count: stuCount } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true });
          totalStudents = stuCount ?? 0;

          const { data: stuToday } = await supabase
            .from('student_attendance')
            .select('status')
            .eq('tanggal', today);

          if (stuToday) {
            studentsHadirToday = stuToday.filter((s) => s.status === 'Hadir').length;
            studentsAbsentToday = stuToday.filter((s) => s.status !== 'Hadir').length;
          }

          const { data: stuRecent } = await supabase
            .from('student_attendance')
            .select('*, students(nis, nama, kelas, jurusan)')
            .order('created_at', { ascending: false })
            .limit(6);
          recentStudentLogs = (stuRecent || []) as StudentAttendance[];
        }

        let employeesHadirToday = 0;
        let totalActiveEmployees = 0;
        let recentEmployeeLogs = (myRecent || []) as EmployeeAttendance[];

        if (isAdmin) {
          const { count: empCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true);
          totalActiveEmployees = empCount ?? 0;

          const { data: empToday } = await supabase
            .from('employee_attendance')
            .select('status')
            .eq('tanggal', today);
          if (empToday) {
            employeesHadirToday = empToday.filter(
              (e) => e.status === 'Hadir' || e.status === 'Terlambat'
            ).length;
          }

          const { data: allEmpRecent } = await supabase
            .from('employee_attendance')
            .select('*, profiles(full_name, email, nip, role, jabatan)')
            .order('created_at', { ascending: false })
            .limit(6);
          if (allEmpRecent) {
            recentEmployeeLogs = allEmpRecent as EmployeeAttendance[];
          }
        }

        if (active) {
          setStats({
            todayAttendance: (myToday as EmployeeAttendance) || null,
            totalStudents,
            studentsHadirToday,
            studentsAbsentToday,
            employeesHadirToday,
            totalActiveEmployees,
            recentEmployeeLogs,
            recentStudentLogs,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [profile]);

  if (!profile) return null;

  const isAdmin = profile.role === 'admin';
  const isGuru = profile.role === 'guru';

  const currentTimeStr = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  const currentDateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-red-700">{getRoleLabel(profile.role)}</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Selamat Datang, {profile.full_name}
          </h2>
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>{currentDateStr}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 border-t border-neutral-100 pt-4 sm:border-t-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-500">Waktu Lokal</p>
            <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{currentTimeStr}</p>
          </div>
          <Link
            to="/app/absensi-karyawan"
            className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 transition-colors whitespace-nowrap shrink-0"
          >
            <UserCheck className="h-4 w-4" />
            <span>Absensi Saya</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Status Presensi Pribadi</span>
            <Clock className="h-4 w-4 text-red-700" />
          </div>
          {loading ? (
            <div className="h-7 w-28 animate-pulse rounded bg-neutral-200" />
          ) : (
            <p className="text-xl font-bold text-slate-900">
              {stats.todayAttendance ? stats.todayAttendance.status : 'Belum Absen'}
            </p>
          )}
          <p className="font-mono text-xs text-slate-500 tabular-nums">
            Masuk: {formatJam(stats.todayAttendance?.jam_masuk ?? null)} · Pulang:{' '}
            {formatJam(stats.todayAttendance?.jam_pulang ?? null)}
          </p>
        </div>

        {(isAdmin || isGuru) && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Total Siswa Terdaftar</span>
              <GraduationCap className="h-4 w-4 text-red-700" />
            </div>
            {loading ? (
              <div className="h-7 w-20 animate-pulse rounded bg-neutral-200" />
            ) : (
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{stats.totalStudents}</p>
            )}
            <p className="text-xs text-slate-500">Seluruh kelas &amp; jurusan</p>
          </div>
        )}

        {(isAdmin || isGuru) && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Siswa Hadir Hari Ini</span>
              <ClipboardCheck className="h-4 w-4 text-emerald-600" />
            </div>
            {loading ? (
              <div className="h-7 w-20 animate-pulse rounded bg-neutral-200" />
            ) : (
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {stats.studentsHadirToday}
              </p>
            )}
            <p className="font-mono text-xs text-slate-500 tabular-nums">
              Sakit / Izin / Alpa: {stats.studentsAbsentToday}
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Karyawan Hadir Hari Ini</span>
              <Users className="h-4 w-4 text-red-700" />
            </div>
            {loading ? (
              <div className="h-7 w-20 animate-pulse rounded bg-neutral-200" />
            ) : (
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {stats.employeesHadirToday}{' '}
                <span className="text-sm font-normal text-slate-500">/ {stats.totalActiveEmployees}</span>
              </p>
            )}
            <p className="text-xs text-slate-500">Admin, Guru &amp; Tendik aktif</p>
          </div>
        )}
      </div>

      {/* Activity Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div
          className={`rounded-xl border border-neutral-200 bg-white ${
            isAdmin || isGuru ? 'lg:col-span-6' : 'lg:col-span-12'
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h3 className="text-base font-bold text-slate-900">
              {isAdmin ? 'Aktivitas Absensi Karyawan Terbaru' : 'Riwayat Absensi Saya'}
            </h3>
            <Link
              to={isAdmin ? '/app/rekap/karyawan' : '/app/absensi-karyawan'}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline whitespace-nowrap"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-neutral-100" />
              ))}
            </div>
          ) : stats.recentEmployeeLogs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm text-slate-600">Belum ada catatan absensi karyawan.</p>
              <Link
                to="/app/absensi-karyawan"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:underline"
              >
                Catat Presensi Sekarang
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-slate-600">
                  <tr>
                    {isAdmin && <th className="px-4 py-3">Nama</th>}
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Masuk</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {stats.recentEmployeeLogs.map((row) => (
                    <tr key={row.id} className="hover:bg-neutral-50/70">
                      {isAdmin && (
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {row.profiles?.full_name || '-'}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-slate-600 tabular-nums">
                        {formatTanggalID(row.tanggal)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-700 tabular-nums">
                        {formatJam(row.jam_masuk)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs font-semibold ${
                            row.status === 'Hadir'
                              ? 'text-emerald-700'
                              : row.status === 'Terlambat'
                                ? 'text-amber-700'
                                : 'text-red-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(isAdmin || isGuru) && (
          <div className="rounded-xl border border-neutral-200 bg-white lg:col-span-6">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">Presensi Siswa Terbaru</h3>
              <Link
                to="/app/rekap/siswa"
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline whitespace-nowrap"
              >
                <span>Buka Rekap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded bg-neutral-100" />
                ))}
              </div>
            ) : stats.recentStudentLogs.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm text-slate-600">Belum ada presensi siswa tercatat.</p>
                <Link
                  to="/app/absensi-siswa"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:underline"
                >
                  Input Absensi Siswa
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Siswa</th>
                      <th className="px-4 py-3">Kelas</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {stats.recentStudentLogs.map((row) => (
                      <tr key={row.id} className="hover:bg-neutral-50/70">
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {row.students?.nama || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">
                          {row.students?.kelas || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 tabular-nums">
                          {formatTanggalID(row.tanggal)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-xs font-semibold ${
                              row.status === 'Hadir'
                                ? 'text-emerald-700'
                                : row.status === 'Alpa'
                                  ? 'text-red-700'
                                  : 'text-amber-700'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
