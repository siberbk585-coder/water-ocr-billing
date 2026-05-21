/** Múi giờ VN cho tên file upload. */
const TZ = "Asia/Ho_Chi_Minh";

/** Ví dụ: 20260521_153045 */
export function timestampForFilename(date = new Date()): string {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const p = f.formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    p.find((x) => x.type === t)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}_${get("hour")}${get("minute")}${get("second")}`;
}

/** Ví dụ: 20260521_153045_reading_212001.jpg */
export function buildImageFilename(opts: {
  prefix?: string;
  code?: string;
  ext: string;
}): string {
  const ts = timestampForFilename();
  const prefix = (opts.prefix ?? "meter").replace(/[^\w.-]+/g, "_");
  const code = opts.code ? `_${opts.code.replace(/[^\w.-]+/g, "_")}` : "";
  const ext = opts.ext.replace(/^\./, "") || "jpg";
  return `${ts}_${prefix}${code}.${ext}`;
}

/** ISO có offset VN cho field metadata gửi n8n. */
export function uploadedAtIso(date = new Date()): string {
  const f = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return f.format(date).replace(" ", "T") + "+07:00";
}
