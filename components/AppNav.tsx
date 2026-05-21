"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

function NavLinkInner({ label, active }: { label: string; active: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending && (
        <span
          className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]"
          aria-hidden
        />
      )}
      <span className={pending ? "opacity-70" : undefined}>{label}</span>
      {active && !pending && (
        <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-[var(--primary)]" />
      )}
    </>
  );
}

export function AppNav({ items }: { items: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <div className="inline-flex w-full flex-wrap items-center justify-start gap-1 rounded-2xl border border-[var(--border)] bg-white/70 p-1 shadow-sm sm:w-auto sm:flex-nowrap">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={[
              "relative rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-150",
              active
                ? "bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                : "text-[var(--muted)] hover:bg-[var(--primary-soft)]/60 hover:text-[var(--primary-dark)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20",
            ].join(" ")}
          >
            <NavLinkInner label={item.label} active={active} />
          </Link>
        );
      })}
    </div>
  );
}
