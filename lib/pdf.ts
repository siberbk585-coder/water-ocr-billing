import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  buildTransferNote,
  fetchPaymentQrImage,
  getPaymentQrConfig,
} from "./paymentQr";

/** Helvetica WinAnsi — bỏ dấu tiếng Việt để tránh lỗi khi xuất PDF. */
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
  periodMonth: number;
  periodYear: number;
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

  const line = (text: string, size = 12, useBold = false, x = 50) => {
    page.drawText(pdfAscii(text), {
      x,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 8;
  };

  line("HOA DON TIEN NUOC", 18, true);
  line(`Ma hoa don: ${data.invoiceCode}`);
  line(`Ky: ${data.periodLabel}`);
  line(`Ma ho: ${data.householdCode}`);
  line(`Dong ho: ${data.meterCode}`);
  line(`Ho dan: ${data.residentName}`);
  line(`Dia chi: ${data.address.slice(0, 60)}`);
  y -= 10;
  line(`Chi so cu: ${data.oldReading} m3`);
  line(`Chi so moi: ${data.newReading} m3`);
  line(`Tieu thu: ${data.usageM3} m3`);
  line(`Don gia: ${pdfMoney(data.unitPrice)}/m3`);
  line(`TONG TIEN: ${pdfMoney(data.totalAmount)}`, 14, true);

  const transferNote = buildTransferNote(data.meterCode, data.periodMonth, data.periodYear);
  const bank = getPaymentQrConfig();

  y -= 8;
  line("THANH TOAN CHUYEN KHOAN", 12, true);
  if (bank) {
    line(`Ngan hang (BIN): ${bank.bankBin}`);
    line(`So TK: ${bank.accountNo}`);
    line(`Chu TK: ${bank.accountName}`);
  }
  line(`So tien: ${pdfMoney(data.totalAmount)}`);
  line(`Noi dung CK: ${transferNote}`, 10);

  const qrBuf = await fetchPaymentQrImage({
    amount: data.totalAmount,
    addInfo: transferNote,
  });

  if (qrBuf) {
    try {
      const qrImage = await doc.embedJpg(qrBuf);
      const qrSize = 160;
      page.drawImage(qrImage, {
        x: 380,
        y: 480,
        width: qrSize,
        height: qrSize,
      });
      page.drawText("Quet ma QR", {
        x: 400,
        y: 465,
        size: 10,
        font: bold,
        color: rgb(0.15, 0.4, 0.2),
      });
    } catch {
      line("(Khong gan duoc anh QR vao PDF)", 9);
    }
  } else if (!bank) {
    line("Cau hinh BANK_BIN + BANK_ACCOUNT trong .env de co QR.", 9);
  } else {
    line("(Khong tai duoc anh VietQR — thu lai sau)", 9);
  }

  line("Hoac nop tien mat tai van phong BQL.", 10);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
