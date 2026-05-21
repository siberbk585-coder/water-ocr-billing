# Water OCR Billing MVP

He thong ghi chi so dong ho nuoc bang OCR (Tesseract), tinh cuoc va hoa don PDF — Prisma + Postgres (Neon tren Vercel).

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

| Vai tro   | So dien thoai | Mat khau    |
|-----------|---------------|-------------|
| Admin     | 0900000001    | 123456      |
| Dan cu    | 0912345678    | 123456      |

Dan cu demo gan voi dong ho `DH00001`.

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

## Luong nghiep vu

1. **Dan cu**: `/resident/submit-reading` — upload anh → OCR (nguong 70%) → xac nhan/nhap tay → luu `MeterReading`
2. **Admin**: `/admin/readings` — xem canh bao bat thuong
3. **Admin**: `/admin/invoices` — Tao hoa don + PDF
4. **Admin**: `/admin/payments` — Xac nhan thanh toan
5. **Export**: `GET /api/exports/sheets` — CSV; `POST` — stub Google Sheets

## Cau truc chinh

- `lib/anomaly.ts`, `lib/billing.ts` — logic thuan
- `lib/ocr.ts` — Tesseract server-side (Node runtime)
- `lib/storage.ts` — adapter file local (`storage/`)
- `prisma/schema.prisma` — 9 bang

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
6. OCR (`/api/readings/ocr`) dung **Node.js runtime**.

Khong hardcode duong dan tuyet doi — dung `process.cwd()` va bien moi truong trong `lib/env.ts`, `lib/storage.ts`.

### Database

- Provider: **PostgreSQL** (`prisma/schema.prisma`)
- Migration: `prisma/migrations/20250517100000_init`
- Quan ly: Prisma Studio, Neon Console
- **Khong** dung SQLite tren Vercel
