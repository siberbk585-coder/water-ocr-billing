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
