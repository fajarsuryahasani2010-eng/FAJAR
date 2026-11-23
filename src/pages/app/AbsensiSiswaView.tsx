import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Save, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import { getTodayDateISO } from '../../lib/utils';
import { Student, StudentAttendanceStatus } from '../../types';

interface DraftAttendance {
  status: StudentAttendanceStatus;
  catatan: string;
}

const STATUS_OPTIONS: StudentAttendanceStatus[] = ['Hadir', 'Sakit', 'Izin', 'Alpa'];

export default function AbsensiSiswaView() {
  const { profile } = useAuth();
  const [tanggal, setTanggal] = useState(getTodayDateISO());
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftAttendance>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: studentRows, error: stuErr } = await supabase
      .from('students')
      .select('*')
      .order('kelas', { ascending: true })
      .order('nama', { ascending: true });

    if (stuErr) {
      setFeedback({ type: 'error', text: stuErr.message });
      setLoading(false);
      return;
    }

    const list = (studentRows || []) as Student[];
    setStudents(list);

    const { data: attRows } = await supabase
      .from('student_attendance')
      .select('student_id, status, catatan')
      .eq('tanggal', tanggal);

    const existingMap = new Map(
      (attRows || []).map((r) => [
        r.student_id,
        { status: r.status as StudentAttendanceStatus, catatan: r.catatan || '' },
      ])
    );

    const nextDrafts: Record<string, DraftAttendance> = {};
    for (const s of list) {
      nextDrafts[s.id] = existingMap.get(s.id) || { status: 'Hadir', catatan: '' };
    }
    setDrafts(nextDrafts);
    setLoading(false);
  }, [tanggal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const kelasList = useMemo(() => {
    const unique = Array.from(new Set(students.map((s) => s.kelas)));
    return unique.sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (selectedKelas !== 'ALL' && s.kelas !== selectedKelas) return false;
      if (q && !s.nama.toLowerCase().includes(q) && !s.nis.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, selectedKelas, searchQuery]);

  const updateStudentDraft = (studentId: string, patch: Partial<DraftAttendance>) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Hadir', catatan: '' }),
        ...patch,
      },
    }));
  };

  const handleMarkAllHadir = () => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const s of filteredStudents) {
        next[s.id] = { ...(next[s.id] || { catatan: '' }), status: 'Hadir' };
      }
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    if (!profile || filteredStudents.length === 0) return;
    setFeedback(null);
    setSaving(true);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      const payload = filteredStudents.map((s) => ({
        student_id: s.id,
        tanggal,
        status: drafts[s.id]?.status || 'Hadir',
        catatan: drafts[s.id]?.catatan || '',
        recorded_by: profile.id,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('student_attendance')
        .upsert(payload, { onConflict: 'student_id,tanggal' });

      if (error) {
        setFeedback({ type: 'error', text: error.message });
      } else {
        setFeedback({
          type: 'success',
          text: `Absensi untuk ${filteredStudents.length} siswa pada tanggal ${tanggal} berhasil disimpan.`,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const summaryCounts = useMemo(() => {
    const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
    for (const s of filteredStudents) {
      const st = drafts[s.id]?.status || 'Hadir';
      counts[st] += 1;
    }
    return counts;
  }, [filteredStudents, drafts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Input Absensi Siswa</h2>
          <p className="text-sm text-slate-600">
            Pilih tanggal dan kelas, lalu tentukan status kehadiran setiap siswa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleMarkAllHadir}
            disabled={filteredStudents.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Tandai Semua Hadir</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={saving || filteredStudents.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Simpan Absensi</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-12">
        <div className="sm:col-span-3 space-y-1">
          <label htmlFor="att-date" className="block text-xs font-semibold text-slate-600">
            Tanggal
          </label>
          <input
            id="att-date"
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-red-700 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4 space-y-1">
          <label htmlFor="att-kelas" className="block text-xs font-semibold text-slate-600">
            Filter Kelas
          </label>
          <select
            id="att-kelas"
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-700 focus:outline-none"
          >
            <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-5 space-y-1">
          <label htmlFor="att-search" className="block text-xs font-semibold text-slate-600">
            Cari NIS / Nama Siswa
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="att-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik NIS atau nama siswa..."
              className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-red-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Counter Bar */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-xs text-slate-600">
        <span>
          Ditampilkan: <strong className="font-mono text-slate-900 tabular-nums">{filteredStudents.length}</strong> siswa
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Hadir: <strong className="font-mono text-emerald-700 tabular-nums">{summaryCounts.Hadir}</strong>
        </span>
        <span>
          Sakit: <strong className="font-mono text-amber-700 tabular-nums">{summaryCounts.Sakit}</strong>
        </span>
        <span>
          Izin: <strong className="font-mono text-sky-700 tabular-nums">{summaryCounts.Izin}</strong>
        </span>
        <span>
          Alpa: <strong className="font-mono text-red-700 tabular-nums">{summaryCounts.Alpa}</strong>
        </span>
      </div>

      {/* Students Attendance Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-neutral-100" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-slate-900">Belum ada data siswa terdaftar.</p>
            <p className="text-xs text-slate-500">
              Admin perlu menambahkan data siswa terlebih dahulu di menu Data Siswa.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Tidak ada siswa yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nama Siswa</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Status Kehadiran</th>
                  <th className="px-4 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStudents.map((student) => {
                  const current = drafts[student.id] || { status: 'Hadir', catatan: '' };
                  return (
                    <tr key={student.id} className="hover:bg-neutral-50/70">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {student.nis}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{student.nama}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{student.kelas}</td>
                      <td className="px-4 py-3">
                        <div className="inline-flex rounded-lg bg-neutral-100 p-1 gap-1">
                          {STATUS_OPTIONS.map((st) => {
                            const active = current.status === st;
                            let activeStyle = 'bg-white text-slate-900 shadow-sm';
                            if (active && st === 'Hadir') activeStyle = 'bg-emerald-600 text-white';
                            if (active && st === 'Sakit') activeStyle = 'bg-amber-500 text-white';
                            if (active && st === 'Izin') activeStyle = 'bg-sky-600 text-white';
                            if (active && st === 'Alpa') activeStyle = 'bg-red-700 text-white';
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => updateStudentDraft(student.id, { status: st })}
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                                  active ? activeStyle : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <input
                          type="text"
                          value={current.catatan}
                          onChange={(e) => updateStudentDraft(student.id, { catatan: e.target.value })}
                          placeholder="Keterangan opsional..."
                          className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-red-700 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
