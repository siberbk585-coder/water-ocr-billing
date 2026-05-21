# Hướng dẫn: Đưa mô hình Colab (Detectron2) vào quét OCR

> **App đang dùng:** Hộ dân **chụp ảnh + nhập chỉ số tay** — `POST /api/readings/submit`.  
> **Tài liệu dưới đây:** lưu tham khảo nếu sau này bật OCR lại (hiện **không** dùng trong UI).

Notebook Colab / Roboflow Workflow — tài liệu bên dưới **chỉ khi** bạn muốn bật lại đọc tự động sau này.

App cũng có **Tesseract.js** (chậm, dễ sai trên ảnh đồng hồ thật) — nút “Thử đọc tự động” trong form.

---

## Kiến trúc đề xuất (2 bước)

```text
Ảnh upload
    │
    ▼
[Bước 1] Mô hình Colab / Roboflow  →  hộp bbox (vùng số đồng hồ)
    │
    ▼
[Cắt ảnh] sharp.extract (crop)
    │
    ▼
[Bước 2] Tesseract (đã có trong app)  →  chỉ số 0097.59
```

**Không** nhét file `.pth` Detectron2 trực tiếp vào Next.js trên Vercel — PyTorch + Detectron2 quá nặng cho serverless.

---

## 3 cách đưa model Colab vào production

| Cách | Độ khó | Phù hợp Vercel | Ghi chú |
|------|--------|----------------|---------|
| **A. Roboflow Hosted Inference** | Dễ nhất | Có | Dataset Colab đã từ Roboflow → deploy 1 click |
| **B. API Python riêng** (FastAPI + Detectron2) | Trung bình | Gọi HTTP từ Vercel | Railway, Render, Modal, GCP |
| **C. ONNX + onnxruntime-node** | Khó | Hạn chế | Cần export ONNX từ Colab, test kỹ |

**Khuyến nghị:** **Cách A** cho MVP; **Cách B** nếu cần full quyền model custom.

---

## Cách A — Roboflow Workflow (màn hình bạn đang mở)

Bạn đang ở **Deploy Workflow → Serverless Hosted API** — đây là cách đúng cho workflow `detect-count-and-visualize`.

### 1. Lấy thông tin từ cửa sổ Deploy Workflow

Trong snippet Python, Roboflow hiển thị:

```python
client = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="API_KEY"
)
result = client.run_workflow(
    workspace_name="duongs-workspace-41kha",      # ← workspace
    workflow_id="detect-count-and-visualize",     # ← workflow id
    images={"image": "YOUR_IMAGE.jpg"}
)
```

Ghi lại:

| Thông tin | Ví dụ của bạn |
|-----------|----------------|
| API Key | Roboflow → Settings → API |
| Workspace | `duongs-workspace-41kha` |
| Workflow ID | `detect-count-and-visualize` |
| Tên input ảnh | thường là `image` (đúng như snippet) |

### 2. Cấu hình `.env` / Vercel

```env
METER_DETECT_ENABLED=true
ROBOFLOW_API_KEY=<API_KEY từ Roboflow>
ROBOFLOW_WORKSPACE=duongs-workspace-41kha
ROBOFLOW_WORKFLOW_ID=detect-count-and-visualize
# ROBOFLOW_DETECT_CLASS=   # tùy chọn — tên class vùng số trong workflow
```

App gọi HTTP (tương đương Python SDK):

```text
POST https://serverless.roboflow.com/infer/workflows/duongs-workspace-41kha/detect-count-and-visualize
Body: { "api_key": "...", "inputs": { "image": { "type": "base64", "value": "..." } } }
```

### 3. Cách A (cũ) — Detect model API

Nếu **không** dùng Workflow mà dùng model detect riêng:

```env
ROBOFLOW_DETECT_URL=https://detect.roboflow.com/your-workspace/water-meters/1
```

Workflow được ưu tiên khi có `ROBOFLOW_WORKSPACE` + `ROBOFLOW_WORKFLOW_ID`.

### 3. App đã hỗ trợ sẵn

Khi bật env trên, `lib/meterDetect.ts` sẽ:

1. Gọi Roboflow → lấy bbox confidence cao nhất (hoặc đúng class).
2. Cắt vùng đó bằng `sharp`.
3. Chạy Tesseract trên **ảnh đã cắt** (nhanh và chính xác hơn).

Tắt `METER_DETECT_ENABLED` → quay lại OCR cả ảnh như cũ.

### 4. Test nhanh

```bash
curl -X POST "https://detect.roboflow.com/.../1?api_key=KEY" \
  -F "file=@anh-dong-ho.jpg"
```

Thấy `predictions` có `x, y, width, height` là API OK.

---

## Cách B — API Python (model `.pth` từ Colab)

### 1. Colab — export

Cuối notebook, lưu weights:

```python
torch.save(cfg.MODEL.WEIGHTS, "model_final.pth")
# hoặc cfg.MODEL.WEIGHTS đã có sau trainer.train()
```

Copy `model_final.pth` + file config Detectron2 ra máy chủ Python.

### 2. FastAPI tối giản (chạy ngoài Vercel)

```python
# detect_api.py — chạy trên Railway / Modal
from fastapi import FastAPI, File, UploadFile
from detectron2.engine import DefaultPredictor
# ... load cfg + predictor ...

app = FastAPI()

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    image = read_image(file)
    outputs = predictor(image)
    boxes = outputs["instances"].pred_boxes.tensor.cpu().numpy()
    # trả JSON: [{ "x", "y", "width", "height", "confidence" }]
```

### 3. Next.js gọi API

```env
METER_DETECT_ENABLED=true
METER_DETECT_API_URL=https://your-python-api/detect
```

(Cần thêm handler trong `lib/meterDetect.ts` — hiện mặc định Roboflow; có thể mở rộng `DETECT_PROVIDER=roboflow|custom`.)

---

## Cách C — ONNX (chỉ khi team quen export)

1. Colab: export ONNX từ Detectron2 (phức tạp, phụ thuộc opset).
2. App: `onnxruntime-node` + preprocess giống training.
3. Phù hợp server **Node lâu dài** (không ideal cho Vercel cold start).

---

## Checklist Colab → App

- [ ] Train xong, mAP/loss ổn trên tập val
- [ ] Chọn **A (Roboflow API)** hoặc **B (Python API)**
- [ ] Test 10 ảnh thật (Itron, Sensus, v.v.)
- [ ] Set env trên Vercel (Production)
- [ ] Bật `METER_DETECT_ENABLED=true`
- [ ] Quét thử `/resident/submit-reading` — so sánh tốc độ & chỉ số

---

## Lưu ý ảnh đồng hồ (ví dụ Itron MULTIMAG)

- Chụp **thẳng**, đủ sáng, **cửa sổ số** nằm giữa khung hình.
- Model detect giúp **bỏ viền** số `409971` in trên vỏ máy.
- Số đỏ (phần thập phân) — dataset cần có nhãn hoặc OCR đọc cả dòng `0097 59`.

---

## Tham chiếu code trong repo

| File | Vai trò |
|------|---------|
| `lib/meterDetect.ts` | Gọi Roboflow / crop ảnh |
| `lib/ocr.ts` | Tesseract + worker cache |
| `app/api/readings/ocr/route.ts` | API upload ảnh |
| `.env.example` | Biến bật detection |
