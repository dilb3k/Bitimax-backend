'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { botLink } from '@/lib/api';
import { Logo, LogoMark } from './Logo';
import { MobileNav } from './MobileNav';

/**
 * Reads the display-only companion cookie the login flow writes alongside the session.
 *
 * The session itself is httpOnly and unreadable here on purpose. This cookie holds a name and
 * a role and decides exactly one thing — whether the header says "Kirish" or "Kabinet". Every
 * real permission decision is made by the backend against the signed token, so nothing breaks
 * (and nothing is granted) if a user edits it.
 */
export function useSessionDisplay() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  // Re-read on every navigation: signing in and signing out are client-side transitions, and
  // a header stuck on "Kirish" after a successful login reads as a failed login.
  const pathname = usePathname();

  useEffect(() => {
    try {
      const match = document.cookie.split('; ').find((row) => row.startsWith('bx_user='));
      // Clearing on absence matters as much as setting on presence — after a logout the
      // cookie is gone and the header has to fall back to the signed-out state.
      setUser(match ? JSON.parse(decodeURIComponent(match.slice('bx_user='.length))) : null);
    } catch {
      // A malformed cookie just means the header shows the signed-out state.
    }
  }, [pathname]);

  return user;
}

export function Header() {
  const user = useSessionDisplay();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur-md">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3">Asosiy qismga o‘tish</a>
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo priority />
          <span className="hidden text-xs text-faint sm:inline">Raqamli bozor</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/#katalog" className="hidden px-3 py-2 text-sm text-muted hover:text-ink sm:block">
            Katalog
          </Link>
          <Link href="/kod" className="hidden px-3 py-2 text-sm text-muted hover:text-ink sm:block">
            Kod bilan
          </Link>
          <Link href="/kabinet/yangi" className="hidden items-center gap-1 px-3 py-2 text-sm font-semibold text-accent lg:flex">+ E’lon berish</Link>
          <ThemeToggle />
          <Link href={user ? '/kabinet' : '/kirish'} className="hidden btn-accent px-3.5 py-2 text-sm sm:inline-flex">
            {user ? 'Kabinet' : 'Kirish'}
          </Link>
          <MobileNav authed={Boolean(user)} />
        </nav>
      </div>
    </header>
  );
}

function ThemeToggle() {
  // Starts null so the button renders nothing theme-specific until the client has read the
  // stored preference — otherwise the server-rendered icon can contradict the applied theme.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('bitmax-theme', next ? 'dark' : 'light');
    } catch {
      /* private mode — the choice just won't persist */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}
      className="rounded-lg border border-line p-2 text-muted transition hover:bg-raised hover:text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6L17 17M7 7L5.4 5.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

export function Footer() {
  return (
    <footer className="mt-8 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="mb-2 flex items-center gap-2.5">
              <LogoMark size={26} />
              <p className="font-display text-lg font-bold text-ink">Bitmax</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Raqamli savdo uchun kafil. E’lon, to‘lov va bitimni boshqarish — web va Telegram’da.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-faint">Havolalar</p>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/#katalog" className="text-muted hover:text-ink">
                    Katalog
                  </Link>
                </li>
                <li>
                  <Link href="/kod" className="text-muted hover:text-ink">
                    Kod bilan sotib olish
                  </Link>
                </li>
                <li>
                  <Link href="/kabinet" className="text-muted hover:text-ink">
                    Kabinet
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-faint">Aloqa</p>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href={botLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-ink"
                  >
                    Telegram bot
                  </a>
                </li>
                <li>
                  <a
                    href="https://t.me/bitimax_admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-ink"
                  >
                    Qo‘llab-quvvatlash
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-xs text-faint">
          © {new Date().getFullYear()} Bitmax. Platformadan tashqaridagi kelishuvlarga tizim
          javob bermaydi.
        </p>
      </div>
    </footer>
  );
}
