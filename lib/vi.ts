import type {
  HouseholdStatus,
  InvoiceStatus,
  InputMethod,
  ReadingStatus,
  UserRole,
} from "@prisma/client";
import type { AnomalyCode } from "./anomaly";

export const appTitle = "Hệ thống ghi chỉ số & hóa đơn nước";

export const adminNav = [
  { href: "/admin/billing-sheet", label: "Bảng ghi chỉ số" },
  { href: "/admin/dashboard", label: "Tổng quan" },
  { href: "/admin/routes", label: "Tuyến thu" },
  { href: "/admin/households", label: "Hộ dân" },
  { href: "/admin/invoices", label: "Hóa đơn" },
  { href: "/admin/payments", label: "Thanh toán" },
  { href: "/admin/export", label: "Xuất dữ liệu" },
] as const;

export const residentNav = [
  { href: "/resident/submit-reading", label: "Ghi chỉ số" },
  { href: "/resident/invoices", label: "Hóa đơn" },
] as const;

export function formatPeriod(month: number, year: number): string {
  return `Tháng ${month}/${year}`;
}

export function readingStatusLabel(status: ReadingStatus): string {
  const map: Record<ReadingStatus, string> = {
    PENDING: "Chờ xử lý",
    CONFIRMED: "Đã xác nhận",
    REJECTED: "Từ chối",
  };
  return map[status];
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    DRAFT: "Nháp",
    ISSUED: "Chưa thanh toán",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
  };
  return map[status];
}

export function inputMethodLabel(method: InputMethod): string {
  const map: Record<InputMethod, string> = {
    OCR_CONFIRMED: "Xác nhận OCR",
    OCR_EDITED: "Sửa sau OCR",
    MANUAL: "Nhập tay",
  };
  return map[method];
}

export function anomalyLabel(code: AnomalyCode): string {
  const map: Record<AnomalyCode, string> = {
    NEGATIVE_USAGE: "Chỉ số giảm",
    HIGH_USAGE: "Tiêu thụ cao bất thường",
    ZERO_USAGE: "Không tiêu thụ",
    NEW_CUSTOMER: "Hộ mới / thiếu lịch sử",
  };
  return map[code];
}

export function userRoleLabel(role: UserRole): string {
  return role === "ADMIN" ? "Quản trị" : "Hộ dân";
}

export function householdStatusLabel(status: HouseholdStatus): string {
  return status === "ACTIVE" ? "Đang sử dụng" : "Ngừng";
}

export function periodStatusLabel(status: import("@prisma/client").PeriodStatus): string {
  return status === "OPEN" ? "Đang mở" : "Đã đóng";
}

export function auditActionLabel(action: string): string {
  const map: Record<string, string> = {
    READING_CONFIRMED: "Xác nhận chỉ số",
    READING_SUBMITTED: "Hộ gửi chỉ số",
    INVOICES_GENERATED: "Tạo hóa đơn",
    PAYMENT_CONFIRMED: "Xác nhận thanh toán",
    SHEETS_EXPORT: "Xuất báo cáo",
    XLSX_EXPORT: "Xuất Excel tổng hợp",
    // legacy keys
    INVOICES_GENERATED_LEGACY: "Tạo hóa đơn",
  };
  return map[action] ?? action;
}

export function entityLabel(entity: string): string {
  const map: Record<string, string> = {
    MeterReading: "Chỉ số đồng hồ",
    Invoice: "Hóa đơn",
    Payment: "Thanh toán",
    Export: "Xuất dữ liệu",
  };
  return map[entity] ?? entity;
}

export function paymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    CASH: "Tiền mặt",
    TRANSFER: "Chuyển khoản",
  };
  return map[method] ?? method;
}
