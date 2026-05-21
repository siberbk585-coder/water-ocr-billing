import { requireAdmin } from "@/lib/guards";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { adminNav } from "@/lib/vi";

export default async function AdminHouseholdsPage() {
  const user = await requireAdmin();

  const households = await prisma.household.findMany({
    take: 50,
    orderBy: { meterCode: "asc" },
    include: { priceGroup: true, user: true },
  });
  const total = await prisma.household.count();

  return (
    <AppShell user={user} nav={[...adminNav]}>
      <h1 className="mb-2 text-2xl font-bold">Hộ dân</h1>
      <p className="mb-4 text-sm text-slate-600">Tổng {total} hộ (hiển thị 50 đầu)</p>
      <div className="overflow-x-auto card p-0">
        <table className="table-modern">
          <thead className="border-b bg-slate-50/70 text-left">
            <tr>
              <th>Mã ĐH</th>
              <th>Tên</th>
              <th>Địa chỉ</th>
              <th>Nhóm giá</th>
              <th>Tài khoản</th>
            </tr>
          </thead>
          <tbody>
            {households.map((h) => (
              <tr key={h.id} className="border-b">
                <td className="font-mono">{h.meterCode}</td>
                <td>{h.residentName}</td>
                <td>{h.address}</td>
                <td>{h.priceGroup.name}</td>
                <td>{h.user?.phone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
