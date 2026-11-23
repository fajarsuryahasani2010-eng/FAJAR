import { JurusanCode } from '../types';

export interface JurusanDetail {
  kode: JurusanCode;
  slug: string;
  nama: string;
  bidang: string;
  ringkasan: string;
  deskripsi: string;
  image: string;
  kompetensiInti: string[];
  prospekKarier: string[];
  fasilitasLab: string;
}

export interface BidangKeahlian {
  nomor: string;
  nama: string;
  deskripsi: string;
  image: string;
  jurusan: JurusanCode[];
}

export const HERO_CAMPUS_IMAGE = '/src/assets/images/smk_prima_campus_1795396854608.jpg';

export const BIDANG_KEAHLIAN_LIST: BidangKeahlian[] = [
  {
    nomor: '01',
    nama: 'Bidang Teknologi Informasi',
    deskripsi:
      'Mempersiapkan teknisi infrastruktur jaringan, administrator server, dan spesialis keamanan siber berstandar industri telekomunikasi modern.',
    image: '/src/assets/images/jurusan_tkj_lab_1795396832589.jpg',
    jurusan: ['TKJ'],
  },
  {
    nomor: '02',
    nama: 'Bidang Seni Kreatif & Komunikasi',
    deskripsi:
      'Mengembangkan talenta desain visual komersial, produksi konten penyiaran, sinematografi, serta manajemen media multi-platform.',
    image: '/src/assets/images/jurusan_dkv_broadcast_1795396833440.jpg',
    jurusan: ['DKV', 'BC'],
  },
  {
    nomor: '03',
    nama: 'Bidang Bisnis, Manajemen & Keuangan',
    deskripsi:
      'Mencetak profesional akuntansi perusahaan, tata kelola perkantoran modern, serta pelaku pemasaran dan bisnis niaga digital.',
    image: '/src/assets/images/jurusan_bisnis_office_1795396833274.jpg',
    jurusan: ['AK', 'MPLB', 'BD'],
  },
];

export const JURUSAN_DETAILS: Record<string, JurusanDetail> = {
  tkj: {
    kode: 'TKJ',
    slug: 'tkj',
    nama: 'Teknik Komputer dan Jaringan',
    bidang: 'Bidang Teknologi Informasi',
    ringkasan: 'Infrastruktur jaringan fiber optik, administrasi server Linux/Windows, cloud, dan keamanan jaringan.',
    deskripsi:
      'Program keahlian TKJ di SMK Prima Unggul membekali siswa dengan keterampilan merancang, menginstalasi, mengonfigurasi, dan memelihara infrastruktur jaringan komputer skala lokal maupun luas, termasuk manajemen server dan mikrotik.',
    image: '/src/assets/images/jurusan_tkj_lab_1795396832589.jpg',
    kompetensiInti: [
      'Instalasi & Troubleshooting Jaringan Fiber Optik (FTTH)',
      'Konfigurasi Routing & Switching (MikroTik & Cisco)',
      'Administrasi Sistem Server & Virtualisasi Cloud',
      'Keamanan Jaringan & Monitoring Infrastruktur',
    ],
    prospekKarier: [
      'Network Administrator',
      'IT Infrastructure Support',
      'Fiber Optic Technician',
      'System & Cloud Junior Engineer',
    ],
    fasilitasLab: 'Laboratorium Jaringan Terpadu dengan 36 workstation, rak server aktif, dan perangkat MikroTik/Cisco.',
  },
  dkv: {
    kode: 'DKV',
    slug: 'dkv',
    nama: 'Desain Komunikasi Visual',
    bidang: 'Bidang Seni Kreatif & Komunikasi',
    ringkasan: 'Identitas merek, desain antarmuka digital, ilustrasi komersial, fotografi, dan tipografi.',
    deskripsi:
      'Program keahlian DKV melatih ketajaman visual dan pemecahan masalah komunikasi melalui media grafis cetak maupun digital, mulai dari perancangan identitas visual, tata letak editorial, hingga desain UI/UX.',
    image: '/src/assets/images/jurusan_dkv_broadcast_1795396833440.jpg',
    kompetensiInti: [
      'Perancangan Identitas Merek (Branding) & Tipografi',
      'Ilustrasi Digital & Pengolahan Grafis Vektor/Raster',
      'Desain Antarmuka Web & Aplikasi (UI/UX)',
      'Fotografi Komersial & Produksi Media Cetak',
    ],
    prospekKarier: [
      'Graphic Designer',
      'UI/UX Designer',
      'Brand & Visual Strategist',
      'Creative Illustrator',
    ],
    fasilitasLab: 'Studio Desain Grafis dengan pen display workstation terkalibrasi warna dan studio foto komersial.',
  },
  bc: {
    kode: 'BC',
    slug: 'bc',
    nama: 'Broadcasting dan Perfilman',
    bidang: 'Bidang Seni Kreatif & Komunikasi',
    ringkasan: 'Produksi program televisi, sinematografi, tata kamera, penyuntingan video, dan tata suara.',
    deskripsi:
      'Program keahlian Broadcasting dan Perfilman berfokus pada proses produksi audio-visual profesional dari pra-produksi penulisan naskah, pengambilan gambar multi-kamera, pencahayaan studio, hingga pasca-produksi.',
    image: '/src/assets/images/jurusan_dkv_broadcast_1795396833440.jpg',
    kompetensiInti: [
      'Penulisan Naskah & Penyutradaraan Program',
      'Sinematografi, Tata Kamera & Pencahayaan Studio',
      'Penyuntingan Video Non-Linear & Color Grading',
      'Tata Suara & Manajemen Siaran Langsung',
    ],
    prospekKarier: [
      'Camera Person & Videographer',
      'Video Editor & Colorist',
      'Broadcast Production Assistant',
      'Content Producer',
    ],
    fasilitasLab: 'Studio Siaran Kedap Suara lengkap dengan kamera sinema, switcher live streaming, dan ruang editing.',
  },
  ak: {
    kode: 'AK',
    slug: 'ak',
    nama: 'Akuntansi dan Keuangan Lembaga',
    bidang: 'Bidang Bisnis, Manajemen & Keuangan',
    ringkasan: 'Pembukuan keuangan perusahaan, perpajakan, akuntansi berbasis komputer, dan audit dasar.',
    deskripsi:
      'Program keahlian AK mempersiapkan tenaga ahli madya di bidang keuangan yang teliti dalam menyusun siklus akuntansi perusahaan jasa, dagang, dan manufaktur, termasuk pelaporan pajak dan aplikasi akuntansi modern.',
    image: '/src/assets/images/jurusan_bisnis_office_1795396833274.jpg',
    kompetensiInti: [
      'Siklus Akuntansi Perusahaan Jasa, Dagang & Manufaktur',
      'Aplikasi Komputer Akuntansi (MYOB / Accurate)',
      'Administrasi Perpajakan & Pelaporan SPT',
      'Akuntansi Keuangan Lembaga Pemerintah & Perbankan',
    ],
    prospekKarier: [
      'Staf Akuntansi & Keuangan',
      'Asisten Konsultan Pajak',
      'Teller & Layanan Perbankan',
      'Admin Pembukuan & Payroll',
    ],
    fasilitasLab: 'Laboratorium Komputer Akuntansi dan Bank Mini Sekolah sebagai simulasi transaksi riil.',
  },
  mplb: {
    kode: 'MPLB',
    slug: 'mplb',
    nama: 'Manajemen Perkantoran dan Layanan Bisnis',
    bidang: 'Bidang Bisnis, Manajemen & Keuangan',
    ringkasan: 'Korespondensi bisnis, kearsipan digital, administrasi kepegawaian, dan layanan pelanggan.',
    deskripsi:
      'Program keahlian MPLB membekali siswa dengan kompetensi tata kelola administrasi perkantoran modern berbasis digital, pengelolaan dokumen elektronik, keprotokolan, serta layanan bisnis korporat.',
    image: '/src/assets/images/jurusan_bisnis_office_1795396833274.jpg',
    kompetensiInti: [
      'Tata Kelola Administrasi Perkantoran Digital',
      'Manajemen Kearsipan Elektronik & Korespondensi',
      'Layanan Pelanggan & Hubungan Masyarakat',
      'Pengelolaan Rapat, Agenda Pimpinan & Acara Korporat',
    ],
    prospekKarier: [
      'Office Administrator',
      'Executive Secretary Assistant',
      'Human Resources Admin',
      'Customer Service Specialist',
    ],
    fasilitasLab: 'Ruang Simulasi Perkantoran Modern dengan perangkat otomasi kantor dan resepsionis terpadu.',
  },
  bd: {
    kode: 'BD',
    slug: 'bd',
    nama: 'Bisnis Digital',
    bidang: 'Bidang Bisnis, Manajemen & Keuangan',
    ringkasan: 'Pemasaran digital, pengelolaan e-commerce, analisis pasar, dan kewirausahaan ritel modern.',
    deskripsi:
      'Program keahlian Bisnis Digital memadukan fondasi manajemen bisnis ritel dengan strategi pemasaran digital, pengelolaan toko daring, optimasi kampanye media sosial, dan analitik penjualan.',
    image: '/src/assets/images/jurusan_bisnis_office_1795396833274.jpg',
    kompetensiInti: [
      'Strategi Pemasaran Digital & Media Sosial',
      'Manajemen Operasional E-Commerce & Marketplace',
      'Copywriting, Konten Promosi & Foto Produk',
      'Analisis Performa Penjualan & Kewirausahaan',
    ],
    prospekKarier: [
      'Digital Marketing Specialist',
      'E-Commerce Store Manager',
      'Social Media Strategist',
      'Wirausaha Bisnis Ritel Digital',
    ],
    fasilitasLab: 'Laboratorium Bisnis Digital & Ritel Modern dilengkapi studio foto produk dan dashboard analitik.',
  },
};

export const JURUSAN_LIST: JurusanDetail[] = [
  JURUSAN_DETAILS.tkj,
  JURUSAN_DETAILS.dkv,
  JURUSAN_DETAILS.bc,
  JURUSAN_DETAILS.ak,
  JURUSAN_DETAILS.mplb,
  JURUSAN_DETAILS.bd,
];
