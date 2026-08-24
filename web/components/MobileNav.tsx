'use client';

import Link from 'next/link';
import { useState } from 'react';
import { botLink } from '@/lib/api';

/**
 * Below the `sm` breakpoint, `Header`'s nav links (`Katalog`, `Qanday ishlaydi`) disappear with
 * no replacement — on mobile they were only reachable by manually scrolling. This restores
 * access via a hamburger button that drops down the same links plus the bot CTA.
 */
export function MobileNav({ authed = false }: { authed?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'}
        aria-expanded={open}
        className="rounded-lg border border-line p-2 text-muted transition hover:bg-raised hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? (
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open && (
        <div className="surface absolute right-0 top-full mt-2 w-48 overflow-hidden py-1 shadow-lg">
          <Link
            href="/#katalog"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink hover:bg-raised"
          >
            Katalog
          </Link>
          <Link
            href="/kod"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink hover:bg-raised"
          >
            Kod bilan sotib olish
          </Link>
          <Link
            href={authed ? '/kabinet' : '/kirish'}
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink hover:bg-raised"
          >
            {authed ? 'Kabinet' : 'Kirish'}
          </Link>
          <a
            href={botLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-2.5 text-sm text-accent hover:bg-raised"
          >
            Botni ochish
          </a>
        </div>
      )}
    </div>
  );
}
