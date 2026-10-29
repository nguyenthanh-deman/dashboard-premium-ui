"use client";

import { useEffect, useId, useState } from "react";
// Mẫu tham khảo — React + SVG thuần, không thư viện. Màu đọc từ token --viz-* trong tokens.css.
export type DayPoint = { date: string; value: number }; // date "YYYY-MM-DD"
export type FlowPoint = { date: string; inc: number; out: number };
export type RankRow = { label: string; value: number };

// Biểu đồ tự vẽ SVG — không thư viện. Phong cách premium tối: đường cong mượt (monotone,
// không vọt quá dữ liệu) + quầng sáng mờ bên dưới nét, lưới đứt nét rất mờ, nhãn trục mono.
// Màu chỉ mang danh tính series (token --viz-* trong .admin-premium); chữ luôn dùng token mực.
// Trạng thái (tốt/cảnh báo) đi kèm icon+nhãn, không màu đơn độc.
const W = 560, H = 170, PADL = 34, PADR = 8, PADT = 10, PADB = 20;
const px = (i: number, n: number) => PADL + (n <= 1 ? 0 : (i / (n - 1)) * (W - PADL - PADR));
const py = (v: number, max: number) => H - PADB - (max <= 0 ? 0 : (v / max) * (H - PADT - PADB));
const niceMax = (m: number) => { if (m <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(m))); const f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };
// Parse "YYYY-MM-DD" TRỰC TIẾP (không new Date) — tránh lệch múi giờ server(UTC)/client(VN)
// gây hydration mismatch.
const dLabel = (iso: string) => { const [, m, d] = iso.split("-"); return `${+d}/${+m}`; };
// Ngăn cách nghìn THỦ CÔNG (không toLocaleString) — locale ICU của Node server có thể khác
// trình duyệt → mismatch khi hydrate. Style dấu chấm giống vi-VN.
const fmtNum = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const fmtVnd = (n: number) => (n >= 1e9 ? (n / 1e9).toFixed(1) + " tỷ" : n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "tr" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n));
const fmtShort = (n: number) => (n >= 1e6 ? fmtVnd(n) : n >= 1e3 ? +(n / 1e3).toFixed(1) + "k" : String(Math.round(n)));

// Đường cong monotone (Fritsch–Carlson) — mượt nhưng không tạo đỉnh/đáy giả giữa 2 điểm.
function smooth(pts: [number, number][]) {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx: number[] = [], s: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; s[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1); }
  const t: number[] = [s[0]];
  for (let i = 1; i < n - 1; i++) t[i] = s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2;
  t[n - 1] = s[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (s[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / s[i], b = t[i + 1] / s[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * s[i]; t[i + 1] = k * b * s[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = dx[i] / 3;
    d += ` C${(x0 + h).toFixed(1)},${(y0 + t[i] * h).toFixed(1)} ${(x1 - h).toFixed(1)},${(y1 - t[i + 1] * h).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

// Nét có quầng sáng: bản mờ dày bên dưới + nét chính mảnh bên trên.
function GlowPath({ d, color, width = 2, opacity = 1 }: { d: string; color: string; width?: number; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={width * 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} style={{ filter: "blur(4px)" }} />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Grid({ max, fmt, y = (v: number) => py(v, max), steps = [0, 0.5, 1] }: { max: number; fmt: (n: number) => string; y?: (v: number) => number; steps?: number[] }) {
  return (
    <g>
      {steps.map((t) => (
        <g key={t}>
          <line x1={PADL} x2={W - PADR} y1={y(max * t)} y2={y(max * t)} stroke="rgb(255 255 255 / 0.06)" strokeWidth={1} strokeDasharray={t === 0 ? undefined : "2 4"} />
          <text x={PADL - 8} y={y(max * t) + 3} textAnchor="end" className="fill-muted font-mono" fontSize={9}>{fmt(max * t)}</text>
        </g>
      ))}
    </g>
  );
}

function XLabels({ data, y }: { data: { date: string }[]; y: number }) {
  const n = data.length;
  const ks = n <= 1 ? [0] : [0, Math.floor((n - 1) / 3), Math.floor((2 * (n - 1)) / 3), n - 1];
  return (
    <>
      {ks.map((k) => (
        <text key={k} x={px(k, n)} y={y} textAnchor={k === 0 ? "start" : k === n - 1 ? "end" : "middle"} className="fill-muted font-mono" fontSize={9}>{dLabel(data[k].date)}</text>
      ))}
    </>
  );
}

// Biểu đồ SVG là thành phần TƯƠNG TÁC (hover) — render sau khi mount ở client để khỏi
// lệch hydrate (trang admin có auth, không cần SSR chart cho SEO). Khung giữ chỗ đúng tỉ
// lệ để không giật layout.
function useMounted() {
  const [m, setM] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setM(true), []);
  return m;
}
const Skeleton = ({ h = H }: { h?: number }) => <div className="w-full animate-pulse rounded-[10px] bg-white/[0.03]" style={{ aspectRatio: `${W} / ${h}` }} />;

function useHover(n: number) {
  const [i, setI] = useState<number | null>(null);
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const idx = Math.round(((x - PADL) / (W - PADL - PADR)) * (n - 1));
    setI(Math.max(0, Math.min(n - 1, idx)));
  };
  return { i, onMove, onLeave: () => setI(null) };
}

function Tip({ show, left, children }: { show: boolean; left: number; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[9px] border border-white/10 bg-[#1c1c1e]/90 px-2.5 py-1.5 text-[11px] shadow-[0_8px_24px_rgb(0_0_0/0.5)] backdrop-blur"
      style={{ left: `${Math.min(0.88, Math.max(0.12, left)) * 100}%` }}
    >
      {children}
    </div>
  );
}

function Cursor({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return <line x1={x} x2={x} y1={y1} y2={y2} stroke="rgb(255 255 255 / 0.18)" strokeWidth={1} strokeDasharray="2 3" />;
}

// ── Doanh thu: vùng 1 series ──────────────────────────────────────────────
export function AreaChart({ data, unit, color = "var(--viz-1)" }: { data: DayPoint[]; unit: "vnd" | "num"; color?: string }) {
  const n = data.length;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const fmt = unit === "vnd" ? fmtVnd : fmtShort;
  const { i, onMove, onLeave } = useHover(n);
  const mounted = useMounted();
  const gid = "g" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (!mounted) return <Skeleton />;
  const line = smooth(data.map((d, k) => [px(k, n), py(d.value, max)]));
  const area = `${line} L${px(n - 1, n).toFixed(1)},${H - PADB} L${px(0, n).toFixed(1)},${H - PADB} Z`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Grid max={max} fmt={fmt} />
        <path d={area} fill={`url(#${gid})`} />
        <GlowPath d={line} color={color} />
        {i !== null && (
          <g>
            <Cursor x={px(i, n)} y1={PADT} y2={H - PADB} />
            <circle cx={px(i, n)} cy={py(data[i].value, max)} r={4} fill={color} stroke="#141415" strokeWidth={2} />
          </g>
        )}
        <XLabels data={data} y={H - 4} />
      </svg>
      <Tip show={i !== null} left={i !== null ? px(i, n) / W : 0}>
        <div className="font-mono text-muted">{i !== null && dLabel(data[i].date)}</div>
        <div className="font-semibold tabular-nums text-ink">{i !== null && (unit === "vnd" ? fmtNum(data[i].value) + "đ" : fmtNum(data[i].value))}</div>
      </Tip>
    </div>
  );
}

// ── User mới: cột dọc 1 series — xám trầm, cột đang trỏ sáng màu ─────────────
export function BarChart({ data, color = "var(--viz-3)" }: { data: DayPoint[]; color?: string }) {
  const n = data.length;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const { i, onMove, onLeave } = useHover(n);
  const mounted = useMounted();
  const bw = Math.max(2, ((W - PADL - PADR) / n) * 0.56);
  if (!mounted) return <Skeleton />;
  const peak = data.reduce((b, d, k) => (d.value > data[b].value ? k : b), 0);
  const hot = i ?? peak;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: "block", overflow: "visible" }}>
        <Grid max={max} fmt={fmtShort} />
        {data.map((d, k) => {
          const h = (H - PADB) - py(d.value, max);
          const on = k === hot && d.value > 0;
          return (
            <rect
              key={k}
              x={px(k, n) - bw / 2}
              y={py(d.value, max)}
              width={bw}
              height={Math.max(0, h)}
              rx={Math.min(bw / 2, 4)}
              fill={on ? color : "rgb(255 255 255 / 0.13)"}
              style={on ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
            >
              <title>{dLabel(d.date)}: {d.value}</title>
            </rect>
          );
        })}
        <XLabels data={data} y={H - 4} />
      </svg>
      <Tip show={i !== null} left={i !== null ? px(i, n) / W : 0}>
        <div className="font-mono text-muted">{i !== null && dLabel(data[i].date)}</div>
        <div className="font-semibold tabular-nums text-ink">{i !== null && fmtNum(data[i].value)}</div>
      </Tip>
    </div>
  );
}

// ── Dòng vào/ra: soi gương — vào phía trên (sáng), ra phía dưới (xám) ──
const FH = 230, MID = 14; // FH: cao khung; MID: dải nhãn ngày ở giữa
export function FlowChart({ data, inColor = "var(--viz-2)", labels = ["Vào", "Ra"] }: { data: FlowPoint[]; inColor?: string; labels?: [string, string] }) {
  const n = data.length;
  const max = niceMax(Math.max(...data.flatMap((d) => [d.inc, d.out]), 0));
  const { i, onMove, onLeave } = useHover(n);
  const mounted = useMounted();
  const gid = "g" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (!mounted) return <Skeleton h={FH} />;
  const half = (FH - PADT - 6 - MID) / 2;
  const base = PADT + half; // trục trên
  const base2 = base + MID; // trục dưới
  const up = (v: number) => base - (v / max) * half;
  const down = (v: number) => base2 + (v / max) * half;
  const lineIn = smooth(data.map((d, k) => [px(k, n), up(d.inc)]));
  const lineOut = smooth(data.map((d, k) => [px(k, n), down(d.out)]));
  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-4 text-[12px]">
        <span className="flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-full" style={{ background: inColor, boxShadow: `0 0 8px ${inColor}` }} /> {labels[0]}</span>
        <span className="flex items-center gap-1.5 text-ink-2"><span className="h-2 w-2 rounded-full bg-white/40" /> {labels[1]}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${FH}`} width="100%" role="img" onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={inColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={inColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Grid max={max} fmt={fmtShort} y={up} />
        <Grid max={max} fmt={fmtShort} y={down} steps={[0.5, 1]} />
        <line x1={PADL} x2={W - PADR} y1={base2} y2={base2} stroke="rgb(255 255 255 / 0.06)" />
        <path d={`${lineIn} L${px(n - 1, n)},${base} L${px(0, n)},${base} Z`} fill={`url(#${gid})`} />
        <GlowPath d={lineIn} color={inColor} />
        <path d={lineOut} fill="none" stroke="rgb(255 255 255 / 0.45)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {i !== null && (
          <g>
            <Cursor x={px(i, n)} y1={PADT} y2={FH - 6} />
            <circle cx={px(i, n)} cy={up(data[i].inc)} r={3.5} fill={inColor} stroke="#141415" strokeWidth={2} />
            <circle cx={px(i, n)} cy={down(data[i].out)} r={3.5} fill="#bdbdc2" stroke="#141415" strokeWidth={2} />
          </g>
        )}
        <XLabels data={data} y={base + MID / 2 + 3} />
      </svg>
      <Tip show={i !== null} left={i !== null ? px(i, n) / W : 0}>
        <div className="font-mono text-muted">{i !== null && dLabel(data[i].date)}</div>
        <div className="font-semibold tabular-nums" style={{ color: inColor }}>+{i !== null && fmtNum(data[i].inc)}</div>
        <div className="font-semibold tabular-nums text-ink-2">−{i !== null && fmtNum(data[i].out)}</div>
      </Tip>
    </div>
  );
}

// ── Xếp hạng: chấm màu + nhãn + vạch mảnh + số mono ───────────────────────
const DOTS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)", "var(--viz-5)"];
export function RankBars({ rows, unit = "num", empty }: { rows: RankRow[]; unit?: "num" | "vnd"; empty?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-[13px] text-muted">{empty ?? "Chưa có dữ liệu."}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const fmt = (v: number) => (unit === "vnd" ? fmtVnd(v) : fmtShort(v));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, k) => {
        const c = DOTS[k % DOTS.length];
        return (
          <div key={k}>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2" title={r.label}>{r.label}</span>
              <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted" title={unit === "vnd" ? fmtNum(r.value) + "đ" : fmtNum(r.value)}>{fmt(r.value)}</span>
            </div>
            <span className="relative mt-1.5 block h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: c, opacity: 0.75 }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
