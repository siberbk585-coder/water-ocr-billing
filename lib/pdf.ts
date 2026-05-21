import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCurrency } from "./billing";

export type InvoicePdfData = {
  invoiceCode: string;
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

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = 780;

  const line = (text: string, size = 12, useBold = false) => {
    page.drawText(text, { x: 50, y, size, font: useBold ? bold : font, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 8;
  };

  line("HOA DON TIEN NUOC", 18, true);
  line(`Ma hoa don: ${data.invoiceCode}`);
  line(`Ky: ${data.periodLabel}`);
  line(`Dong ho: ${data.meterCode}`);
  line(`Ho dan: ${data.residentName}`);
  line(`Dia chi: ${data.address}`);
  y -= 10;
  line(`Chi so cu: ${data.oldReading} m3`);
  line(`Chi so moi: ${data.newReading} m3`);
  line(`Tieu thu: ${data.usageM3} m3`);
  line(`Don gia: ${formatCurrency(data.unitPrice)}/m3`);
  line(`Tong tien: ${formatCurrency(data.totalAmount)}`, 14, true);
  line("Huong dan: Thanh toan tai van phong BQL hoac chuyen khoan theo thong bao.", 10);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
