/** VietQR ảnh QR chuyển khoản — https://www.vietqr.io */

export type PaymentQrConfig = {
  bankBin: string;
  accountNo: string;
  accountName: string;
  template: string;
};

export function getPaymentQrConfig(): PaymentQrConfig | null {
  const bankBin = process.env.BANK_BIN?.trim();
  const accountNo = process.env.BANK_ACCOUNT?.trim();
  if (!bankBin || !accountNo) return null;

  return {
    bankBin,
    accountNo,
    accountName: process.env.BANK_ACCOUNT_NAME?.trim() || "THU PHI NUOC",
    template: process.env.BANK_QR_TEMPLATE?.trim() || "compact2",
  };
}

export function buildVietQrImageUrl(params: {
  amount: number;
  addInfo: string;
}): string | null {
  const cfg = getPaymentQrConfig();
  if (!cfg) return null;

  const q = new URLSearchParams();
  q.set("amount", String(Math.max(0, Math.round(params.amount))));
  q.set("addInfo", params.addInfo.slice(0, 100));
  q.set("accountName", cfg.accountName);

  return `https://img.vietqr.io/image/${cfg.bankBin}-${cfg.accountNo}-${cfg.template}.jpg?${q}`;
}

export async function fetchPaymentQrImage(params: {
  amount: number;
  addInfo: string;
}): Promise<Buffer | null> {
  const url = buildVietQrImageUrl(params);
  if (!url) return null;

  try {
    const configuredTimeout = Number(process.env.BANK_QR_TIMEOUT_MS ?? 5000);
    const timeoutMs =
      Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 5000;
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 100 ? buf : null;
  } catch {
    return null;
  }
}

/** Nội dung CK: mã đồng hồ + kỳ (vd `DH00001 T5-2026`). */
export function buildTransferNote(
  meterCode: string,
  periodMonth: number,
  periodYear: number
): string {
  const period = `T${periodMonth}-${periodYear}`;
  return `${meterCode} ${period}`.replace(/[^A-Za-z0-9 -]/g, "").trim().slice(0, 50);
}
