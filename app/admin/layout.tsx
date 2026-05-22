import { AppShell } from "@/components/AppShell";
import { PeriodSettingsModal } from "@/components/PeriodSettingsModal";
import { requireAdmin } from "@/lib/guards";
import { getCurrentPeriodProgress } from "@/lib/routeProgress";
import { getSystemSettings } from "@/lib/settings";
import { adminNav } from "@/lib/vi";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [settings, progress] = await Promise.all([
    getSystemSettings(),
    getCurrentPeriodProgress(),
  ]);

  return (
    <AppShell
      user={user}
      nav={[...adminNav]}
      headerActions={
        <PeriodSettingsModal
          periodCloseDay={settings.periodCloseDay}
          periodId={progress?.period.id}
          periodOpen={progress?.period.status === "OPEN"}
        />
      }
    >
      {children}
    </AppShell>
  );
}
