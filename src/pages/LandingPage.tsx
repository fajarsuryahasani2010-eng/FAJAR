import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Building2, CheckCircle2, MapPin, Phone, Mail, ShieldCheck, Users } from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';
import { BIDANG_KEAHLIAN_LIST, HERO_CAMPUS_IMAGE, JURUSAN_LIST } from '../data/jurusan';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <Link to="/" className="whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-red-700 rounded">
            <SchoolLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#profil" className="hover:text-red-700 transition-colors whitespace-nowrap shrink-0">
              Profil Sekolah
            </a>
            <a href="#jurusan" className="hover:text-red-700 transition-colors whitespace-nowrap shrink-0">
              Program Keahlian
            </a>
            <a href="#absensi" className="hover:text-red-700 transition-colors whitespace-nowrap shrink-0">
              Sistem Absensi
            </a>
            <a href="#kontak" className="hover:text-red-700 transition-colors whitespace-nowrap shrink-0">
              Kontak
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition-colors whitespace-nowrap shrink-0"
            >
              Masuk Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section: 2-Column Balanced Split */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                <p className="text-xs font-semibold tracking-wide text-red-700">
                  SMK Prima Unggul · Pendidikan Vokasi &amp; Kedisiplinan Digital
                </p>

                <h1 className="text-[clamp(2.25rem,4vw,3.4rem)] font-extrabold leading-[1.12] tracking-tight text-slate-900 text-balance">
                  Mencetak Lulusan Vokasi Kompeten, Disiplin, dan Siap Kerja.
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-slate-600">
                  SMK Prima Unggul menyelenggarakan pendidikan kejuruan berbasis standar industri melalui{' '}
                  <strong className="font-semibold text-slate-900">3 Bidang Keahlian Utama</strong> yang mencakup enam
                  kompetensi unggulan: <strong className="font-semibold text-slate-900">TKJ, DKV, AK, BC, MPLB, dan BD</strong>,
                  didukung sistem presensi siswa dan karyawan terintegrasi.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-6 py-3 text-sm font-semibold text-white hover:bg-red-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    Masuk Sistem Absensi
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#jurusan"
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-neutral-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    Jelajahi 6 Jurusan
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] w-full overflow-hidden rounded-xl border border-neutral-200 bg-slate-100">
                  <img
                    src={HERO_CAMPUS_IMAGE}
                    alt="Gedung Kampus SMK Prima Unggul"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent p-6">
                    <p className="text-sm font-semibold text-white">Kampus Terpadu SMK Prima Unggul</p>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Lingkungan belajar modern dengan laboratorium keahlian berstandar industri
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width 4-column proof strip below hero split */}
            <div className="mt-12 grid grid-cols-2 gap-6 border-t border-neutral-200 pt-8 lg:grid-cols-4">
              <div>
                <p className="font-mono text-2xl font-bold text-red-700 tabular-nums">3 Bidang</p>
                <p className="mt-1 text-sm text-slate-600">Klaster Keahlian Terpadu</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">6 Jurusan</p>
                <p className="mt-1 text-sm text-slate-600">TKJ · DKV · AK · BC · MPLB · BD</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">Akreditasi A</p>
                <p className="mt-1 text-sm text-slate-600">Standar Mutu Pendidikan Nasional</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">Real-Time</p>
                <p className="mt-1 text-sm text-slate-600">Presensi Siswa &amp; Karyawan</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 01: Profil Sekolah */}
        <section id="profil" className="border-b border-neutral-200 bg-neutral-50 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5 space-y-4">
                <p className="text-xs font-semibold text-red-700">01. Profil SMK Prima Unggul</p>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-balance">
                  Sekolah Kejuruan Modern dengan Budaya Kerja Profesional
                </h2>
                <p className="text-base leading-relaxed text-slate-600">
                  SMK Prima Unggul hadir untuk menjembatani kurikulum pendidikan menengah kejuruan dengan kebutuhan
                  nyata dunia usaha dan dunia industri (DUDI). Setiap siswa dilatih tidak hanya pada penguasaan teknis,
                  tetapi juga ketepatan waktu dan etos kerja sejak hari pertama.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3">
                  <Building2 className="h-5 w-5 text-red-700" />
                  <h3 className="text-lg font-bold text-slate-900">Visi Pendidikan</h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Menjadi lembaga pendidikan vokasi terkemuka yang menghasilkan lulusan berkarakter disiplin,
                    inovatif, kompeten secara teknis, dan adaptif terhadap transformasi industri digital.
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3">
                  <BookOpen className="h-5 w-5 text-red-700" />
                  <h3 className="text-lg font-bold text-slate-900">Misi Pembinaan</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
                      <span>Pembelajaran praktik berbasis proyek dan sertifikasi kompetensi.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
                      <span>Penegakan kedisiplinan harian melalui pencatatan presensi digital.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 02: 3 Bidang Keahlian & 6 Kompetensi Keahlian */}
        <section id="jurusan" className="border-b border-neutral-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-6 space-y-12">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold text-red-700">02. Bidang &amp; Program Keahlian</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-balance">
                3 Bidang Keahlian Utama &amp; 6 Kompetensi Unggulan
              </h2>
              <p className="text-base text-slate-600">
                Kurikulum terstruktur dalam tiga rumpun bidang keahlian yang membawahi enam jurusan: TKJ, DKV, BC, AK,
                MPLB, dan BD. Klik jurusan untuk melihat rincian kompetensi.
              </p>
            </div>

            {/* 3 Bidang Keahlian Showcase Cards */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {BIDANG_KEAHLIAN_LIST.map((bidang) => (
                <article
                  key={bidang.nomor}
                  className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-200">
                    <img
                      src={bidang.image}
                      alt={bidang.nama}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6 space-y-5">
                    <div className="space-y-2">
                      <p className="font-mono text-xs font-semibold text-red-700">Bidang {bidang.nomor}</p>
                      <h3 className="text-xl font-bold text-slate-900">{bidang.nama}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{bidang.deskripsi}</p>
                    </div>

                    <div className="space-y-2 border-t border-neutral-200 pt-4">
                      <p className="text-xs font-semibold text-slate-500">Kompetensi Keahlian:</p>
                      <div className="flex flex-wrap gap-2">
                        {bidang.jurusan.map((kode) => {
                          const detail = JURUSAN_LIST.find((j) => j.kode === kode);
                          if (!detail) return null;
                          return (
                            <Link
                              key={kode}
                              to={`/jurusan/${detail.slug}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-red-700 hover:text-red-700 transition-colors whitespace-nowrap shrink-0"
                            >
                              <span>{detail.kode}</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* 6 Jurusan Direct Directory */}
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
              {JURUSAN_LIST.map((item) => (
                <Link
                  key={item.kode}
                  to={`/jurusan/${item.slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 hover:border-red-700 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono font-semibold text-red-700">{item.kode}</span>
                      <span>{item.bidang}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                      {item.nama}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.ringkasan}</p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                    <span>Detail Program</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section 03: Sistem Absensi Terpadu */}
        <section id="absensi" className="border-b border-neutral-200 bg-neutral-50 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-6 space-y-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold text-red-700">03. Portal Presensi Sekolah</p>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-balance">
                  Satu Sistem Terintegrasi untuk Siswa, Guru, dan Tenaga Kependidikan
                </h2>
                <p className="text-base text-slate-600">
                  Dibangun di atas arsitektur autentikasi dan basis data Supabase dengan kontrol akses berbasis peran.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
              >
                Buka Aplikasi Absensi
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3">
                <ShieldCheck className="h-5 w-5 text-red-700" />
                <h3 className="text-lg font-bold text-slate-900">Administrator</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Mengelola akun pengguna tersinkronisasi penuh dengan Supabase Auth, mengelola data induk siswa (NIS,
                  Nama, Kelas), melakukan presensi mandiri, serta memantau rekap kehadiran karyawan dan siswa.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3">
                <Users className="h-5 w-5 text-red-700" />
                <h3 className="text-lg font-bold text-slate-900">Guru Pengajar</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Melakukan absensi karyawan mandiri setiap hari kerja, mencatat kehadiran siswa per kelas secara
                  langsung, serta meninjau dan mengekspor rekapitulasi absensi siswa.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3">
                <CheckCircle2 className="h-5 w-5 text-red-700" />
                <h3 className="text-lg font-bold text-slate-900">Tenaga Kependidikan</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  Mengakses dashboard ringkasan kehadiran pribadi dan mencatat absensi masuk, pulang, maupun pengajuan
                  izin atau sakit secara mandiri dan real-time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer id="kontak" className="bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5 space-y-3">
              <SchoolLogo light />
              <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                Sekolah Menengah Kejuruan dengan tiga bidang keahlian utama: Teknologi Informasi, Seni Kreatif &amp;
                Komunikasi, serta Bisnis, Manajemen &amp; Keuangan.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5 text-sm">
              <p className="font-semibold text-white">Kompetensi Keahlian</p>
              <div className="grid grid-cols-2 gap-1.5 text-slate-400">
                {JURUSAN_LIST.map((j) => (
                  <Link key={j.kode} to={`/jurusan/${j.slug}`} className="hover:text-white transition-colors">
                    {j.kode}
                  </Link>
                ))}
              </div>
            </div>

            <div className="md:col-span-4 space-y-2.5 text-sm">
              <p className="font-semibold text-white">Kontak Sekolah</p>
              <div className="space-y-2 text-slate-400">
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Jl. Pendidikan Vokasi No. 88, Kota Tangerang, Banten</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="font-mono text-xs">(021) 5578-9012</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-500 shrink-0" />
                  <span>info@smkprimaunggul.sch.id</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} SMK Prima Unggul. Hak Cipta Dilindungi.</p>
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors font-medium">
              Masuk Portal Absensi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
