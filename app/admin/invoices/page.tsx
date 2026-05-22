import { redirect } from "next/navigation";

/** Hóa đơn tạo/xem PDF trên Bảng thu nước (cột「Hóa đơn」từng hộ). */
export default function AdminInvoicesPage() {
  redirect("/admin/billing-sheet?route=all");
}
