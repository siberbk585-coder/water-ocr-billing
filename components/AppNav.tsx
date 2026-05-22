"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

function NavLinkInner({ label, active }: { label: string; active: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending && (
        <span
          className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]"
          aria-hidden
        />
      )}
      <span className={pending ? "opacity-70" : undefined}>{label}</span>
      {active && !pending && (
        <span className="absolute inset-x-1.5 bottom-0.5 h-0.5 rounded-full bg-[var(--primary)]" />
      )}
    </>
  );
}

export function AppNav({ items }: { items: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <div className="inline-flex flex-nowrap items-center gap-0.5 py-0.5 sm:gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={[
              "relative shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm",
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
