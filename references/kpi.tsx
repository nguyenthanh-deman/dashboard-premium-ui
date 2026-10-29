// Mẫu khối trình bày cho trang tổng quan premium. Thuần trình bày (dùng được trong server component).
// Cần tokens.css (.admin-card, .admin-nav-active, .admin-cc, --viz-*).

// Thẻ KPI: nhãn chữ thường → số lớn tabular → dòng phụ mono với delta màu.
// wide = rộng 2 cột, chừa chỗ bên phải cho đồ trang trí (children, vd <CardArt />).
export function Kpi({ label, value, sub, trend, wide, children }: { label: string; value: string; sub?: string; trend?: number | null; wide?: boolean; children?: React.ReactNode }) {
  const hasTrend = trend !== undefined && trend !== null;
  return (
    <div className={`admin-card relative overflow-hidden rounded-[16px] border border-line p-5 ${wide ? "sm:col-span-2 sm:pr-[180px]" : ""}`}>
      <div className="text-[13px] text-ink-2">{label}</div>
      <div className="mt-2.5 text-[30px] font-medium leading-none tracking-[-0.025em] tabular-nums text-ink">{value}</div>
      <div className="mt-3 font-mono text-[11.5px] text-muted">
        {hasTrend ? (
          <>
            <span style={{ color: trend >= 0 ? "var(--viz-up)" : "#e5484d" }}>{trend >= 0 ? "+" : "−"}{Math.abs(trend)}% {trend >= 0 ? "↑" : "↓"}</span> {sub ?? "so với tháng trước"}
          </>
        ) : (
          sub ?? " "
        )}
      </div>
      {children}
    </div>
  );
}

// Hai thẻ ngân hàng 3D nghiêng (CSS thuần) — đặt làm children của <Kpi wide>.
export function CardArt({ mark = "BRAND", digits = "4821" }: { mark?: string; digits?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute right-4 top-1/2 hidden h-[96px] w-[150px] -translate-y-1/2 sm:block">
      <span className="admin-cc right-0 top-0 rotate-[-14deg] opacity-70" />
      <span className="admin-cc bottom-0 left-0 rotate-[-6deg]">
        <span className="absolute right-3 top-2.5 font-mono text-[7px] tracking-[0.2em] text-white/60">{mark}</span>
        <span className="absolute bottom-2.5 right-3 font-mono text-[8px] tracking-[0.12em] text-white/50">•••• {digits}</span>
      </span>
    </div>
  );
}

// Panel bọc biểu đồ: tiêu đề nhỏ, (tuỳ chọn) số lớn + dòng phụ mono, rồi nội dung.
export function Panel({ title, value, sub, className = "", children }: { title: string; value?: string; sub?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={`admin-card rounded-[16px] border border-line p-5 ${className}`}>
      <h2 className="text-[13px] text-ink-2">{title}</h2>
      {value && <div className="mt-2 text-[26px] font-medium leading-none tracking-[-0.025em] tabular-nums text-ink">{value}</div>}
      {sub && <div className="mt-2.5 font-mono text-[11.5px] text-muted">{sub}</div>}
      <div className={value || sub ? "mt-6" : "mt-4"}>{children}</div>
    </div>
  );
}

// Nút gộp liền khối (7/30/90 ngày…) — mỗi lựa chọn là một link/nút.
export function Segmented<T extends string | number>({ options, value, href, format = (v) => String(v) }: { options: readonly T[]; value: T; href: (v: T) => string; format?: (v: T) => string }) {
  return (
    <div className="inline-flex rounded-[10px] border border-line bg-white/[0.03] p-1">
      {options.map((o) => (
        <a key={String(o)} href={href(o)} className={`rounded-[7px] px-3 py-1.5 font-mono text-[12px] transition-colors ${o === value ? "admin-nav-active text-ink" : "text-muted hover:text-ink"}`}>
          {format(o)}
        </a>
      ))}
    </div>
  );
}

// Chỉ số nhỏ: số lớn + chấm màu phát sáng + nhãn mono.
export function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div>
      <div className="text-[26px] font-normal leading-none tracking-[-0.02em] tabular-nums text-ink">{value}</div>
      <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-muted">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        {label}
      </div>
    </div>
  );
}

// Cảnh báo vận hành: icon + nhãn (không dùng màu đơn độc), dòng phụ mono.
export function AlertCard({ tone, label, sub, href, icon }: { tone: "critical" | "warning" | "info"; label: string; sub: string; href: string; icon: React.ReactNode }) {
  const color = tone === "critical" ? "#e5484d" : tone === "warning" ? "var(--viz-1)" : "var(--viz-3)";
  return (
    <a href={href} className={`admin-card group flex items-start gap-3 rounded-[14px] border p-3.5 transition-colors ${tone === "critical" ? "border-[#e5484d]/60" : "border-line hover:border-white/15"}`}>
      <span className="mt-0.5 shrink-0" style={{ color }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className={`text-[13.5px] font-medium ${tone === "critical" ? "text-[#e5484d]" : "text-ink"}`}>{label}</div>
        <div className="mt-0.5 font-mono text-[11.5px] text-muted">{sub}</div>
      </div>
    </a>
  );
}
