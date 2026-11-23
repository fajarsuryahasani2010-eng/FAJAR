import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import {
  downloadCSV,
  formatJam,
  formatTanggalID,
  getFirstDayOfMonthISO,
  getRoleLabel,
  getTodayDateISO,
} from '../../lib/utils';
import { EmployeeAttendance } from '../../types';

export default function RekapKaryawanView() {
  const [startDate, setStartDate] = useState(getFirstDayOfMonthISO());
  const [endDate, setEndDate] = useState(getTodayDateISO());
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('employee_attendance')
      .select('*, profiles(full_name, email, nip, role, jabatan)')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRows(data as EmployeeAttendance[]);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== 'ALL' && r.profiles?.role !== roleFilter) return false;
      if (q) {
        const name = (r.profiles?.full_name || '').toLowerCase();
        const nip = (r.profiles?.nip || '').toLowerCase();
        const email = (r.profiles?.email || '').toLowerCase();
        if (!name.includes(q) && !nip.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [rows, roleFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      Hadir: filtered.filter((r) => r.status === 'Hadir').length,
      Terlambat: filtered.filter((r) => r.status === 'Terlambat').length,
      Izin: filtered.filter((r) => r.status === 'Izin').length,
      Sakit: filtered.filter((r) => r.status === 'Sakit').length,
    };
  }, [filtered]);

  const handleExport = () => {
    downloadCSV(
      `rekap-absensi-karyawan-${startDate}-sd-${endDate}.csv`,
      ['Tanggal', 'NIP', 'Nama Karyawan', 'Peran', 'Jabatan', 'Jam Masuk', 'Jam Pulang', 'Status', 'Catatan'],
      filtered.map((r) => [
        r.tanggal,
        r.profiles?.nip || '-',
        r.profiles?.full_name || '-',
        getRoleLabel(r.profiles?.role || ''),
        r.profiles?.jabatan || '-',
        formatJam(r.jam_masuk),
        formatJam(r.jam_pulang),
        r.status,
        r.catatan || '-',
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Rekap Absensi Karyawan</h2>
          <p className="text-sm text-slate-600">
            Laporan kehadiran Admin, Guru, dan Tenaga Kependidikan berdasarkan rentang tanggal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-12">
        <div className="sm:col-span-3 space-y-1">
          <label htmlFor="rk-start" className="block text-xs font-semibold text-slate-600">
            Dari Tanggal
          </label>
          <input
            id="rk-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-red-700 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-3 space-y-1">
          <label htmlFor="rk-end" className="block text-xs font-semibold text-slate-600">
            Sampai Tanggal
          </label>
          <input
            id="rk-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-red-700 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-3 space-y-1">
          <label htmlFor="rk-role" className="block text-xs font-semibold text-slate-600">
            Peran
          </label>
          <select
            id="rk-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
          >
            <option value="ALL">Semua Peran</option>
            <option value="admin">Administrator</option>
            <option value="guru">Guru</option>
            <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
          </select>
        </div>
        <div className="sm:col-span-3 space-y-1">
          <label htmlFor="rk-search" className="block text-xs font-semibold text-slate-600">
            Cari Nama / NIP
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="rk-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nama atau NIP..."
              className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-red-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">Hadir Tepat Waktu</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">{counts.Hadir}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">Terlambat</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">{counts.Terlambat}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">Izin</p>
          <p className="mt-1 font-mono text-2xl font-bold text-sky-700 tabular-nums">{counts.Izin}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">Sakit</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-700 tabular-nums">{counts.Sakit}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-neutral-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Tidak ditemukan catatan absensi karyawan untuk filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Karyawan</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3">Masuk</th>
                  <th className="px-4 py-3">Pulang</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/70">
                    <td className="px-4 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                      {formatTanggalID(row.tanggal)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.profiles?.full_name || '-'}</p>
                      <p className="font-mono text-xs text-slate-500">{row.profiles?.nip || row.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {getRoleLabel(row.profiles?.role || '')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {formatJam(row.jam_masuk)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {formatJam(row.jam_pulang)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          row.status === 'Hadir'
                            ? 'text-emerald-700'
                            : row.status === 'Terlambat'
                              ? 'text-amber-700'
                              : row.status === 'Izin'
                                ? 'text-sky-700'
                                : 'text-red-700'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{row.catatan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
