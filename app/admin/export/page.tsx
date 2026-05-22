import { redirect } from "next/navigation";

/** Excel thao tác trên Bảng thu nước — trang cũ chuyển sang Giá khu vực. */
export default function AdminExportRedirect() {
  redirect("/admin/area-prices");
}
