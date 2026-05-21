import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitManualReading } from "@/lib/readings";
import { z } from "zod";

export const runtime = "nodejs";

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
  if (!file || !periodId || !parsed.success) {
    return NextResponse.json({ error: "Thiếu ảnh, kỳ hoặc chỉ số không hợp lệ" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const reading = await submitManualReading({
      householdId: session.householdId,
      periodId,
      confirmedValue: parsed.data,
      imageBuffer: buffer,
      fileExt: ext,
      actorId: session.id,
    });
    return NextResponse.json({
      ok: true,
      readingId: reading.id,
      confirmedValue: reading.confirmedValue,
      usageM3: reading.usageM3,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không lưu được";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
