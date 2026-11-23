import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import {
  downloadCSV,
  formatTanggalID,
  getFirstDayOfMonthISO,
  getTodayDateISO,
} from '../../lib/utils';
import { JurusanCode, StudentAttendance } from '../../types';

const JURUSAN_OPTIONS: JurusanCode[] = ['TKJ', 'DKV', 'AK', 'BC', 'MPLB', 'BD'];

export default function RekapSiswaView() {
  const [startDate, setStartDate] = useState(getFirstDayOfMonthISO());
  const [endDate, setEndDate] = useState(getTodayDateISO());
  const [jurusanFilter, setJurusanFilter] = useState('ALL');
  const [kelasFilter, setKelasFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [rows, setRows] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('student_attendance')
      .select('*, students(nis, nama, kelas, jurusan)')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRows(data as StudentAttendance[]);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const kelasOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const r of rows) {
      if (r.students?.kelas) unique.add(r.students.kelas);
    }
    return Array.from(unique).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (jurusanFilter !== 'ALL' && r.students?.jurusan !== jurusanFilter) return false;
      if (kelasFilter !== 'ALL' && r.students?.kelas !== kelasFilter) return false;
      if (q) {
        const nama = (r.students?.nama || '').toLowerCase();
        const nis = (r.students?.nis || '').toLowerCase();
        if (!nama.includes(q) && !nis.includes(q)) return false;
      }
      return true;
    });
  }, [rows, jurusanFilter, kelasFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      Hadir: filtered.filter((r) => r.status === 'Hadir').length,
      Sakit: filtered.filter((r) => r.status === 'Sakit').length,
      Izin: filtered.filter((r) => r.status === 'Izin').length,
      Alpa: filtered.filter((r) => r.status === 'Alpa').length,
    };
  }, [filtered]);

  const handleExport = () => {
    downloadCSV(
      `rekap-absensi-siswa-${startDate}-sd-${endDate}.csv`,
      ['Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Jurusan', 'Status', 'Catatan'],
      filtered.map((r) => [
        r.tanggal,
        r.students?.nis || '-',
        r.students?.nama || '-',
        r.students?.kelas || '-',
        r.students?.jurusan || '-',
        r.status,
        r.catatan || '-',
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Rekap Absensi Siswa</h2>
          <p className="text-sm text-slate-600">
            Pantau riwayat kehadiran siswa lintas kelas dan kompetensi keahlian.
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
        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="rs-start" className="block text-xs font-semibold text-slate-600">
            Dari
          </label>
          <input
            id="rs-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-2.5 py-2 font-mono text-xs focus:border-red-700 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="rs-end" className="block text-xs font-semibold text-slate-600">
            Sampai
          </label>
          <input
            id="rs-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-2.5 py-2 font-mono text-xs focus:border-red-700 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="rs-jurusan" className="block text-xs font-semibold text-slate-600">
            Jurusan
          </label>
          <select
            id="rs-jurusan"
            value={jurusanFilter}
            onChange={(e) => setJurusanFilter(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-sm focus:border-red-700 focus:outline-none"
          >
            <option value="ALL">Semua</option>
            {JURUSAN_OPTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3 space-y-1">
          <label htmlFor="rs-kelas" className="block text-xs font-semibold text-slate-600">
            Kelas
          </label>
          <select
            id="rs-kelas"
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-sm focus:border-red-700 focus:outline-none"
          >
            <option value="ALL">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3 space-y-1">
          <label htmlFor="rs-search" className="block text-xs font-semibold text-slate-600">
            Cari NIS / Nama
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="rs-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="NIS atau nama..."
              className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-red-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">Hadir</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">{counts.Hadir}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">Sakit</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">{counts.Sakit}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">Izin</p>
          <p className="mt-1 font-mono text-2xl font-bold text-sky-700 tabular-nums">{counts.Izin}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">Alpa</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-700 tabular-nums">{counts.Alpa}</p>
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
            Belum ada data rekap absensi siswa pada rentang filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nama Siswa</th>
                  <th className="px-4 py-3">Kelas</th>
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
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {row.students?.nis || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.students?.nama || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {row.students?.kelas || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          row.status === 'Hadir'
                            ? 'text-emerald-700'
                            : row.status === 'Sakit'
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
