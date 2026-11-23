export type UserRole = 'admin' | 'guru' | 'tenaga_kependidikan';

export type JurusanCode = 'TKJ' | 'DKV' | 'AK' | 'BC' | 'MPLB' | 'BD';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  nip: string;
  role: UserRole;
  jabatan: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
}

export interface Student {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  jurusan: JurusanCode;
  created_at: string;
  updated_at?: string;
}

export type EmployeeAttendanceStatus = 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit';

export interface EmployeeAttendance {
  id: string;
  user_id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: EmployeeAttendanceStatus;
  catatan: string;
  created_at: string;
  profiles?: Pick<UserProfile, 'full_name' | 'email' | 'nip' | 'role' | 'jabatan'>;
}

export type StudentAttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export interface StudentAttendance {
  id: string;
  student_id: string;
  tanggal: string;
  status: StudentAttendanceStatus;
  catatan: string;
  recorded_by: string | null;
  created_at: string;
  updated_at?: string;
  students?: Pick<Student, 'nis' | 'nama' | 'kelas' | 'jurusan'>;
  recorder?: Pick<UserProfile, 'full_name'> | null;
}

export interface AppConfig {
  configured: boolean;
  hasServiceRole: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}
