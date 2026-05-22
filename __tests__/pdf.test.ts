import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { generateInvoicePdf } from "../lib/pdf";

test("generateInvoicePdf returns a readable one-page PDF", async () => {
  const pdf = await generateInvoicePdf({
    invoiceCode: "HD-202605-HH00001",
    householdCode: "HH00001",
    meterCode: "DH00001",
    residentName: "Nguyễn Văn A",
    address: "Thôn 1, xã Minh Khai, huyện Hoài Đức, Hà Nội",
    periodLabel: "Tháng 5/2026",
    oldReading: 1234,
    newReading: 1289,
    usageM3: 55,
    unitPrice: 15000,
    totalAmount: 825000,
    transferNote: "DH00001 T5-2026",
  });

  assert.equal(pdf.subarray(0, 5).toString("utf8"), "%PDF-");
  assert.ok(pdf.length > 100_000);

  const doc = await PDFDocument.load(pdf);
  assert.equal(doc.getPageCount(), 1);
});
