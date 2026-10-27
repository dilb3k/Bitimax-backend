'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/cabinet';
import { Product, PublicPolicy, formatUzs } from '@/lib/api';
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
  const [policy, setPolicy] = useState<PublicPolicy | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [response, policyResponse] = await Promise.all([
          fetch(`/api/products/${encodeURIComponent(productId)}`, { signal: AbortSignal.timeout(25000) }),
          fetch('/api/products/policy', { signal: AbortSignal.timeout(25000) }),
        ]);
        if (policyResponse.ok && alive) setPolicy(await policyResponse.json());
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
          policy ? `Mahsulot ${policy.paymentWindowMinutes} daqiqaga siz uchun band qilinadi.` : 'To‘lov sahifasida mahsulot bandligi muddati ko‘rsatiladi.',
          policy?.paymentProvider === 'sms' ? 'To‘lov sahifasidagi aniq summani ko‘rsatilgan kartaga yuboring.' : 'To‘lov sahifasidagi havola orqali to‘lang. Karta ma’lumotlari Bitmax’ga kiritilmaydi.',
          'To‘lov tasdiqlangach, ma’lumotlarni ochasiz va tekshirasiz.',
          policy ? `Tekshirgach tasdiqlaysiz. Ma’lumot ochilgandan ${policy.autoReleaseHours} soat keyin bitim avtomatik yakunlanadi.` : 'Tekshirgach tasdiqlaysiz. Avtomatik yakunlash muddatini buyurtmada kuzating.',
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

      <SubmitButton busy={busy} disabled={product.status !== 'active'} onClick={start} className="btn-accent mt-7 w-full">
        {product.status !== 'active' ? (product.status === 'sold' ? 'Mahsulot sotilgan' : 'Mahsulot hozir band') : busy ? 'Ochilmoqda…' : 'Band qilish va to‘lovga o‘tish'}
      </SubmitButton>

      <p className="mt-3 text-center text-xs text-faint">
        Bu tugma pul yechmaydi. To‘lovni keyingi sahifada amalga oshirasiz.
      </p>
    </>
  );
}
