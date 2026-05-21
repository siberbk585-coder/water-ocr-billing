# n8n Webhook — Lưu ảnh & trả link

App gửi ảnh lên webhook n8n của bạn; workflow n8n xử lý và **trả JSON có `url`**.

**Webhook production:** https://iatzhxxuk.tino.page/webhook/luuhinhanh

---

## Luồng

```mermaid
sequenceDiagram
  participant App as water-ocr-billing
  participant N8n as n8n luuhinhanh
  participant Store as Drive/S3/Blob

  App->>N8n: POST multipart image + metadata
  N8n->>Store: Upload (bạn cấu hình)
  N8n-->>App: { "url": "https://..." }
  App->>App: Lưu imagePath = url vào DB
```

---

## 1. Cấu hình app

### Biến môi trường

| Biến | Giá trị |
|------|---------|
| `N8N_IMAGE_WEBHOOK_URL` | `https://iatzhxxuk.tino.page/webhook/luuhinhanh` (mặc định nếu không set) |

Để **tắt** webhook và dùng Blob/local: set `N8N_IMAGE_WEBHOOK_URL=` (rỗng).

Khi webhook được bật, app **không** cần `BLOB_READ_WRITE_TOKEN` cho luồng gửi ảnh hộ dân.

### Ai gọi webhook?

- Hộ dân: `POST /api/readings/submit` (chụp ảnh + CSM)
- API upload: `POST /api/uploads/image`

---

## 2. Payload gửi tới n8n

**Content-Type:** `multipart/form-data`

| Field | Mô tả |
|-------|--------|
| `image` | File ảnh (binary) |
| `filename` | Tên file gợi ý |
| `content_type` | MIME, vd `image/jpeg` |
| `source` | `water-ocr-billing` |
| `householdId` | ID hộ (khi gửi từ app) |
| `periodId` | ID kỳ |
| `householdCode` | MKH, vd `212001` |
| `confirmedValue` | CSM hộ nhập |

Trong n8n: dùng `$binary.image` hoặc parse `$json.body` tùy cấu hình Webhook.

---

## 3. Response bắt buộc từ n8n

Node **Respond to Webhook** phải trả JSON có **`url`** (chuỗi https):

```json
{
  "ok": true,
  "url": "https://your-cdn.com/path/to/image.jpg"
}
```

App cũng đọc được: `imageUrl`, hoặc mảng `[{ "body": { "url": "..." } }]` (format mặc định n8n).

Nếu không có `url` → app báo lỗi: *"n8n webhook không trả url"*.

---

## 4. Workflow mẫu

Import [`workflow-luuhinhanh.json`](./workflow-luuhinhanh.json) vào n8n (path `luuhinhanh`).

**Các bước bạn cần thêm giữa Webhook và Respond:**

1. Lưu file (`$binary.image`) lên Google Drive / S3 / Cloudinary / Vercel Blob
2. (Tùy chọn) OCR, resize, đổi tên
3. **Respond to Webhook** với `url` public

---

## 5. Test webhook (curl)

```bash
curl -X POST "https://iatzhxxuk.tino.page/webhook/luuhinhanh" \
  -F "image=@/path/to/meter.jpg" \
  -F "source=water-ocr-billing" \
  -F "householdCode=212001" \
  -F "confirmedValue=913"
```

Kết quả mong đợi: JSON có `url`.

---

## 6. API upload trực tiếp (không qua app hộ dân)

Vẫn dùng được `POST /api/uploads/image` — nếu `N8N_IMAGE_WEBHOOK_URL` bật, API cũng forward sang webhook n8n.

---

## Troubleshooting

| Triệu chứng | Xử lý |
|-------------|--------|
| Response `body: {}` | Chưa có Respond to Webhook hoặc chưa set `url` |
| HTTP 404 *not registered for POST* | Trên n8n: Webhook node phải là **POST**, workflow **Active**, path `luuhinhanh` |
| Timeout | Tăng timeout node HTTP trong app hoặc tối ưu workflow n8n |
