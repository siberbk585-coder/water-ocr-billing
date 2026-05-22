import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const MARGIN = 48;
const PAGE_W = 595;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Helvetica WinAnsi — bỏ dấu để tránh lỗi font khi in. */
function pdfAscii(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^\x20-\x7E]/g, "?");
}

function pdfMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")} VND`;
}

export type InvoicePdfData = {
  invoiceCode: string;
  householdCode: string;
  meterCode: string;
  residentName: string;
  address: string;
  periodLabel: string;
  oldReading: number;
  newReading: number;
  usageM3: number;
  unitPrice: number;
  totalAmount: number;
};

function issuerName(): string {
  return pdfAscii(
    process.env.INVOICE_ISSUER_NAME?.trim() || "BAN QUAN LY — THU TIEN NUOC"
  );
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const muted = rgb(0.35, 0.35, 0.38);
  const border = rgb(0.82, 0.84, 0.86);
  const accent = rgb(0.05, 0.45, 0.38);

  let y = 800;

  const text = (
    str: string,
    opts: { size?: number; bold?: boolean; x?: number; color?: ReturnType<typeof rgb> } = {}
  ) => {
    const size = opts.size ?? 11;
    page.drawText(pdfAscii(str), {
      x: opts.x ?? MARGIN,
      y,
      size,
      font: opts.bold ? bold : font,
      color: opts.color ?? rgb(0.12, 0.12, 0.14),
    });
    y -= size + 6;
  };

  const hr = () => {
    y -= 4;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 1,
      color: border,
    });
    y -= 14;
  };

  text(issuerName(), { size: 14, bold: true, color: accent });
  text("HOA DON TIEN NUOC", { size: 11, color: muted });
  y -= 6;
  hr();

  const colMid = MARGIN + CONTENT_W / 2;
  const leftY = y;
  text(`Ho dan: ${data.residentName}`, { bold: true });
  text(`Ma ho (MKH): ${data.householdCode}`);
  text(`Dong ho: ${data.meterCode}`);
  text(`Dia chi: ${data.address.slice(0, 72)}`, { size: 10 });

  y = leftY;
  text(`Ma hoa don: ${data.invoiceCode}`, { x: colMid, bold: true });
  text(`Ky tinh cuoc: ${data.periodLabel}`, { x: colMid });
  text(`Ngay lap: ${new Date().toLocaleDateString("en-GB")}`, { x: colMid, size: 10 });

  y = Math.min(y, leftY) - 24;
  hr();

  const tableTop = y;
  const rowH = 22;
  const cols = [MARGIN, MARGIN + 280, MARGIN + 360, PAGE_W - MARGIN];

  page.drawRectangle({
    x: MARGIN,
    y: tableTop - rowH,
    width: CONTENT_W,
    height: rowH,
    color: rgb(0.94, 0.97, 0.96),
    borderColor: border,
    borderWidth: 1,
  });

  const headerLabels = ["Noi dung", "Don vi", "So luong", "Thanh tien"];
  const headerX = [cols[0] + 8, cols[1] + 8, cols[2] + 8, cols[3] - 108];
  for (let i = 0; i < headerLabels.length; i++) {
    page.drawText(pdfAscii(headerLabels[i]), {
      x: headerX[i],
      y: tableTop - rowH + 7,
      size: 10,
      font: bold,
      color: muted,
    });
  }

  y = tableTop - rowH * 2;
  const rows: [string, string, string, string][] = [
    ["Chi so cu (CSC)", "m3", String(data.oldReading), "—"],
    ["Chi so moi (CSM)", "m3", String(data.newReading), "—"],
    [
      `Tieu thu x ${pdfMoney(data.unitPrice)}/m3`,
      "m3",
      String(data.usageM3),
      pdfMoney(data.totalAmount),
    ],
  ];

  for (const [label, unit, qty, amount] of rows) {
    page.drawRectangle({
      x: MARGIN,
      y: y - rowH + 2,
      width: CONTENT_W,
      height: rowH,
      borderColor: border,
      borderWidth: 0.5,
    });
    page.drawText(pdfAscii(label), { x: cols[0] + 8, y: y - 14, size: 10, font });
    page.drawText(pdfAscii(unit), { x: cols[1] + 8, y: y - 14, size: 10, font });
    page.drawText(pdfAscii(qty), { x: cols[2] + 8, y: y - 14, size: 10, font });
    page.drawText(pdfAscii(amount), { x: cols[3] - 108, y: y - 14, size: 10, font });
    y -= rowH;
  }

  y -= 8;
  const totalBoxH = 36;
  page.drawRectangle({
    x: MARGIN + CONTENT_W - 220,
    y: y - totalBoxH,
    width: 220,
    height: totalBoxH,
    color: rgb(0.92, 0.98, 0.96),
    borderColor: accent,
    borderWidth: 1.5,
  });
  page.drawText(pdfAscii("TONG CONG PHAI THU"), {
    x: MARGIN + CONTENT_W - 210,
    y: y - 14,
    size: 10,
    font: bold,
    color: accent,
  });
  page.drawText(pdfMoney(data.totalAmount), {
    x: MARGIN + CONTENT_W - 210,
    y: y - 28,
    size: 14,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= totalBoxH + 20;
  hr();

  text("Hinh thuc thanh toan:", { bold: true, size: 10 });
  text("- Tien mat tai van phong Ban quan ly.", { size: 10 });
  text("- Chuyen khoan: ghi ro ma ho va ky tren noi dung.", { size: 10 });

  const bankName = process.env.BANK_ACCOUNT_NAME?.trim();
  const bankNo = process.env.BANK_ACCOUNT?.trim();
  if (bankName && bankNo) {
    text(`So TK: ${bankNo} — ${bankName}`, { size: 10 });
  }

  text(
    "Hoa don dien tu — in hoac luu PDF de doi chieu. Khong co ma QR tren phieu nay.",
    { size: 9, color: muted }
  );

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
