'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/cabinet';
import { Spinner } from '../ui';

const TABS = [
  { href: '/kabinet', label: 'Buyurtmalarim' },
  { href: '/kabinet/sotuv', label: 'Sotuv' },
  { href: '/kabinet/hamyon', label: 'Hamyon' },
  { href: '/kabinet/sozlamalar', label: 'Sozlamalar' },
];

export function CabinetNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await logout();
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-3">
      {/* Scrolls rather than wraps on a narrow phone, so the tab row stays one line. */}
      <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Kabinet bo‘limlari">
        {TABS.map((tab) => {
          const active = tab.href === '/kabinet' ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition ${
                active
                  ? 'border-accent font-semibold text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-raised hover:text-ink disabled:opacity-50"
      >
        {busy ? <Spinner size={15} /> : null}
        Chiqish
      </button>
    </div>
  );
}
