# dashboard-premium-ui

Skill cho Claude Code: biến một dashboard/admin đang có thành giao diện **premium tối trung tính**: nền gần đen, viền mảnh, icon nét thay emoji, chấm màu phát sáng, số mono, biểu đồ đường cong có quầng sáng, biểu đồ soi gương, sidebar có ô tìm + ⌘K, thẻ KPI kiểu kính tối.

Áp bằng cách ghi đè token màu trong một lớp bọc (`.admin-premium`), nên mọi trang con tự đổi theo mà không phải sửa từng trang.

## Cài

```bash
git clone <url-repo-này> ~/.claude/skills/dashboard-premium-ui
```

Sau đó trong Claude Code nói: *"biến dashboard admin thành premium UI"* (có thể kèm video/ảnh mẫu).

## Bên trong

| File | Nội dung |
|---|---|
| `SKILL.md` | Quy trình (xem mẫu → dò code → ghi đè token → dựng lại mảnh → kiểm tra), 12 luật "AI-slop → premium", các bẫy đã gặp |
| `references/tokens.css` | Token tối + class `.admin-card`, `.admin-nav-active`, `.admin-kbd`, `.admin-cc` (thẻ ngân hàng 3D) |
| `references/shell.tsx` | Vỏ sidebar: tìm mục + ⌘K, nhóm menu, chấm màu, badge mono, thu gọn, drawer mobile |
| `references/header.tsx` | Tiêu đề trang: breadcrumb + tiêu đề lớn chữ mảnh |
| `references/kpi.tsx` | `Kpi`, `CardArt`, `Panel`, `Segmented`, `Stat`, `AlertCard` |
| `references/charts.tsx` | Biểu đồ SVG không thư viện: `AreaChart`, `BarChart`, `FlowChart` (soi gương), `RankBars`, đường cong monotone |

Mẫu code viết cho React 19 / Next.js + Tailwind v4 + `@phosphor-icons/react`. Với stack khác thì đổi tên token và icon cho khớp.
