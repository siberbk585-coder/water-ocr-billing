import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { appTitle, userRoleLabel } from "@/lib/vi";

export function AppShell({
  user,
  children,
  nav,
}: {
  user: SessionUser;
  children: React.ReactNode;
  nav: { href: string; label: string }[];
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-white shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-tight text-[var(--foreground)]">
                  {appTitle}
                </span>
                <span className="block text-xs text-[var(--muted)] group-hover:text-[var(--foreground)]">
                  Quản lý ghi chỉ số, hóa đơn, thanh toán
                </span>
              </span>
            </Link>

            <nav className="w-full sm:w-auto">
              <div className="inline-flex w-full flex-wrap items-center justify-start gap-1 rounded-2xl border border-[var(--border)] bg-white/70 p-1 shadow-sm sm:w-auto sm:flex-nowrap">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="flex items-center gap-3 text-sm">
              <div className="hidden min-w-0 sm:block">
                <div className="truncate font-semibold text-[var(--foreground)]">{user.name}</div>
                <div className="text-xs text-[var(--muted)]">{userRoleLabel(user.role)}</div>
              </div>

              <span className="badge bg-[var(--primary-soft)] text-[var(--primary-dark)] sm:hidden">
                {userRoleLabel(user.role)}
              </span>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="btn btn-secondary px-3 py-1.5 text-sm font-semibold"
                >
                  Đăng xuất
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-7">{children}</main>
    </div>
  );
}
