-- ============================================================================
-- SMK PRIMA UNGGUL - SISTEM ABSENSI SISWA & KARYAWAN
-- Schema Database, Trigger User Pertama = Admin, & Row Level Security (RLS)
-- Jalankan seluruh script ini di Supabase SQL Editor.
-- ============================================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabel Profiles (Sinkron dengan auth.users)
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

-- 3. Tabel Siswa (NIS, Nama, Kelas, Jurusan)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nis TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  jurusan TEXT NOT NULL CHECK (jurusan IN ('TKJ', 'DKV', 'AK', 'BC', 'MPLB', 'BD')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Absensi Karyawan (Semua role: admin, guru, tenaga_kependidikan)
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

-- 5. Tabel Absensi Siswa (Diisi oleh Guru / Admin)
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

-- 6. Trigger Otomatis: User Pertama di Supabase Auth = Admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Helper Function untuk Role User Saat Ini
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 8. Aktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.current_user_role() IN ('admin', 'guru'));

DROP POLICY IF EXISTS "profiles_update_admin_or_self" ON public.profiles;
CREATE POLICY "profiles_update_admin_or_self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'admin')
  WITH CHECK (
    public.current_user_role() = 'admin'
    OR (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
  );

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin' OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Policy: students
DROP POLICY IF EXISTS "students_select_authenticated" ON public.students;
CREATE POLICY "students_select_authenticated"
  ON public.students FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "students_manage_admin" ON public.students;
CREATE POLICY "students_manage_admin"
  ON public.students FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Policy: employee_attendance
DROP POLICY IF EXISTS "emp_att_select" ON public.employee_attendance;
CREATE POLICY "emp_att_select"
  ON public.employee_attendance FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "emp_att_insert_own" ON public.employee_attendance;
CREATE POLICY "emp_att_insert_own"
  ON public.employee_attendance FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "emp_att_update_own" ON public.employee_attendance;
CREATE POLICY "emp_att_update_own"
  ON public.employee_attendance FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() = 'admin')
  WITH CHECK (user_id = auth.uid() OR public.current_user_role() = 'admin');

-- Policy: student_attendance
DROP POLICY IF EXISTS "stu_att_select" ON public.student_attendance;
CREATE POLICY "stu_att_select"
  ON public.student_attendance FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'guru'));

DROP POLICY IF EXISTS "stu_att_write_admin_guru" ON public.student_attendance;
CREATE POLICY "stu_att_write_admin_guru"
  ON public.student_attendance FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'guru'))
  WITH CHECK (public.current_user_role() IN ('admin', 'guru'));
