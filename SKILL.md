---
name: dashboard-premium-ui
description: Biến một dashboard/admin/trang quản trị đang có (React/Next, Tailwind hoặc CSS biến) thành giao diện "premium" tối trung tính kiểu Linear/Vercel — nền gần đen, viền mảnh, icon nét thay emoji, chấm màu phát sáng, số mono, biểu đồ đường cong có quầng sáng, biểu đồ soi gương, sidebar có ô tìm + ⌘K, thẻ KPI kiểu kính tối kèm thẻ ngân hàng 3D. Áp bằng cách ghi đè token trong một lớp bọc nên MỌI trang con tự đổi theo, không sửa từng trang. LUÔN dùng khi người dùng nói "biến dashboard thành premium UI", "làm admin đẹp/sang như video này", "premium dashboard", "dark dashboard kiểu Linear/Vercel", "bỏ giao diện tím neon kiểu AI", "redesign trang quản trị", hoặc đưa video/ảnh mẫu dashboard và muốn áp vào code của họ.
---

# dashboard-premium-ui — nâng dashboard lên giao diện premium tối

Skill rút ra từ một lần làm thật: dashboard admin Next.js 16 + Tailwind v4 + biểu đồ SVG tự vẽ, theo video mẫu "vibe-coded → premium" (dashboard tím neon, emoji, nhãn VIẾT HOA được sửa thành bản tối trung tính tinh tế). Kết quả: đổi 6 file, cả khu admin đổi giao diện, typecheck + lint sạch.

## Quy trình

### 0. Nếu có video/ảnh mẫu — xem bằng khung hình, không đoán

```bash
# Bảng ghép ~12 khung hình (1 ảnh = rẻ hơn 12 ảnh lẻ)
ffmpeg -v error -y -i "<video>" -vf "fps=12/<giây>,scale=480:-1,tile=4x3" -frames:v 1 sheet.png
# Khung cuối ở độ phân giải gốc — thường là "bản đẹp" cuối cùng
ffmpeg -v error -y -sseof -0.3 -i "<video>" -frames:v 1 final.png
```

Đọc `sheet.png` để hiểu quá trình biến đổi, `final.png` để lấy chi tiết (khoảng cách, cỡ chữ, màu). Ghi lại bảng "trước → sau" giống mục **12 luật** bên dưới.

### 1. Dò code trước khi sửa

- Vỏ dashboard (layout + sidebar), component tiêu đề trang dùng chung, trang tổng quan, component biểu đồ.
- Cách style: Tailwind v4 (`@theme` trong CSS) / v3 (`tailwind.config`) / CSS biến / CSS module. Tìm token màu (`--color-surface`, `--color-ink`, `--color-line`…).
- Màu cứng sẽ vỡ trên nền tối: `grep -rnoE "bg-white|bg-black|text-black|bg-\[#|text-\[#|createPortal"` trong thư mục admin. Modal render qua portal ra `<body>` sẽ **thoát** khỏi lớp bọc token → cần bọc riêng hoặc gắn class lên portal root.
- Luật toàn cục có thể đè style (ví dụ một rule `[class*="rounded-["] { border-radius: … !important }`) — biết trước để khỏi ngạc nhiên.

### 2. Ghi đè token trong một lớp bọc

Thêm khối trong `references/tokens.css` vào CSS toàn cục, rồi đặt `className="admin-premium"` lên phần tử gốc của vỏ dashboard. Vì utility Tailwind v4 đọc `var(--color-*)`, ghi đè trong cây con là đủ — mọi `bg-surface`, `text-ink`, `border-line` của các trang con tự tối theo. Với Tailwind v3/CSS khác: map tên token tương ứng.

Dashboard **luôn tối** (không theo nút sáng/tối của site) — nói rõ điều này với người dùng.

### 3. Dựng lại các mảnh (mẫu code trong `references/`)

| Mảnh | File mẫu | Điểm chính |
|---|---|---|
| Sidebar | `references/shell.tsx` | Logo + nút thu gọn; ô "Tìm mục" lọc menu + ⌘K/Ctrl+K; nhãn nhóm mono chữ thường; mục active kiểu kính (`.admin-nav-active`); nhóm 2 dùng chấm màu phát sáng thay icon; badge là số mono + chấm đỏ nhỏ, KHÔNG viên thuốc đỏ to |
| Tiêu đề trang | `references/header.tsx` | Breadcrumb nhỏ "Khu / Trang"; tiêu đề lớn chữ **mảnh** (font-normal, tracking âm); phần phụ (năm) màu mờ |
| KPI, Panel, Segmented, Stat | `references/kpi.tsx` | Nhãn chữ thường 13px; số 26–30px medium `tabular-nums`; dòng phụ mono 11.5px với delta xanh `+12% ↑`; thẻ đầu rộng gấp đôi kèm thẻ ngân hàng 3D CSS |
| Biểu đồ | `references/charts.tsx` | Đường cong monotone + quầng sáng; cột xám, chỉ cột đỉnh/đang trỏ sáng màu; biểu đồ soi gương (vào ở trên sáng, ra ở dưới xám); xếp hạng = chấm màu + vạch 3px + số mono |

### 4. Kiểm tra

1. Typecheck + lint các file đã đụng. Lint React mới bắt `Date.now()`/`new Date()` trong render (`react-hooks/purity`) → đưa vào hàm ngoài component.
2. Trang admin thường cần đăng nhập (OAuth) — **không tự đăng nhập bằng tài khoản thật**. Dựng route xem thử tạm (`app/zz-preview/page.tsx`) bọc đúng vỏ + biểu đồ với dữ liệu giả, kiểm xong **xoá ngay**, rồi nhờ người dùng tự đăng nhập xem bản thật.
3. Khẳng định bằng DOM trước (`getBoundingClientRect`, `getComputedStyle`), chụp **một** ảnh ở 1440×900 cho câu hỏi "nhìn có đẹp không". Khung trình duyệt hẹp chụp ra ảnh lệch → đặt viewport desktop trước khi chụp.
4. Site có preloader/cookie banner/Lenis: chờ preloader, cuộn bằng `window.scrollTo`, từ chối cookie không cần thiết.

## 12 luật "AI-slop → premium" (rút từ video mẫu)

| Trước (slop) | Sau (premium) |
|---|---|
| Nền gradient tím/xanh neon | Nền gần đen trung tính `#0b0b0c`, thẻ `#141415` |
| Viền tím đậm, bóng màu | Viền `rgb(255 255 255 / .07)` + viền trên sáng hơn (inset) + bóng đen sâu |
| Emoji làm icon (🔥📈💳) | Một bộ icon nét đồng bộ, cỡ 16–17px, màu muted; chỉ mục active đậm |
| Nhãn VIẾT HOA giãn chữ | Chữ thường, 13px, màu ink-2; nhãn nhóm mono 11px |
| Badge viên thuốc màu chói | Số mono màu muted (+ chấm đỏ 6px nếu cần chú ý) |
| Mục active tô brand đặc | "Kính": gradient trắng 9%→5% + viền 1px trắng 6% + bóng |
| Tiêu đề đậm "Welcome back!" | Tiêu đề chữ mảnh, có ngữ cảnh ("Tháng 10 2026"), phần phụ mờ |
| Số đậm cùng font chữ | Số medium `tabular-nums`; dòng phụ mono nhỏ |
| `+12%!!` kèm emoji | `+12% ↑ so với tháng trước` — màu xanh chỉ ở con số |
| Cột tím gradient dày | Cột xám trắng 13%, chỉ cột nổi bật mang màu + drop-shadow |
| Một màu brand cho mọi thứ | Bảng 5 màu series sáng vừa (vàng, xanh lá, xanh dương, hồng, tím) chỉ để nhận diện |
| Hình minh hoạ phẳng | Đồ vật 3D tinh tế (thẻ ngân hàng CSS nghiêng, chip kim loại) |

## Bẫy đã gặp

- **ID gradient SVG**: `useId()` của React 19 trả về ký tự như `«r0»`/`_r_0_` — làm sạch trước khi dùng trong `url(#…)`: `"g" + useId().replace(/[^a-zA-Z0-9_-]/g, "")`.
- **Chữ trục biểu đồ tí hon**: SVG dùng `viewBox` co theo bề rộng — đặt biểu đồ trong cột ≥ 1/2 khung, đừng nhét vào cột 2/5.
- **Hydration**: định dạng số thủ công (không `toLocaleString` trong component client), parse ngày `YYYY-MM-DD` bằng split; vẽ biểu đồ tương tác sau khi mount, giữ khung đúng tỉ lệ để không giật.
- **Giờ trên server UTC**: tháng/năm hiển thị theo giờ địa phương → cộng offset rồi đọc `getUTC*`.
- **Đường cong vọt**: Catmull-Rom tạo đỉnh giả / xuống dưới 0. Dùng monotone (Fritsch–Carlson) như trong `charts.tsx`.
- **Quầng sáng**: vẽ bản sao nét dày ×4, opacity .18, `filter: blur(4px)` dưới nét chính — rẻ hơn `<filter>` SVG và không cần id.
- **Giữ nguyên logic**: chỉ đổi trình bày. Giữ phân quyền, đếm badge, comment giải thích sẵn có trong code.

## Bàn giao

Commit riêng một nhánh (`feat/<dashboard>-premium-ui`), nói rõ: đã kiểm trên bản xem thử dữ liệu giả hay bản thật; trang con nào chưa xem tận mắt (modal, bảng); dashboard luôn tối.
