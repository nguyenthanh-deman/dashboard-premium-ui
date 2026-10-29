"use client";
// Mẫu vỏ dashboard premium — Next.js (Link, usePathname) + @phosphor-icons/react.
// Đổi Link/usePathname/icon cho khớp dự án. Giữ nguyên logic sẵn có (phân quyền, đếm badge).
// Cần tokens.css (class .admin-premium, .admin-nav-active, .admin-kbd) và class .no-scrollbar.

import { useEffect, useRef, useState, type ReactNode, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X, SidebarSimple, MagnifyingGlass } from "@phosphor-icons/react";

export type NavItem = {
  group: string; // nhãn nhóm, vd "Điều hướng", "Vận hành"
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; weight?: "fill" | "regular"; className?: string }>;
  exact?: boolean;
  badge?: number; // số cần chú ý → hiện mono + chấm đỏ
  dot?: string; // màu chấm thay icon khi sidebar mở rộng, vd "var(--viz-1)"
};

const KEY = "dash-sidebar-collapsed";

export default function PremiumShell({ brand, nav: allNav, footer, children }: { brand: ReactNode; nav: NavItem[]; footer?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const nav = allNav.filter((i) => !q || i.label.toLowerCase().includes(q));
  const groups = [...new Set(nav.map((i) => i.group))];
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Đọc lựa chọn thu gọn SAU hydrate (localStorage chỉ có ở client).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(KEY) === "1") setCollapsed(true);
  }, []);
  const toggle = () => setCollapsed((c) => (localStorage.setItem(KEY, c ? "0" : "1"), !c));

  // ⌘K / Ctrl+K → vào ô tìm mục.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCollapsed(false);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const close = () => (setOpen(false), setQuery(""));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-2.5 pb-3 pt-5 ${collapsed ? "justify-center px-2" : "px-5"}`}>
        {!collapsed && <div className="min-w-0 flex-1">{brand}</div>}
        <button onClick={toggle} aria-label="Thu gọn sidebar" className="hidden rounded-[7px] p-1.5 text-muted hover:bg-white/5 hover:text-ink lg:grid lg:place-items-center">
          <SidebarSimple size={17} />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4 pt-2">
          <label className="flex items-center gap-2 rounded-[10px] border border-line bg-white/[0.03] px-3 py-2 focus-within:border-white/20">
            <MagnifyingGlass size={15} className="shrink-0 text-muted" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
              placeholder="Tìm mục"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-muted focus:outline-none"
            />
            <span className="flex gap-1"><kbd className="admin-kbd">⌘</kbd><kbd className="admin-kbd">K</kbd></span>
          </label>
        </div>
      )}

      <nav className="no-scrollbar flex-1 overflow-y-auto border-t border-line">
        {groups.map((g, gi) => (
          <div key={g} className={`px-3 py-4 ${gi > 0 ? "border-t border-line" : ""}`}>
            {!collapsed && <div className="mb-2 px-2.5 font-mono text-[11px] text-muted">{g}</div>}
            <div className="space-y-0.5">
              {nav.filter((i) => i.group === g).map((item) => {
                const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 rounded-[9px] px-2.5 py-[7px] text-[14px] transition-colors ${collapsed ? "justify-center" : ""} ${active ? "admin-nav-active text-ink" : "text-ink-2 hover:bg-white/[0.04] hover:text-ink"}`}
                  >
                    {item.dot && !collapsed ? (
                      <span className="grid h-[17px] w-[17px] place-items-center">
                        <span className="h-2 w-2 rounded-full" style={{ background: item.dot, boxShadow: `0 0 8px ${item.dot}` }} />
                      </span>
                    ) : (
                      <Icon size={17} weight={active ? "fill" : "regular"} className={active ? "text-ink" : "text-muted"} />
                    )}
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!!item.badge &&
                      (collapsed ? (
                        <span className="absolute right-1.5 top-1.5 h-[6px] w-[6px] rounded-full bg-red-500" />
                      ) : (
                        <span className="flex items-center gap-1.5 font-mono text-[12px] tabular-nums text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          {item.badge}
                        </span>
                      ))}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {nav.length === 0 && <p className="px-5 py-4 text-[13px] text-muted">Không có mục nào khớp.</p>}
      </nav>

      {footer && <div className="border-t border-line p-3">{footer}</div>}
    </div>
  );

  return (
    <div className="admin-premium min-h-screen" style={{ ["--sb-w" as string]: collapsed ? "72px" : "256px" }}>
      {/* Thanh trên — mobile */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Mở menu" className="grid h-9 w-9 place-items-center rounded-[9px] border border-line text-ink-2"><List size={18} /></button>
        {brand}
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-line bg-[#0f0f10] transition-[width] duration-200 lg:block" style={{ width: "var(--sb-w)" }}>
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-[256px] border-r border-line bg-[#0f0f10]">
            <button onClick={() => setOpen(false)} aria-label="Đóng menu" className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-[8px] text-muted hover:bg-white/5"><X size={16} /></button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Nội dung — ánh sáng mờ phía trên tạo chiều sâu */}
      <main className="relative transition-[padding] duration-200 lg:pl-[var(--sb-w)]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgb(255_255_255/0.045),transparent)]" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-7 lg:px-10 lg:py-9">{children}</div>
      </main>
    </div>
  );
}
