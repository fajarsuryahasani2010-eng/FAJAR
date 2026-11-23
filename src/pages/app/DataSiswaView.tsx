import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import { JurusanCode, Student } from '../../types';

const JURUSAN_OPTIONS: JurusanCode[] = ['TKJ', 'DKV', 'AK', 'BC', 'MPLB', 'BD'];

export default function DataSiswaView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jurusanFilter, setJurusanFilter] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [nis, setNis] = useState('');
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [jurusan, setJurusan] = useState<JurusanCode>('TKJ');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('kelas', { ascending: true })
      .order('nama', { ascending: true });

    if (error) {
      setFeedback({ type: 'error', text: error.message });
    } else if (data) {
      setStudents(data as Student[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (jurusanFilter !== 'ALL' && s.jurusan !== jurusanFilter) return false;
      if (q && !s.nama.toLowerCase().includes(q) && !s.nis.toLowerCase().includes(q) && !s.kelas.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [students, jurusanFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingStudent(null);
    setNis('');
    setNama('');
    setKelas('');
    setJurusan('TKJ');
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setNis(student.nis);
    setNama(student.nama);
    setKelas(student.kelas);
    setJurusan(student.jurusan);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      const payload = {
        nis: nis.trim(),
        nama: nama.trim(),
        kelas: kelas.trim(),
        jurusan,
        updated_at: new Date().toISOString(),
      };

      if (editingStudent) {
        const { error } = await supabase.from('students').update(payload).eq('id', editingStudent.id);
        if (error) {
          setFeedback({ type: 'error', text: error.message });
          return;
        }
        setFeedback({ type: 'success', text: `Data siswa ${payload.nama} berhasil diperbarui.` });
      } else {
        const { error } = await supabase.from('students').insert(payload);
        if (error) {
          setFeedback({ type: 'error', text: error.message });
          return;
        }
        setFeedback({ type: 'success', text: `Siswa ${payload.nama} berhasil ditambahkan.` });
      }

      setModalOpen(false);
      await loadStudents();
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      const { error } = await supabase.from('students').delete().eq('id', deleteTarget.id);
      if (error) {
        setFeedback({ type: 'error', text: error.message });
      } else {
        setFeedback({ type: 'success', text: `Data siswa ${deleteTarget.nama} telah dihapus.` });
        setDeleteTarget(null);
        await loadStudents();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Data Induk Siswa</h2>
          <p className="text-sm text-slate-600">
            Kelola data NIS, Nama, Kelas, dan Kompetensi Keahlian untuk absensi oleh Guru.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Siswa</span>
        </button>
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
        <div className="sm:col-span-4 space-y-1">
          <label htmlFor="ds-jurusan" className="block text-xs font-semibold text-slate-600">
            Filter Jurusan
          </label>
          <select
            id="ds-jurusan"
            value={jurusanFilter}
            onChange={(e) => setJurusanFilter(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
          >
            <option value="ALL">Semua Jurusan ({students.length})</option>
            {JURUSAN_OPTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-8 space-y-1">
          <label htmlFor="ds-search" className="block text-xs font-semibold text-slate-600">
            Cari NIS, Nama, atau Kelas
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="ds-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: 2025001 atau X TKJ 1..."
              className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-red-700 focus:outline-none"
            />
          </div>
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
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-900">
              {students.length === 0 ? 'Belum ada data siswa.' : 'Tidak ada siswa sesuai pencarian.'}
            </p>
            {students.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Siswa Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Jurusan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-neutral-50/70">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {student.nis}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{student.nama}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{student.kelas}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-red-700 whitespace-nowrap">
                      {student.jurusan}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-neutral-100 hover:text-slate-900"
                          aria-label={`Edit ${student.nama}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(student)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Hapus ${student.nama}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div className="space-y-1">
                <label htmlFor="stu-nis" className="block text-xs font-semibold text-slate-700">
                  NIS (Nomor Induk Siswa)
                </label>
                <input
                  id="stu-nis"
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Contoh: 20260101"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-red-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="stu-nama" className="block text-xs font-semibold text-slate-700">
                  Nama Lengkap Siswa
                </label>
                <input
                  id="stu-nama"
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Nadia Putri Pratama"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="stu-jurusan" className="block text-xs font-semibold text-slate-700">
                    Jurusan
                  </label>
                  <select
                    id="stu-jurusan"
                    value={jurusan}
                    onChange={(e) => setJurusan(e.target.value as JurusanCode)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                  >
                    {JURUSAN_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="stu-kelas" className="block text-xs font-semibold text-slate-700">
                    Kelas
                  </label>
                  <input
                    id="stu-kelas"
                    type="text"
                    required
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="Contoh: X TKJ 1"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingStudent ? 'Simpan Perubahan' : 'Simpan Siswa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hapus Data Siswa?</h3>
            <p className="text-sm text-slate-600">
              Siswa <strong>{deleteTarget.nama}</strong> ({deleteTarget.nis}) beserta riwayat absensinya akan dihapus.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-neutral-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
