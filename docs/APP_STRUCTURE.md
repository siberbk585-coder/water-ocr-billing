# Cấu trúc ứng dụng thu tiền nước

Mục tiêu của dự án là một ứng dụng vận hành thu tiền nước theo tháng, không phải một demo OCR rời rạc. Cấu trúc route và module được giữ theo luồng nghiệp vụ để người vận hành đi từ ghi chỉ số đến khóa sổ.

## Luồng điều hành

1. **Tổng quan**: `/admin/dashboard`
   - Theo dõi kỳ đang mở, tiến độ ghi CSM, hóa đơn, công nợ và tuyến thu.
   - Là điểm vào mặc định sau khi admin đăng nhập.

2. **Ghi chỉ số / Chốt chỉ số**: `/admin/billing-sheet`
   - Bảng làm việc chính theo kỳ và tuyến.
   - Hộ gửi CSM thì vào trạng thái chờ chốt.
   - Nhân viên có thể nhập trực tiếp và chốt luôn.

3. **Hóa đơn & Zalo**: `/admin/invoices`
   - Tạo hóa đơn cho các hộ đã chốt CSM.
   - Xuất PDF, gửi Zalo OA + QR qua n8n nếu đã cấu hình webhook.

4. **Thu tiền**: `/admin/payments`
   - Xác nhận hóa đơn đã thu.
   - Trên bảng thu nước cũng có thể đánh dấu thu nhanh ở cột Thu.

5. **Hộ dân**:
   - `/resident/submit-reading`: gửi CSM và ảnh tùy chọn.
   - `/resident/invoices`: xem hóa đơn của hộ.

6. **Excel / Khóa sổ**:
   - `/admin/export`: xuất sổ thu.
   - Thanh cài đặt kỳ trên layout admin cấu hình ngày đóng và đóng kỳ thủ công.

## Module chính

- `app/admin/*`: màn hình vận hành cho tổ trưởng/kế toán.
- `app/resident/*`: màn hình hộ dân.
- `app/api/*`: endpoint cho submit CSM, duyệt chỉ số, hóa đơn, thanh toán, export.
- `components/*`: UI dùng lại cho bảng thu, form hộ dân, trạng thái kỳ.
- `lib/readings.ts`: nghiệp vụ ghi, duyệt, từ chối và chốt chỉ số.
- `lib/billingSheet.ts`: dữ liệu bảng thu theo kỳ/tuyến.
- `lib/billing.ts`: tính tiêu thụ và tiền nước.
- `lib/pdf.ts`, `lib/invoicePdfLocal.ts`: sinh PDF hóa đơn.
- `lib/imageUpload.ts`, `lib/n8n*.ts`: tích hợp lưu ảnh/PDF và gửi Zalo qua n8n.
- `lib/db.ts`, `prisma/schema.prisma`: Prisma/PostgreSQL.

## Kết nối giữ nguyên

- Không đổi `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `DIRECT_URL` hoặc các biến môi trường Vercel/Neon.
- Không đổi `next.config.ts`, Prisma provider, migrations hay cấu hình build.
- Local/dev/prod vẫn dùng cùng cơ chế hiện có trong `package.json`.
