import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Briefcase, Wrench } from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';
import { JURUSAN_DETAILS, JURUSAN_LIST } from '../data/jurusan';

export default function JurusanDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const key = (slug || '').toLowerCase();
  const detail = JURUSAN_DETAILS[key];

  if (!detail) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Program Keahlian Tidak Ditemukan</h1>
        <p className="text-sm text-slate-600">Kode jurusan yang Anda cari tidak tersedia di SMK Prima Unggul.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-slate-900 flex flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <Link to="/" className="whitespace-nowrap shrink-0">
            <SchoolLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {JURUSAN_LIST.map((j) => (
              <Link
                key={j.kode}
                to={`/jurusan/${j.slug}`}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  j.slug === detail.slug ? 'text-red-700 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                {j.kode}
              </Link>
            ))}
          </nav>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 transition-colors whitespace-nowrap shrink-0"
          >
            Masuk Portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-12 space-y-12">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Profil Sekolah
          </Link>
        </div>

        <section className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-6 space-y-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
              <span className="font-mono">{detail.kode}</span>
              <span aria-hidden="true">·</span>
              <span>{detail.bidang}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 text-balance">
              {detail.nama}
            </h1>
            <p className="text-base leading-relaxed text-slate-600">{detail.deskripsi}</p>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Wrench className="h-4 w-4 text-red-700" />
                <span>Fasilitas Praktik</span>
              </div>
              <p className="text-sm text-slate-600">{detail.fasilitasLab}</p>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-72 sm:h-96 lg:h-full overflow-hidden rounded-xl border border-neutral-200 bg-slate-200">
              <img
                src={detail.image}
                alt={detail.nama}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Kompetensi Keahlian Inti</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {detail.kompetensiInti.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-red-700" />
              <h2 className="text-lg font-bold text-slate-900">Prospek Karier Lulusan</h2>
            </div>
            <ul className="space-y-3 text-sm text-slate-700">
              {detail.prospekKarier.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-700 shrink-0 mt-2" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
