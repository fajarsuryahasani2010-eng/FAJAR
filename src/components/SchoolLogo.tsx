export function SchoolLogo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md font-extrabold text-sm tracking-tight shrink-0 ${
          light ? 'bg-white text-red-700' : 'bg-red-700 text-white'
        }`}
        aria-hidden="true"
      >
        PU
      </span>
      <span
        className={`text-base font-bold tracking-tight ${
          light ? 'text-white' : 'text-slate-900'
        }`}
      >
        SMK Prima Unggul
      </span>
    </span>
  );
}
