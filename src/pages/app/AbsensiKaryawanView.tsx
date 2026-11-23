import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2, LogIn, LogOut as LogOutIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import { formatJam, formatTanggalID, getRoleLabel, getTodayDateISO } from '../../lib/utils';
import { EmployeeAttendance, EmployeeAttendanceStatus } from '../../types';

export default function AbsensiKaryawanView() {
  const { profile } = useAuth();
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<EmployeeAttendance | null>(null);
  const [history, setHistory] = useState<EmployeeAttendance[]>([]);

  const [leaveStatus, setLeaveStatus] = useState<'Izin' | 'Sakit'>('Izin');
  const [leaveNote, setLeaveNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!profile) return;
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const today = getTodayDateISO();
    const { data, error } = await supabase
      .from('employee_attendance')
      .select('*')
      .eq('user_id', profile.id)
      .order('tanggal', { ascending: false })
      .limit(30);

    if (!error && data) {
      const rows = data as EmployeeAttendance[];
      setHistory(rows);
      setTodayRecord(rows.find((r) => r.tanggal === today) || null);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleClockIn = async () => {
    if (!profile) return;
    setFeedback(null);
    setSubmitting(true);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      const current = new Date();
      // Terlambat if after 07:30 local time
      const isLate = current.getHours() > 7 || (current.getHours() === 7 && current.getMinutes() > 30);
      const status: EmployeeAttendanceStatus = isLate ? 'Terlambat' : 'Hadir';

      const { error } = await supabase.from('employee_attendance').insert({
        user_id: profile.id,
        tanggal: getTodayDateISO(),
        jam_masuk: current.toISOString(),
        status,
        catatan: isLate ? 'Melewati batas jam masuk 07:30' : '',
      });

      if (error) {
        setFeedback({ type: 'error', text: error.message });
      } else {
        setFeedback({
          type: 'success',
          text: `Absen masuk berhasil dicatat pada ${formatJam(current.toISOString())} (${status}).`,
        });
        await fetchAttendance();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;
    setFeedback(null);
    setSubmitting(true);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      const current = new Date();
      const { error } = await supabase
        .from('employee_attendance')
        .update({
          jam_pulang: current.toISOString(),
          updated_at: current.toISOString(),
        })
        .eq('id', todayRecord.id);

      if (error) {
        setFeedback({ type: 'error', text: error.message });
      } else {
        setFeedback({
          type: 'success',
          text: `Absen pulang berhasil dicatat pada ${formatJam(current.toISOString())}.`,
        });
        await fetchAttendance();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!leaveNote.trim()) {
      setFeedback({ type: 'error', text: 'Mohon isi keterangan alasan izin atau sakit.' });
      return;
    }

    setFeedback(null);
    setSubmitting(true);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      const { error } = await supabase.from('employee_attendance').upsert(
        {
          user_id: profile.id,
          tanggal: getTodayDateISO(),
          status: leaveStatus,
          catatan: leaveNote.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,tanggal' }
      );

      if (error) {
        setFeedback({ type: 'error', text: error.message });
      } else {
        setFeedback({
          type: 'success',
          text: `Pengajuan ${leaveStatus} hari ini berhasil disimpan.`,
        });
        setLeaveNote('');
        await fetchAttendance();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  const currentTimeStr = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Absensi Karyawan Mandiri</h2>
          <p className="text-sm text-slate-600">
            {profile.full_name} · {getRoleLabel(profile.role)}
            {profile.jabatan ? ` (${profile.jabatan})` : ''}
          </p>
        </div>
        <p className="font-mono text-sm font-semibold text-slate-700 tabular-nums">
          {formatTanggalID(getTodayDateISO())} · {currentTimeStr}
        </p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Presensi Hari Ini */}
        <div className="lg:col-span-7 rounded-xl border border-neutral-200 bg-white p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900">Presensi Hari Ini</h3>
              <p className="text-xs text-slate-500">Batas waktu tepat waktu masuk: 07:30 WIB</p>
            </div>
            <Clock className="h-5 w-5 text-red-700" />
          </div>

          {loading ? (
            <div className="h-28 animate-pulse rounded-lg bg-neutral-100" />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 border-b border-neutral-100 pb-5">
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {todayRecord ? todayRecord.status : 'Belum Absen'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Jam Masuk</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                    {formatJam(todayRecord?.jam_masuk ?? null)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Jam Pulang</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                    {formatJam(todayRecord?.jam_pulang ?? null)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!todayRecord && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleClockIn}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    <span>Catat Absen Masuk</span>
                  </button>
                )}

                {todayRecord &&
                  (todayRecord.status === 'Hadir' || todayRecord.status === 'Terlambat') &&
                  !todayRecord.jam_pulang && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleClockOut}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOutIcon className="h-4 w-4" />
                      )}
                      <span>Catat Absen Pulang</span>
                    </button>
                  )}

                {todayRecord && (todayRecord.jam_pulang || todayRecord.status === 'Izin' || todayRecord.status === 'Sakit') && (
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Presensi hari ini telah lengkap tercatat.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pengajuan Izin / Sakit */}
        <div className="lg:col-span-5 rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900">Pengajuan Izin / Sakit</h3>
            <p className="text-xs text-slate-500">Gunakan formulir ini jika berhalangan hadir hari ini.</p>
          </div>

          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-100 p-1">
              {(['Izin', 'Sakit'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLeaveStatus(type)}
                  className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                    leaveStatus === type
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="leave-note" className="block text-xs font-medium text-slate-700">
                Keterangan / Alasan
              </label>
              <textarea
                id="leave-note"
                rows={3}
                value={leaveNote}
                onChange={(e) => setLeaveNote(e.target.value)}
                placeholder="Contoh: Dinas luar di Dinas Pendidikan / Izin sakit dengan surat dokter"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/15"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || Boolean(todayRecord?.jam_masuk)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Simpan Keterangan {leaveStatus}
            </button>
            {todayRecord?.jam_masuk && (
              <p className="text-xs text-slate-500">Anda sudah mencatat absen masuk hari ini.</p>
            )}
          </form>
        </div>
      </div>

      {/* Riwayat 30 Hari Terakhir */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Riwayat Absensi Pribadi (30 Hari Terakhir)</h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-neutral-100" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">
            Belum ada riwayat absensi karyawan yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Jam Masuk</th>
                  <th className="px-5 py-3">Jam Pulang</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/70">
                    <td className="px-5 py-3 font-medium text-slate-900 tabular-nums">
                      {formatTanggalID(item.tanggal)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {formatJam(item.jam_masuk)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 tabular-nums">
                      {formatJam(item.jam_pulang)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          item.status === 'Hadir'
                            ? 'text-emerald-700'
                            : item.status === 'Terlambat'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{item.catatan || '-'}</td>
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
