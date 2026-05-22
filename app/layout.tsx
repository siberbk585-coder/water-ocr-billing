import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thu tiền nước",
  description: "Ứng dụng ghi chỉ số, tạo hóa đơn, gửi Zalo và theo dõi thu tiền nước",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
