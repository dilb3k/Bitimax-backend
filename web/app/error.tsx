'use client';

import { useEffect } from 'react';

/**
 * Last-resort screen for an unhandled render error. It shows what to do next and nothing
 * about what went wrong: `error.message` from a server component can carry internals, so only
 * the digest (an opaque id that matches a server log line) is ever put on screen.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Bitmax] render error:', error.digest || error.message);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto flex max-w-lg flex-col items-center px-5 py-20 text-center sm:px-8">
      <p className="text-4xl" aria-hidden="true">
        ⚠️
      </p>
      <h1 className="mt-4 text-2xl font-bold text-ink">Nimadir noto‘g‘ri ketdi</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Sahifani yuklab bo‘lmadi. Bu pulingizga ta’sir qilmaydi — barcha bitimlar serverda
        saqlanadi.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={reset} className="btn-accent">
          Qaytadan urinish
        </button>
        <a href="/" className="btn-ghost">
          Bosh sahifa
        </a>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-faint">Xato kodi: {error.digest}</p>}
    </main>
  );
}
