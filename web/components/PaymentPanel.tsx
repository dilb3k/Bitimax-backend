'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/cabinet';
import { Countdown, CopyButton, ErrorState, Loading, Notice, Spinner, formatDateTime } from './ui';

type Status = Awaited<ReturnType<typeof api.transactionStatus>>;

/**
 * The payment screen: the exact amount to transfer, the card to send it to, and a clock.
 *
 * Confirmation is not something the browser can decide — it arrives as a bank SMS on the
 * platform's side — so this polls until the backend says the money landed, then hands the
 * buyer straight to the order where the credentials wait.
 */
export function PaymentPanel({ transactionId }: { transactionId: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.transactionStatus(transactionId);
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Holatni olib bo‘lmadi');
    }
  }, [transactionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!status || status.status !== 'pending_payment') return;
    timer.current = setInterval(load, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [status, load]);

  if (error && !status) return <ErrorState message={error} onRetry={load} />;
  if (!status) return <Loading label="To‘lov ma’lumotlari yuklanmoqda…" />;

  if (status.status === 'paid' || status.status === 'completed') {
    return (
      <div className="surface p-6 text-center sm:p-8">
        <p className="text-3xl" aria-hidden="true">
          ✅
        </p>
        <h2 className="mt-3 text-xl font-bold text-ink">To‘lov tasdiqlandi</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Pul kafilda saqlanmoqda. Akkaunt ma’lumotlarini oching, tekshiring — va faqat shundan
          keyin bitimni tasdiqlang.
        </p>
        {status.orderId && (
          <Link href={`/kabinet/buyurtma/${status.orderId}`} className="btn-accent mt-6">
            Buyurtmani ochish
          </Link>
        )}
      </div>
    );
  }

  if (status.status !== 'pending_payment') {
    return (
      <div className="surface p-6 sm:p-8">
        <Notice tone="warn">
          Bu buyurtma yopilgan (holat: {status.status}). Vaqt tugagan bo‘lsa pulingiz
          o‘tkazilmagan — mahsulotni qaytadan band qilishingiz mumkin.
        </Notice>
        <Link href="/#katalog" className="btn-ghost mt-5">
          Katalogga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-faint">Mahsulot</p>
            <p className="mt-1 truncate font-semibold text-ink">{status.title}</p>
          </div>
          <div className="shrink-0 rounded-lg bg-raised px-3 py-2 text-center">
            <p className="text-xs text-faint">Qoldi</p>
            <p className="text-ink">
              <Countdown to={status.expireAt} onDone={load} />
            </p>
          </div>
        </div>
      </div>

      <div className="surface p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider text-faint">Aynan shu summani o‘tkazing</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="tnum font-mono text-3xl font-bold text-ink">{status.uniqueAmount}</p>
          <CopyButton value={String(status.uniqueAmount)} />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-warn">
          Summaning oxirgi raqamlari aynan sizning buyurtmangizni aniqlaydi. Boshqa summa
          o‘tkazsangiz, to‘lov avtomatik tanilmaydi.
        </p>
      </div>

      {status.card ? (
        <div className="surface p-5 sm:p-6">
          <p className="text-xs uppercase tracking-wider text-faint">Karta</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="tnum font-mono text-xl font-semibold tracking-wide text-ink">
              {status.card.number.replace(/(.{4})/g, '$1 ').trim()}
            </p>
            <CopyButton value={status.card.number} />
          </div>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <Row label="Egasi" value={status.card.holder} />
            <Row label="Bank" value={status.card.bank} />
            <Row label="Muddat" value={`${formatDateTime(status.expireAt)} gacha`} />
          </dl>
        </div>
      ) : (
        <Notice tone="warn">
          To‘lov kartasi sozlanmagan — administrator bilan bog‘laning.
        </Notice>
      )}

      <div className="flex items-center gap-2.5 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-muted">
        <Spinner size={16} />
        To‘lov kutilmoqda — bank xabari kelishi bilan bu sahifa o‘zi yangilanadi.
      </div>

      <p className="text-xs leading-relaxed text-faint">
        Vaqt tugasa bandlik bekor bo‘ladi va sizga xabar beramiz. Pulingiz o‘tkazilmagan bo‘lsa —
        xavfsiz; kechikib o‘tkazilgan to‘lov esa yo‘qolmaydi, administrator qo‘lda hal qiladi.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-faint">{label}</dt>
      <dd className="text-right text-muted">{value}</dd>
    </div>
  );
}
