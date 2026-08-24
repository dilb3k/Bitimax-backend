'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/cabinet';
import { Product, formatUzs } from '@/lib/api';
import { ErrorState, Loading, Notice, SubmitButton } from './ui';

/**
 * Confirmation step between the catalog and the payment screen.
 *
 * Creating the purchase reserves the listing for ten minutes, which takes it off the market
 * for everyone else — so it happens on a deliberate click, never on page load. Otherwise a
 * crawler, a prefetch or an idle open tab would quietly lock up the catalog.
 */
export function StartPurchase({ productId }: { productId: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(productId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Mahsulot topilmadi');
        if (alive) setProduct(data.product);
      } catch (err: any) {
        if (alive) setLoadError(err?.message || 'Mahsulot topilmadi');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [productId]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const payment = await api.buy(productId);
      router.replace(`/tolov/${payment.transactionId}`);
    } catch (err: any) {
      // 401 already redirects to the login screen inside the API client.
      if (!(err instanceof ApiError) || err.status !== 401) {
        setError(err?.message || 'Buyurtmani ochib bo‘lmadi');
      }
      setBusy(false);
    }
  }

  if (loading) return <Loading label="Mahsulot yuklanmoqda…" />;
  if (loadError || !product) return <ErrorState message={loadError || 'Mahsulot topilmadi'} />;

  return (
    <>
      <Link href={`/product/${productId}`} className="mb-6 inline-flex text-sm text-muted hover:text-ink">
        ← Mahsulotga qaytish
      </Link>

      <h1 className="text-2xl font-bold leading-snug text-ink">{product.title}</h1>
      <p className="tnum mt-3 text-3xl font-bold text-ink">{formatUzs(product.price)}</p>

      <ol className="mt-7 space-y-3 text-sm leading-relaxed text-muted">
        {[
          'Bandlik 10 daqiqaga ochiladi — bu vaqtda mahsulotni boshqa hech kim sotib ololmaydi.',
          'Sizga aynan bir xil bo‘lmagan summa beriladi — bank xabari shu summa orqali sizni tanidi.',
          'To‘lov tasdiqlangach, ma’lumotlarni ochasiz va tekshirasiz.',
          'Hammasi joyida bo‘lsa tasdiqlaysiz — pul faqat shundan keyin sotuvchiga o‘tadi.',
        ].map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="tnum mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-ink">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {error && (
        <div className="mt-6">
          <Notice tone="warn">{error}</Notice>
        </div>
      )}

      <SubmitButton busy={busy} onClick={start} className="btn-accent mt-7 w-full">
        {busy ? 'Ochilmoqda…' : 'Bandlik ochish va to‘lovga o‘tish'}
      </SubmitButton>

      <p className="mt-3 text-center text-xs text-faint">
        Bandlik 10 daqiqada tugaydi. To‘lov qilmasangiz hech narsa yechilmaydi.
      </p>
    </>
  );
}
