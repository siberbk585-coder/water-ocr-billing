export function calculateUsage(confirmed: number, oldReading: number): number {
  return Math.max(0, confirmed - oldReading);
}

export function calculateTotal(usageM3: number, unitPrice: number): number {
  return Math.round(usageM3 * unitPrice);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function previewBillingRow(
  oldReading: number,
  csm: number | null,
  unitPrice: number
): { usageM3: number | null; totalAmount: number | null; totalLabel: string } {
  if (csm == null || Number.isNaN(csm)) {
    return { usageM3: null, totalAmount: null, totalLabel: "—" };
  }
  const usageM3 = calculateUsage(csm, oldReading);
  if (usageM3 <= 0) {
    return { usageM3: 0, totalAmount: 0, totalLabel: "—" };
  }
  const totalAmount = calculateTotal(usageM3, unitPrice);
  return { usageM3, totalAmount, totalLabel: formatCurrency(totalAmount) };
}
