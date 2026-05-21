import type { InputMethod, ReadingStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import { parseAnomalyFlags } from "./anomaly";
import { loadBillingSheetRows, loadRouteSummaries } from "./billingSheet";
import { formatCurrency } from "./billing";
import { prisma } from "./db";
import {
  anomalyLabel,
  auditActionLabel,
  entityLabel,
  formatPeriod,
  inputMethodLabel,
  invoiceStatusLabel,
  paymentMethodLabel,
  readingStatusLabel,
  userRoleLabel,
} from "./vi";

function sheetFromRows<T extends Record<string, unknown>>(rows: T[]): XLSX.WorkSheet {
  return XLSX.utils.json_to_sheet(rows);
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toLocaleString("vi-VN");
}

export async function buildFullExportWorkbook(): Promise<XLSX.WorkBook> {
  const [
    households,
    periods,
    readings,
    invoices,
    payments,
    auditLogs,
    householdCount,
    pendingReadings,
    issuedInvoices,
    paidInvoices,
  ] = await Promise.all([
    prisma.household.findMany({
      orderBy: { householdCode: "asc" },
      include: { priceGroup: true, user: true },
    }),
    prisma.billingPeriod.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] }),
    prisma.meterReading.findMany({
      orderBy: { submittedAt: "desc" },
      include: { household: true, period: true },
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { household: true, period: true, payment: true },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: { invoice: { include: { household: true, period: true } }, confirmedBy: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { actor: true },
    }),
    prisma.household.count(),
    prisma.meterReading.count({ where: { status: "PENDING" } }),
    prisma.invoice.count({ where: { status: "ISSUED" } }),
    prisma.invoice.count({ where: { status: "PAID" } }),
  ]);

  const totalRevenue = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.totalAmount, 0);
  const totalOutstanding = invoices
    .filter((i) => i.status === "ISSUED")
    .reduce((s, i) => s + i.totalAmount, 0);

  const wb = XLSX.utils.book_new();

  const summaryRows = [
    { "Chỉ tiêu": "Tổng số hộ dân", "Giá trị": householdCount },
    { "Chỉ tiêu": "Chỉ số chờ duyệt", "Giá trị": pendingReadings },
    { "Chỉ tiêu": "Hóa đơn chưa thanh toán", "Giá trị": issuedInvoices },
    { "Chỉ tiêu": "Hóa đơn đã thanh toán", "Giá trị": paidInvoices },
    { "Chỉ tiêu": "Tổng tiền đã thu (VND)", "Giá trị": totalRevenue },
    { "Chỉ tiêu": "Tổng tiền chưa thu (VND)", "Giá trị": totalOutstanding },
    { "Chỉ tiêu": "Ngày xuất file", "Giá trị": new Date().toLocaleString("vi-VN") },
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(summaryRows), "Tong_quan");

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      households.map((h) => ({
        "Mã hộ": h.householdCode,
        "Mã đồng hồ": h.meterCode,
        "Tên hộ dân": h.residentName,
        "Địa chỉ": h.address,
        "Nhóm giá": h.priceGroup.name,
        "Đơn giá (VND/m³)": h.priceGroup.unitPrice,
        "Số điện thoại": h.user?.phone ?? "",
        "Ngày tạo": formatDate(h.createdAt),
      }))
    ),
    "Ho_dan"
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      periods.map((p) => ({
        "Kỳ": formatPeriod(p.month, p.year),
        "Năm": p.year,
        "Tháng": p.month,
        "Trạng thái": p.status === "OPEN" ? "Đang mở" : "Đã đóng",
        "Ngày tạo": formatDate(p.createdAt),
      }))
    ),
    "Ky_ghi"
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      readings.map((r) => {
        const flags = parseAnomalyFlags(r.anomalyFlags).map(anomalyLabel);
        return {
          "Mã hộ": r.household.householdCode,
          "Mã đồng hồ": r.household.meterCode,
          "Tên hộ dân": r.household.residentName,
          "Kỳ": formatPeriod(r.period.month, r.period.year),
          "Chỉ số cũ": r.oldReading,
          "OCR": r.ocrValue ?? "",
          "Chỉ số xác nhận": r.confirmedValue ?? "",
          "Tiêu thụ (m³)": r.usageM3 ?? "",
          "Độ tin cậy (%)": r.confidence ?? "",
          "Cách nhập": r.inputMethod ? inputMethodLabel(r.inputMethod as InputMethod) : "",
          "Cảnh báo": flags.join("; "),
          "Trạng thái": readingStatusLabel(r.status as ReadingStatus),
          "Ngày gửi": formatDate(r.submittedAt),
          "Ngày xác nhận": formatDate(r.confirmedAt),
        };
      })
    ),
    "Chi_so"
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      invoices.map((inv) => ({
        "Mã hộ": inv.household.householdCode,
        "Mã đồng hồ": inv.household.meterCode,
        "Tên hộ dân": inv.household.residentName,
        "Kỳ": formatPeriod(inv.period.month, inv.period.year),
        "Tiêu thụ (m³)": inv.usageM3,
        "Đơn giá": inv.unitPrice,
        "Tổng tiền (VND)": inv.totalAmount,
        "Trạng thái": invoiceStatusLabel(inv.status),
        "Có PDF": inv.pdfPath ? "Có" : "Không",
        "Ngày phát hành": formatDate(inv.issuedAt),
        "Ngày tạo": formatDate(inv.createdAt),
      }))
    ),
    "Hoa_don"
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      payments.map((p) => ({
        "Mã hộ": p.invoice.household.householdCode,
        "Mã đồng hồ": p.invoice.household.meterCode,
        "Kỳ": formatPeriod(p.invoice.period.month, p.invoice.period.year),
        "Số tiền (VND)": p.amount,
        "Phương thức": paymentMethodLabel(p.method),
        "Ghi chú": p.note ?? "",
        "Người xác nhận": p.confirmedBy?.name ?? "",
        "Ngày xác nhận": formatDate(p.confirmedAt),
        "Ngày tạo": formatDate(p.createdAt),
      }))
    ),
    "Thanh_toan"
  );

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      auditLogs.map((log) => ({
        "Thao tác": auditActionLabel(log.action),
        "Đối tượng": entityLabel(log.entity),
        "Người thực hiện": log.actor?.name ?? "",
        "Thời gian": formatDate(log.createdAt),
      }))
    ),
    "Nhat_ky"
  );

  return wb;
}

export async function buildFullExportBuffer(): Promise<Buffer> {
  const wb = await buildFullExportWorkbook();
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return buf;
}

export function exportFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `bao-cao-tong-hop-${y}${m}${day}.xlsx`;
}

function sheetNameSafe(name: string): string {
  const s = name.replace(/[\\/*?:[\]]/g, "").slice(0, 31);
  return s || "Sheet";
}

/** Workbook giống Excel vận hành: mỗi tuyến một sheet + TỔNG HỢP. */
export async function buildPeriodRouteWorkbook(periodId: string): Promise<XLSX.WorkBook> {
  const period = await prisma.billingPeriod.findUniqueOrThrow({ where: { id: periodId } });
  const routes = await prisma.collectionRoute.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const wb = XLSX.utils.book_new();
  const periodTitle = `${period.month}/${period.year}`;

  for (const route of routes) {
    const rows = await loadBillingSheetRows(periodId, route.id);
    const sheetRows = rows.map((r, i) => ({
      STT: r.routeSortOrder ?? i + 1,
      "Họ và tên": r.residentName,
      SĐT: r.contactPhone ?? "",
      MKH: r.householdCode,
      CSC: r.oldReading,
      CSM: r.csm ?? "",
      "Tiêu thụ (m³)":
        r.usageM3 ?? (r.csm != null ? Math.max(0, (r.csm ?? 0) - r.oldReading) : ""),
      TT:
        r.totalAmount != null && r.totalAmount > 0
          ? r.totalAmount
          : r.usageM3 === 0
            ? "—"
            : "",
    }));
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(sheetRows),
      sheetNameSafe(`${route.name} (${periodTitle})`)
    );
  }

  const summaries = await loadRouteSummaries(periodId);
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      summaries.map((s) => ({
        Tuyến: s.routeName,
        "Số hộ": s.householdCount,
        "Đã ghi CSM": s.recordedCount,
        "Chờ duyệt": s.pendingCount,
        "Tổng STT (m³)": s.totalUsageM3,
        "Tổng TT (VND)": s.totalAmount,
      }))
    ),
    sheetNameSafe("TONG HOP")
  );

  return wb;
}

export async function buildPeriodRouteExportBuffer(periodId: string): Promise<Buffer> {
  const wb = await buildPeriodRouteWorkbook(periodId);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function periodExportFilename(month: number, year: number): string {
  const m = String(month).padStart(2, "0");
  return `nuoc-thang-${m}-${year}.xlsx`;
}
