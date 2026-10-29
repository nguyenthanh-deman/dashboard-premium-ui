// Mẫu tiêu đề trang premium — breadcrumb nhỏ + tiêu đề lớn chữ mảnh. Thuần trình bày.
// heading thay chữ lớn, vd <>Tháng 10 <span className="text-muted">2026</span></>.
export default function PageHeader({ section = "Quản trị", title, subtitle, count, heading }: { section?: string; title: string; subtitle?: string; count?: number; heading?: React.ReactNode }) {
  return (
    <header className="mb-7">
      <div className="flex items-center gap-2 text-[13px] text-ink-2">
        <span className="grid grid-cols-2 gap-[2px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => <span key={i} className="h-[5px] w-[5px] rounded-[1.5px] border border-current opacity-70" />)}
        </span>
        <span className="text-muted">{section}</span>
        <span className="text-muted/60">/</span>
        <span>{title}</span>
      </div>
      <h1 className="mt-4 flex items-center gap-3 text-[32px] font-normal leading-none tracking-[-0.025em] text-ink">
        {heading ?? title}
        {count !== undefined && count > 0 && (
          <span className="rounded-full border border-line bg-white/[0.04] px-2.5 py-1 font-mono text-[12px] font-medium text-ink-2">{count}</span>
        )}
      </h1>
      {subtitle && <p className="mt-2.5 text-[14px] text-muted">{subtitle}</p>}
    </header>
  );
}
