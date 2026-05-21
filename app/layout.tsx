import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghi chỉ số & hóa đơn nước",
  description: "Hệ thống ghi chỉ số đồng hồ nước bằng OCR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
