/** `pdfPath` là URL n8n/Drive (http), không phải đường dẫn file local. */
export function isExternalPdfUrl(pdfPath: string): boolean {
  return /^https?:\/\//i.test(pdfPath);
}

/** URL để xem/tải PDF trong app (proxy local hoặc link n8n). */
export function getInvoicePdfViewUrl(invoice: { id: string; pdfPath: string }): string {
  if (isExternalPdfUrl(invoice.pdfPath)) return invoice.pdfPath;
  return `/api/invoices/${invoice.id}/pdf`;
}
