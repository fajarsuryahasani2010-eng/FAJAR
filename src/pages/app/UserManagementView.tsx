import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeID, getRoleLabel } from '../../lib/utils';
import { UserProfile, UserRole } from '../../types';

export default function UserManagementView() {
  const { session, profile: currentProfile, config } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  const loadUsers = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Gagal memuat daftar pengguna.' });
      } else {
        setUsers(data.users || []);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Gagal terhubung ke endpoint manajemen pengguna.' });
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (
        q &&
        !u.full_name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.nip || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setNip('');
    setJabatan('');
    setRole('guru');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEmail(user.email);
    setPassword('');
    setFullName(user.full_name);
    setNip(user.nip || '');
    setJabatan(user.jabatan || '');
    setRole(user.role);
    setIsActive(user.is_active);
    setModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setFeedback(null);
    setSubmitting(true);

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PATCH' : 'POST';

      const payload: Record<string, unknown> = {
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        nip: nip.trim(),
        jabatan: jabatan.trim(),
        role,
        is_active: isActive,
      };
      if (password.trim()) {
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Gagal menyimpan data pengguna.' });
        return;
      }

      setFeedback({
        type: 'success',
        text: editingUser
          ? `Pengguna ${fullName} berhasil diperbarui dan disinkronkan ke Supabase Auth.`
          : `Pengguna ${fullName} berhasil dibuat di Supabase Authentication.`,
      });
      setModalOpen(false);
      await loadUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    if (!deleteTarget || !session?.access_token) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Gagal menghapus user.' });
      } else {
        setFeedback({
          type: 'success',
          text: `Akun ${deleteTarget.full_name} (${deleteTarget.email}) telah dihapus permanen hingga ke Supabase Authentication.`,
        });
        setDeleteTarget(null);
        await loadUsers();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-sm text-slate-600">
            Kelola akun Admin, Guru, dan Tenaga Kependidikan tersinkronisasi penuh dengan Supabase Authentication.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={!config?.hasServiceRole}
          className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {config && !config.hasServiceRole && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Variabel <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> belum diatur pada server.
          Tambahkan key tersebut agar Admin dapat menambah, mengubah, dan melakukan hard-delete akun hingga ke
          Supabase Authentication.
        </div>
      )}

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
          <label htmlFor="um-role" className="block text-xs font-semibold text-slate-600">
            Filter Peran
          </label>
          <select
            id="um-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
          >
            <option value="ALL">Semua Peran ({users.length})</option>
            <option value="admin">Administrator</option>
            <option value="guru">Guru</option>
            <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
          </select>
        </div>

        <div className="sm:col-span-8 space-y-1">
          <label htmlFor="um-search" className="block text-xs font-semibold text-slate-600">
            Cari Nama, Email, atau NIP
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="um-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama, email, atau NIP..."
              className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-red-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-neutral-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Tidak ada data pengguna yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">NIP</th>
                  <th className="px-4 py-3">Peran &amp; Jabatan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Login Terakhir</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((user) => {
                  const isSelf = user.id === currentProfile?.id;
                  return (
                    <tr key={user.id} className="hover:bg-neutral-50/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {user.full_name} {isSelf && <span className="text-xs text-red-700">(Anda)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {user.nip || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-900">{getRoleLabel(user.role)}</p>
                        <p className="text-xs text-slate-500">{user.jabatan || '-'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            user.is_active ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateTimeID(user.last_sign_in_at)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-neutral-100 hover:text-slate-900"
                            aria-label={`Edit ${user.full_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(user)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Hapus permanen ${user.full_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit Pengguna (Supabase Auth Sync)' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="u-name" className="block text-xs font-semibold text-slate-700">
                    Nama Lengkap
                  </label>
                  <input
                    id="u-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Siti Rahmawati, S.Kom"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="u-email" className="block text-xs font-semibold text-slate-700">
                    Email Login
                  </label>
                  <input
                    id="u-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@smkprimaunggul.sch.id"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="u-pass" className="block text-xs font-semibold text-slate-700">
                    {editingUser ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi Awal'}
                  </label>
                  <input
                    id="u-pass"
                    type="password"
                    required={!editingUser}
                    minLength={editingUser && !password ? undefined : 6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="u-role" className="block text-xs font-semibold text-slate-700">
                    Role Akses
                  </label>
                  <select
                    id="u-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={editingUser?.id === currentProfile?.id}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-700 focus:outline-none disabled:bg-neutral-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="guru">Guru</option>
                    <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="u-nip" className="block text-xs font-semibold text-slate-700">
                    NIP / NUPTK
                  </label>
                  <input
                    id="u-nip"
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Opsional"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="u-jabatan" className="block text-xs font-semibold text-slate-700">
                    Jabatan / Mata Pelajaran
                  </label>
                  <input
                    id="u-jabatan"
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Contoh: Guru Produktif TKJ / Staf Tata Usaha"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                  />
                </div>

                {editingUser && (
                  <div className="sm:col-span-2 flex items-center gap-2.5 pt-1">
                    <input
                      id="u-active"
                      type="checkbox"
                      checked={isActive}
                      disabled={editingUser.id === currentProfile?.id}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-red-700 focus:ring-red-700"
                    />
                    <label htmlFor="u-active" className="text-sm text-slate-700">
                      Akun aktif (dapat masuk ke sistem)
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
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
                  <span>{editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hard Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Permanen Pengguna (Hard Delete)?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Akun <strong>{deleteTarget.full_name}</strong> ({deleteTarget.email}) akan dihapus permanen dari{' '}
                  <strong>Supabase Authentication</strong> beserta profil dan riwayat absensi karyawannya. Tindakan ini
                  tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                onClick={handleHardDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
