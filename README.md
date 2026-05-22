# Thu tiền nước

Ứng dụng vận hành thu tiền nước theo tháng: hộ dân gửi chỉ số, tổ trưởng/kế toán chốt CSM, tạo hóa đơn, gửi Zalo OA + QR qua n8n, xác nhận đã thu và xuất Excel khóa sổ.

## Yeu cau

- Node.js 20+
- npm

## Chay local

```bash
cd water-ocr-billing
cp .env.example .env
# Dien DATABASE_URL + DIRECT_URL (Neon free branch hoac Postgres local)
npm install
npm run db:migrate:deploy   # hoac: npm run db:migrate (dev)
npm run db:seed
npm run dev -- -p 3001
```

Mo [http://localhost:3001](http://localhost:3001) (mac dinh Next.js la 3000; neu port 3000 bi chiem, dung `-p 3001` nhu tren).

**Lenh day du (port 3001):**

```bash
cp .env.example .env && npm install && npm run db:migrate && npm run db:seed && npm run dev -- -p 3001
```

### Tai khoan demo (sau seed)

| Vai tro   | Tai khoan     | Mat khau    |
|-----------|---------------|-------------|
| Admin     | admin         | 123456      |
| Dan cu    | 0912345678    | 123456      |

Dan cu demo gan voi dong ho `DH00001`.

### Doc OCR tu dong (khong dung trong MVP)

Chi de tham khao sau: [docs/OCR_MODEL_COLAB.md](docs/OCR_MODEL_COLAB.md)

## Scripts

| Lenh | Mo ta |
|------|--------|
| `npm run dev` | Dev server (port 3000) |
| `npm run dev -- -p 3001` | Dev server khi port 3000 bi chiem |
| `npm run build` | Prisma generate + migrate deploy + Next build (Vercel) |
| `npm run db:migrate:deploy` | Ap migration len Postgres (production) |
| `npm test` | Unit test `anomaly.ts`, `billing.ts` |
| `npm run db:migrate` | Ap dung migration Prisma (khuyen nghi) |
| `npm run db:push` | Dong bo schema (dev nhanh, khong khuyen nghi production) |
| `npm run db:seed` | Seed 250 ho + 3 thang lich su |
| `npm run db:studio` | Prisma Studio |

## Luong nghiep vu chinh

1. **Dan cu**: `/resident/submit-reading` — chup anh + nhap chi so → `POST /api/readings/submit`
2. **Admin**: `/admin/dashboard` — tong quan ky thu, checklist van hanh
3. **Admin**: `/admin/billing-sheet` — bang thu nuoc theo ky/tuyen, chot CSM, danh dau da thu nhanh
4. **Admin**: `/admin/invoices` — tao hoa don, xuat PDF, gui Zalo OA + QR
5. **Admin**: `/admin/payments` — xac nhan thanh toan
6. **Export**: `/admin/export`, `GET /api/exports/period-xlsx`, `GET /api/exports/xlsx`

## Cau truc chinh

- `app/admin/*` — man hinh to truong / ke toan
- `app/resident/*` — man hinh ho dan
- `lib/readings.ts`, `lib/billingSheet.ts`, `lib/billing.ts` — logic ghi so, bang thu, tinh tien
- `lib/pdf.ts`, `lib/invoicePdfLocal.ts` — PDF hoa don
- `lib/imageUpload.ts`, `lib/n8n*.ts` — ket noi n8n, Drive/Zalo
- `prisma/schema.prisma` — schema Postgres
- Chi tiet: [docs/APP_STRUCTURE.md](docs/APP_STRUCTURE.md)

## Deploy (Vercel + Neon free)

1. Push repo len GitHub (`git@github.com:siberbk585-coder/<repo>.git`).
2. Vercel → Import project → **Storage → Neon** (chon **Free**).
3. Environment variables (Production + Preview):
   - `DATABASE_URL` — tu Neon (pooled)
   - `DIRECT_URL` — `DATABASE_URL_UNPOOLED` tu Neon (cho migrate)
   - `SESSION_SECRET` — chuoi ngau nhien dai
   - `STORAGE_DIR` — `storage` (tam; anh/PDF co the mat sau redeploy — xem phase Blob sau)
   - `OCR_CONFIDENCE_THRESHOLD`, `DEFAULT_UNIT_PRICE` — tuy chon
4. Build: `npm run build` (gom `prisma migrate deploy`).
5. Seed production **mot lan** (tuy chon): `npm run db:seed` voi env production.
6. Anh luu tai `storage/readings/` (local; tren Vercel co the mat sau redeploy — xem phase Blob).

Khong hardcode duong dan tuyet doi — dung `process.cwd()` va bien moi truong trong `lib/env.ts`, `lib/storage.ts`.

### Database

- Provider: **PostgreSQL** (`prisma/schema.prisma`)
- Migration: `prisma/migrations/20250517100000_init`
- Quan ly: Prisma Studio, Neon Console
- **Khong** dung SQLite tren Vercel
