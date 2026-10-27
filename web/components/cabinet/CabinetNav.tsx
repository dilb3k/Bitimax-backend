"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/cabinet";
import { Icon, IconName } from "../Icon";
import { Notice, Spinner } from "../ui";
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/kabinet", label: "Buyurtmalar", icon: "bag" },
  { href: "/kabinet/sotuv", label: "Sotuv", icon: "grid" },
  { href: "/kabinet/hamyon", label: "Hamyon", icon: "wallet" },
  { href: "/kabinet/sozlamalar", label: "Sozlamalar", icon: "settings" },
];
export function CabinetNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
      router.replace("/");
      router.refresh();
    } catch {
      setError("Chiqib bo‘lmadi. Qayta urinib ko‘ring.");
      setBusy(false);
    }
  }
  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="mb-5 hidden lg:block">
        <p className="eyebrow">SHAXSIY KABINET</p>
        <p className="mt-2 text-sm text-muted">Savdolaringiz nazoratda.</p>
      </div>
      <nav
        aria-label="Kabinet bo‘limlari"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:static lg:grid-cols-1 lg:gap-1.5 lg:rounded-2xl lg:border lg:p-2"
      >
        {TABS.map((tab) => {
          const active =
            tab.href === "/kabinet"
              ? pathname === tab.href || pathname.includes("/buyurtma/")
              : tab.href.endsWith("/sotuv")
                ? ["/sotuv", "/yangi", "/bitim"].some((p) =>
                    pathname.startsWith("/kabinet" + p),
                  )
                : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium lg:min-h-[48px] lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-raised hover:text-ink"}`}
            >
              <Icon name={tab.icon} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-between gap-3 lg:mt-5 lg:flex-col lg:items-stretch">
        <Link href="/kabinet/yangi" className="btn-accent text-sm">
          <Icon name="plus" width={18} /> E’lon berish
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="btn-ghost text-sm"
        >
          {busy ? <Spinner size={16} /> : <Icon name="logout" width={16} />}{" "}
          Chiqish
        </button>
      </div>
      {error && (
        <div className="mt-3">
          <Notice tone="warn">{error}</Notice>
        </div>
      )}
    </aside>
  );
}
