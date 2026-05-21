import { NextResponse } from "next/server";
import { login, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(8),
  password: z.string().min(4),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const user = await login(parsed.data.phone, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Sai số điện thoại hoặc mật khẩu" }, { status: 401 });
  }

  await setSessionCookie(user);
  return NextResponse.json({ ok: true, role: user.role });
}
