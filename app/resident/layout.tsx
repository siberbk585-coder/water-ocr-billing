import { AppShell } from "@/components/AppShell";
import { requireResident } from "@/lib/guards";
import { residentNav } from "@/lib/vi";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireResident();
  return (
    <AppShell user={user} nav={[...residentNav]}>
      {children}
    </AppShell>
  );
}
