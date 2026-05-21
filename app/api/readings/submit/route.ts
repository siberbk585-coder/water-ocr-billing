import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitManualReading } from "@/lib/readings";
import { z } from "zod";

export const runtime = "nodejs";

/** Có file ảnh → n8n rồi DB; không ảnh → chỉ DB (một request). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.householdId) {
    return NextResponse.json({ error: "Chưa đăng nhập hoặc chưa gắn hộ dân" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("image") as File | null;
  const periodId = form.get("periodId") as string | null;
  const valueRaw = form.get("confirmedValue") as string | null;

  const parsed = z.coerce.number().positive().safeParse(valueRaw);
  if (!periodId || !parsed.success) {
    return NextResponse.json({ error: "Thiếu kỳ hoặc chỉ số không hợp lệ" }, { status: 400 });
  }

  try {
    let imageBuffer: Buffer | undefined;
    let fileExt: string | undefined;
    if (file && file.size > 0) {
      imageBuffer = Buffer.from(await file.arrayBuffer());
      fileExt = file.name.split(".").pop() || "jpg";
    }

    const reading = await submitManualReading({
      householdId: session.householdId,
      periodId,
      confirmedValue: parsed.data,
      imageBuffer,
      fileExt,
      actorId: session.id,
    });
    return NextResponse.json({
      ok: true,
      readingId: reading.id,
      confirmedValue: reading.confirmedValue,
      usageM3: reading.usageM3,
      confirmedAt: reading.confirmedAt?.toISOString() ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không lưu được";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
