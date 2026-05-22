import { redirect } from "next/navigation";

/** Trang cũ — chuyển sang bảng ghi chỉ số theo tuyến. */
export default function AdminReadingsRedirect() {
  redirect("/admin/billing-sheet?route=all");
}
