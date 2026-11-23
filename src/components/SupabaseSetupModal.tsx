import { useState } from 'react';
import { Check, Copy, Database, X } from 'lucide-react';

const SCHEMA_SQL_SNIPPET = `-- Jalankan di Supabase SQL Editor (file lengkap: /supabase/schema.sql)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nip TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'tenaga_kependidikan'
    CHECK (role IN ('admin', 'guru', 'tenaga_kependidikan')),
  jabatan TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nis TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  jurusan TEXT NOT NULL CHECK (jurusan IN ('TKJ', 'DKV', 'AK', 'BC', 'MPLB', 'BD')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jam_masuk TIMESTAMPTZ,
  jam_pulang TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Terlambat', 'Izin', 'Sakit')),
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tanggal)
);

CREATE TABLE IF NOT EXISTS public.student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpa')),
  catatan TEXT DEFAULT '',
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, tanggal)
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INTEGER;
  assigned_role TEXT;
  meta_role TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  meta_role := NEW.raw_user_meta_data ->> 'role';
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSIF meta_role IN ('admin', 'guru', 'tenaga_kependidikan') THEN
    assigned_role := meta_role;
  ELSE
    assigned_role := 'tenaga_kependidikan';
  END IF;
  INSERT INTO public.profiles (id, email, full_name, nip, role, jabatan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'nip', ''),
    assigned_role,
    COALESCE(NEW.raw_user_meta_data ->> 'jabatan', '')
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_user_role() IN ('admin', 'guru'));

DROP POLICY IF EXISTS "profiles_update_admin_or_self" ON public.profiles;
CREATE POLICY "profiles_update_admin_or_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'admin')
  WITH CHECK (
    public.current_user_role() = 'admin'
    OR (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'admin' OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "students_select_authenticated" ON public.students;
CREATE POLICY "students_select_authenticated" ON public.students FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "students_manage_admin" ON public.students;
CREATE POLICY "students_manage_admin" ON public.students FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "emp_att_select" ON public.employee_attendance;
CREATE POLICY "emp_att_select" ON public.employee_attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "emp_att_insert_own" ON public.employee_attendance;
CREATE POLICY "emp_att_insert_own" ON public.employee_attendance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "emp_att_update_own" ON public.employee_attendance;
CREATE POLICY "emp_att_update_own" ON public.employee_attendance FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin')
  WITH CHECK (user_id = auth.uid() OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "stu_att_select" ON public.student_attendance;
CREATE POLICY "stu_att_select" ON public.student_attendance FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('admin', 'guru'));

DROP POLICY IF EXISTS "stu_att_write_admin_guru" ON public.student_attendance;
CREATE POLICY "stu_att_write_admin_guru" ON public.student_attendance FOR ALL TO authenticated
  USING (public.current_user_role() IN ('admin', 'guru'))
  WITH CHECK (public.current_user_role() IN ('admin', 'guru'));`;

export function SupabaseSetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SCHEMA_SQL_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-setup-title"
    >
      <div className="w-full max-w-3xl rounded-xl border border-neutral-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-red-700" />
            <h2 id="supabase-setup-title" className="text-lg font-bold text-slate-900">
              Panduan Integrasi &amp; Schema SQL Supabase
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-neutral-100 hover:text-slate-900 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6 max-h-[75vh] overflow-y-auto">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-slate-700 space-y-2">
            <p className="font-semibold text-slate-900">1. Konfigurasi Variabel Environment (Secrets)</p>
            <p>
              Tambahkan tiga variabel berikut pada menu Secrets / <code className="font-mono text-xs bg-white px-1.5 py-0.5 border border-neutral-200 rounded">.env</code>:
            </p>
            <ul className="list-disc pl-5 font-mono text-xs space-y-1 text-slate-800">
              <li>SUPABASE_URL=https://project-id.supabase.co</li>
              <li>SUPABASE_ANON_KEY=eyJ...</li>
              <li>SUPABASE_SERVICE_ROLE_KEY=eyJ... (wajib untuk tambah &amp; hard-delete user Auth)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                2. Jalankan SQL Schema di Supabase SQL Editor
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-neutral-50 transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Tersalin' : 'Salin SQL'}
              </button>
            </div>
            <pre className="max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed">
              {SCHEMA_SQL_SNIPPET}
            </pre>
          </div>
        </div>

        <div className="flex justify-end border-t border-neutral-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
