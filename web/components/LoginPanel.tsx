'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loading, Notice, Spinner } from './ui';

type Phase = 'starting' | 'waiting' | 'approved' | 'denied' | 'expired' | 'error';

/**
 * Signs in by pairing with the bot: the browser asks for a request, the account holder taps
 * "Ha, bu men" inside Telegram, and this panel picks up the session.
 *
 * The six-character code is the point of the screen. Approving a login is the moment a
 * phishing link pays off, so the bot asks the user to compare a code that only the real
 * request could have produced, instead of asking them to trust that they are the reason a
 * prompt appeared.
 */
export function LoginPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>('starting');
  const [pairCode, setPairCode] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [message, setMessage] = useState('');
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  /**
   * A login request is a server-side record with a rate limit attached, so it must be created
   * once per visit. React's development double-mount (and any re-render that re-runs the mount
   * effect) would otherwise open a second request and silently orphan the code already on
   * screen, leaving the user comparing a code the bot never mentions.
   */
  const startedRef = useRef(false);

  /**
   * Only a path on this site is an acceptable destination. Without this check, a link like
   * `/kirish?next=https://evil.example` would turn our own login into a credible redirect to
   * someone else's copy of it.
   */
  const nextPath = (() => {
    const raw = params.get('next') || '';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/kabinet';
  })();

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
  }, []);

  const start = useCallback(async () => {
    startedRef.current = true;
    stopPolling();
    setPhase('starting');
    setMessage('');
    try {
      const response = await fetch('/api/auth/start', { method: 'POST', credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Kirishni boshlab bo‘lmadi');
      setPairCode(data.pairCode);
      setDeepLink(data.deepLink);
      setPhase('waiting');
    } catch (error: any) {
      setMessage(error?.message || 'Kirishni boshlab bo‘lmadi');
      setPhase('error');
    }
  }, [stopPolling]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start();
    return stopPolling;
  }, [start, stopPolling]);

  useEffect(() => {
    if (phase !== 'waiting') return;

    pollTimer.current = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/poll', { credentials: 'same-origin' });
        const data = await response.json();

        if (data.status === 'approved') {
          stopPolling();
          setPhase('approved');
          router.replace(nextPath);
          router.refresh();
        } else if (data.status === 'denied' || data.status === 'expired' || data.status === 'blocked') {
          stopPolling();
          setMessage(data.error || '');
          setPhase(data.status === 'denied' ? 'denied' : 'expired');
        }
      } catch {
        // A dropped poll is not a failed login — the next tick retries.
      }
    }, 2000);

    return stopPolling;
  }, [phase, nextPath, router, stopPolling]);

  if (phase === 'starting') return <Loading label="Kirish so‘rovi tayyorlanmoqda…" />;

  if (phase === 'approved') {
    return (
      <div className="flex items-center justify-center gap-3 py-14 text-ok">
        <Spinner />
        <span className="text-sm">Kirdingiz — kabinet ochilmoqda…</span>
      </div>
    );
  }

  if (phase === 'error' || phase === 'expired' || phase === 'denied') {
    const text =
      phase === 'denied'
        ? 'Kirish botda rad etildi.'
        : phase === 'expired'
          ? 'So‘rov muddati tugadi.'
          : message || 'Xatolik yuz berdi.';

    return (
      <div className="surface p-6 text-center sm:p-8">
        <Notice tone="warn">{text}</Notice>
        <button type="button" onClick={start} className="btn-accent mt-5">
          Qaytadan urinish
        </button>
      </div>
    );
  }

  return (
    <div className="surface p-6 sm:p-8">
      <ol className="space-y-5">
        <Step number={1} title="Telegramni oching">
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent mt-3 w-full sm:w-auto"
          >
            Telegramda tasdiqlash
          </a>
        </Step>

        <Step number={2} title="Kodni solishtiring">
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Botdagi xabarda aynan shu kod turishi kerak. Boshqa kod ko‘rsangiz —{' '}
            <strong className="font-semibold text-ink">“Yo‘q”</strong> ni bosing.
          </p>
          <p className="tnum mt-3 font-mono text-3xl font-bold tracking-[0.18em] text-ink">{pairCode}</p>
        </Step>

        <Step number={3} title="Shu sahifada qoling">
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <Spinner size={15} /> Tasdiqlash kutilmoqda…
          </p>
        </Step>
      </ol>

      <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-faint">
        Bitimax parol so‘ramaydi. Kirish faqat botdagi tasdiq orqali amalga oshadi — shuning uchun
        parolingiz o‘g‘irlanishi ham mumkin emas.
      </p>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="tnum mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-ink">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        {children}
      </div>
    </li>
  );
}
