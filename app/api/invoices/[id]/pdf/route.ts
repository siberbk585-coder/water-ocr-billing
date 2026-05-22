import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getInvoiceForViewer } from "@/lib/invoiceAccess";
import { isExternalPdfUrl } from "@/lib/invoicePdf";
import { readStorageFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const invoice = await getInvoiceForViewer(id, session);
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isExternalPdfUrl(invoice.pdfPath)) {
    return NextResponse.redirect(invoice.pdfPath);
  }

  const buffer = await readStorageFile(invoice.pdfPath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.household.householdCode}.pdf"`,
      "Cache-Control": "private, max-age=3600",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
