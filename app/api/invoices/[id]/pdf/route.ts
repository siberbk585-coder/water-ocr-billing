import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readStorageFile } from "@/lib/storage";
import { UserRole } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { household: true },
  });
  if (!invoice?.pdfPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    session.role !== UserRole.ADMIN &&
    invoice.householdId !== session.householdId
  ) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const buffer = await readStorageFile(invoice.pdfPath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.id}.pdf"`,
    },
  });
}
