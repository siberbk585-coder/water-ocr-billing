import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === UserRole.ADMIN) redirect("/admin/billing-sheet");
  redirect("/resident/submit-reading");
}
