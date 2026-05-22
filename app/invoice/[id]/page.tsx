import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getInvoiceForViewer } from "@/lib/invoiceAccess";
import { formatCurrency } from "@/lib/billing";
import { formatPeriod } from "@/lib/vi";
import { getInvoicePdfViewUrl } from "@/lib/invoicePdf";

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const invoice = await getInvoiceForViewer(id, session);
  if (!invoice) notFound();

  const pdfSrc = getInvoicePdfViewUrl(invoice);
  const backHref = session.role === "ADMIN" ? "/admin/invoices" : "/resident/invoices";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Hóa đơn PDF</h1>
          <p className="text-sm text-[var(--muted)]">
            {invoice.household.residentName} — {invoice.household.householdCode} —{" "}
            {formatPeriod(invoice.period.month, invoice.period.year)} —{" "}
            {formatCurrency(invoice.totalAmount)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={backHref} className="btn btn-secondary py-1.5 text-sm">
            ← Quay lại
          </Link>
          <a
            href={pdfSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary py-1.5 text-sm"
          >
            Mở tab mới
          </a>
          <a href={pdfSrc} download className="btn btn-secondary py-1.5 text-sm">
            Tải xuống
          </a>
        </div>
      </div>

      <div className="card flex-1 overflow-hidden p-0">
        <iframe
          title={`Hóa đơn ${invoice.household.householdCode}`}
          src={pdfSrc}
          className="h-[min(75vh,800px)] w-full border-0 bg-slate-100"
        />
      </div>
    </div>
  );
}
