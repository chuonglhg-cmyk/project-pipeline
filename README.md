# Project Pipeline – Quản lý Dự án / Khách hàng (MVP)

Ứng dụng web đơn giản để quản lý pipeline dự án/khách hàng từ lúc liên hệ
lần đầu đến khi ký hợp đồng.

---

## 1. Phân tích yêu cầu (ngắn gọn)

- **Đối tượng chính**: `Project` (dự án/khách hàng), mỗi project có nhiều
  `Contact` (người liên hệ) và nhiều `Note` (ghi chú).
- **Pipeline trạng thái** cố định theo flow:
  `New → Đã demo → Đã gửi báo giá → Đã gửi hợp đồng → Ký hợp đồng → End`
- **Bước kế tiếp (`nextStep`)** được tự động suy ra từ `status` theo bảng
  mapping, nhưng người dùng có thể chỉnh tay (override).
- **Không cần đăng nhập** ở phiên bản đầu – ai mở app cũng thấy toàn bộ dữ liệu.
- 4 màn hình chính: **Dashboard**, **Danh sách dự án**, **Chi tiết dự án**,
  **Thêm dự án mới**.

---

## 2. Kiến trúc hệ thống

```
Browser (React Client Components)
        │  fetch()
        ▼
Next.js App Router
  ├─ app/page.tsx               -> Dashboard (gọi /api/dashboard)
  ├─ app/projects/page.tsx      -> Danh sách (gọi /api/projects)
  ├─ app/projects/new/page.tsx  -> Form tạo mới
  ├─ app/projects/[id]/page.tsx -> Chi tiết + edit + contacts + notes
  └─ app/api/**                 -> API Routes (Route Handlers)
        │
        ▼
  Prisma Client (lib/prisma.ts)
        │
        ▼
   SQLite (prisma/dev.db)
```

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS. Các trang
  chính là Client Components (`"use client"`) gọi API qua `fetch`.
- **Backend**: Next.js API Routes (Route Handlers) trong `app/api/**`.
- **Database**: SQLite (file `prisma/dev.db`) – không cần cài server DB.
- **ORM**: Prisma.
- **Business logic dùng chung**: `lib/status.ts` – chứa bảng mapping
  trạng thái → bước kế tiếp, dùng cả ở backend (API) và frontend (UI gợi ý).

---

## 3. Cấu trúc thư mục

```
project-pipeline/
├── prisma/
│   ├── schema.prisma       # Data model (Project, Contact, Note)
│   └── seed.ts             # Dữ liệu mẫu (Công ty A → E)
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── status.ts           # Logic mapping status -> nextStep
│   └── format.ts           # Format ngày tháng
├── components/
│   └── StatusBadge.tsx
├── app/
│   ├── layout.tsx           # Layout + nav chung
│   ├── globals.css
│   ├── page.tsx             # Dashboard
│   ├── projects/
│   │   ├── page.tsx          # Danh sách dự án (search/filter/sort)
│   │   ├── new/page.tsx       # Tạo dự án mới
│   │   └── [id]/page.tsx      # Chi tiết dự án
│   └── api/
│       ├── projects/route.ts                 # GET (list), POST (create)
│       ├── projects/[id]/route.ts            # GET, PATCH, DELETE
│       ├── projects/[id]/contacts/route.ts          # POST
│       ├── projects/[id]/contacts/[contactId]/route.ts # PATCH, DELETE
│       ├── projects/[id]/notes/route.ts             # POST
│       ├── projects/[id]/notes/[noteId]/route.ts    # PATCH, DELETE
│       └── dashboard/route.ts                # GET thống kê
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── .env                    # DATABASE_URL="file:./dev.db"
```

---

## 4. Database / Prisma schema

3 bảng chính (xem `prisma/schema.prisma`):

### Project
| Field | Type | Ghi chú |
|---|---|---|
| id | String (cuid) | PK |
| companyName | String | Tên công ty |
| projectName | String | Tên dự án |
| status | String | New / Đã demo / Đã gửi báo giá / Đã gửi hợp đồng / Ký hợp đồng / End |
| nextStep | String? | Bước kế tiếp (tự động hoặc chỉnh tay) |
| firstContactDate | DateTime | Thời gian liên hệ lần đầu |
| contractSignedAt | DateTime? | Thời gian ký hợp đồng |
| createdAt | DateTime | Tự động |
| updatedAt | DateTime | Tự động (`@updatedAt`) |

### Contact (n-1 với Project)
| Field | Type |
|---|---|
| id, projectId | String |
| name | String |
| phone, email, position, note | String? |
| isPrimary | Boolean |

### Note (n-1 với Project)
| Field | Type |
|---|---|
| id, projectId | String |
| content | String |
| createdAt, updatedAt | DateTime |

Quan hệ: `Project 1—N Contact`, `Project 1—N Note`, cascade delete khi xóa Project.

---

## 5. Logic tự động cập nhật "Bước kế tiếp"

Định nghĩa trong `lib/status.ts`:

```ts
NEXT_STEP_MAP = {
  "New":            "Demo",
  "Đã demo":        "Gửi báo giá",
  "Đã gửi báo giá": "Gửi hợp đồng",
  "Đã gửi hợp đồng":"Ký hợp đồng",
  "Ký hợp đồng":    "End",
  "End":            null,
}
```

**Khi nào áp dụng:**

1. **Tạo dự án mới**: nếu không nhập `nextStep`, hệ thống tự gợi ý theo
   `status` ban đầu (mặc định `New` → gợi ý `Demo`).
2. **Cập nhật trạng thái** (trên màn hình chi tiết, dropdown "Trạng thái dự án"):
   - Frontend gọi `getSuggestedNextStep(newStatus)` để hiển thị ngay giá trị
     gợi ý trong ô "Bước kế tiếp", rồi gửi `PATCH { status, nextStep }`.
   - Backend (`PATCH /api/projects/:id`): nếu `status` thay đổi **và** request
     không gửi kèm `nextStep`, server tự set `nextStep = NEXT_STEP_MAP[status]`.
3. **Chỉnh tay `nextStep`**: người dùng có thể sửa trực tiếp ô "Bước kế tiếp"
   (input riêng) – khi blur, gửi `PATCH { nextStep }` độc lập, override giá trị
   tự động.
4. **Trạng thái "Ký hợp đồng"**: khi chuyển sang trạng thái này và project
   chưa có `contractSignedAt`, frontend tự điền ngày hôm nay vào ô
   "Thời gian ký hợp đồng" (người dùng có thể sửa lại).

---

## 6. Hướng dẫn cài đặt & chạy local

### Yêu cầu
- Node.js >= 18
- npm

### Bước 1 – Cài dependencies

```bash
cd project-pipeline
npm install
```

### Bước 2 – Tạo database SQLite + generate Prisma Client

```bash
npx prisma generate
npx prisma db push
```

Lệnh `db push` sẽ tạo file `prisma/dev.db` theo `schema.prisma`.

### Bước 3 – Seed dữ liệu mẫu (Công ty A → E)

```bash
npm run seed
```

(hoặc `npx prisma db seed`)

### Bước 4 – Chạy app

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

> 💡 Nếu muốn xem trực tiếp dữ liệu trong DB, dùng `npx prisma studio`.

---

## 7. Hướng dẫn sử dụng các màn hình chính

### a. Dashboard (`/`)
- Tổng số dự án, số dự án theo từng trạng thái, số dự án đã ký hợp đồng.
- **Dự án đang cần follow-up**: các dự án chưa kết thúc (`status != End`),
  sắp xếp theo ngày cập nhật cũ nhất trước (ưu tiên xử lý).
- **Dự án chưa có bước kế tiếp**: các dự án có `nextStep` rỗng/null.

### b. Danh sách dự án (`/projects`)
- Bảng hiển thị đầy đủ các cột yêu cầu (công ty, dự án, trạng thái, bước kế
  tiếp, người liên hệ chính, SĐT, email, liên hệ lần đầu, ký hợp đồng, cập
  nhật gần nhất).
- **Tìm kiếm**: theo tên công ty / tên dự án / tên người liên hệ / email / SĐT
  (1 ô tìm kiếm duy nhất, tìm trên tất cả các trường này).
- **Lọc theo trạng thái**: dropdown chọn 1 trong 6 trạng thái hoặc "Tất cả".
- **Sắp xếp**: theo ngày cập nhật gần nhất / thời gian liên hệ lần đầu /
  thời gian ký hợp đồng, tăng/giảm dần.
- Click vào một dòng để mở màn hình chi tiết.

### c. Thêm dự án mới (`/projects/new`)
- Nhập tên công ty, tên dự án, trạng thái (mặc định `New`), bước kế tiếp
  (tự gợi ý theo trạng thái, có thể sửa), thời gian liên hệ lần đầu (bắt buộc),
  thời gian ký hợp đồng (tùy chọn).

### d. Chi tiết dự án (`/projects/:id`)
- **Thông tin dự án**: bấm "Chỉnh sửa" để sửa tên công ty/dự án, ngày liên hệ
  lần đầu, ngày ký hợp đồng. Trạng thái và bước kế tiếp có thể sửa trực tiếp
  (không cần vào mode "Chỉnh sửa") – lưu ngay khi thay đổi.
- **Người liên hệ**: thêm/sửa/xóa, đánh dấu người liên hệ chính (khi đặt 1
  người là chính, các người khác tự bỏ đánh dấu).
- **Ghi chú dự án**: thêm ghi chú mới (hiển thị mới nhất lên đầu), sửa/xóa
  ghi chú đã có. Ghi chú lưu thời gian tạo và thời gian sửa (nếu có).
- **Xóa dự án**: nút ở góc trên bên phải, xóa cascade luôn contacts & notes.

---

## 8. Dữ liệu mẫu

Sau khi chạy `npm run seed`, hệ thống có 5 dự án mẫu:

| Công ty | Trạng thái | Bước kế tiếp |
|---|---|---|
| Công ty A | New | Demo |
| Công ty B | Đã demo | Gửi báo giá |
| Công ty C | Đã gửi báo giá | Gửi hợp đồng |
| Công ty D | Đã gửi hợp đồng | Ký hợp đồng |
| Công ty E | Ký hợp đồng | End (đã có `contractSignedAt`) |

Mỗi công ty có ít nhất 1 người liên hệ và 1 ghi chú.

---

## 9. Hướng mở rộng sau này

- Thêm đăng nhập/phân quyền (NextAuth).
- Đổi `status`/`nextStep` từ `String` sang Prisma `enum` khi schema ổn định.
- Thêm phân trang cho danh sách dự án khi dữ liệu lớn.
- Thêm lịch sử thay đổi trạng thái (audit log) riêng, tách khỏi Notes.
- Đổi SQLite sang PostgreSQL/MySQL (chỉ cần đổi `provider` + `DATABASE_URL`
  trong `schema.prisma` / `.env`).
