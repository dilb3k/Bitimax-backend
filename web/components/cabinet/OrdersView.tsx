'use client';

import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/cabinet';
import { formatUzs, timeAgo } from '@/lib/api';
import { Badge, Countdown, EmptyState, ErrorState, Loading, useAsync } from '../ui';

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'accent' | 'muted'> = {
  holding: 'accent',
  released: 'ok',
  refunded: 'muted',
  partial_refunded: 'muted',
  disputed: 'warn',
};

export function OrdersView() {
  const { data, error, loading, reload } = useAsync(() => api.orders());

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const orders = data?.orders ?? [];
  const pending = data?.pending ?? [];

  if (orders.length === 0 && pending.length === 0) {
    return (
      <EmptyState
        title="Hali buyurtmalar yo‘q"
        hint="Katalogdan akkaunt tanlang yoki sotuvchi bergan bitim kodini kiriting — pul kafilda saqlanadi."
        action={
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link href="/#katalog" className="btn-accent text-sm">
              Katalogni ochish
            </Link>
            <Link href="/kod" className="btn-ghost text-sm">
              Kod bilan sotib olish
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-faint">
            To‘lov kutilmoqda
          </h2>
          <ul className="space-y-3">
            {pending.map((item) => (
              <li key={item.id} className="surface flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.title}</p>
                  <p className="tnum mt-0.5 text-sm text-muted">{item.uniqueAmount} UZS</p>
                </div>
                {item.status === 'pending_payment' ? (
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-muted">
                      <Countdown to={item.expireAt} />
                    </span>
                    <Link href={`/tolov/${item.id}`} className="btn-accent px-3 py-2 text-sm">
                      To‘lash
                    </Link>
                  </div>
                ) : (
                  <Badge tone="muted">Muddati o‘tgan</Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {orders.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-faint">Buyurtmalar</h2>
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/kabinet/buyurtma/${order.id}`}
                  className="surface flex items-center gap-4 p-4 transition hover:border-accent/40"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-raised">
                    {order.image && (
                      <Image
                        src={order.image}
                        alt=""
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{order.title}</p>
                    <p className="mt-0.5 text-xs text-faint">{timeAgo(order.boughtAt)}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="tnum font-semibold text-ink">{formatUzs(order.amount)}</p>
                    <div className="mt-1">
                      <Badge tone={STATUS_TONE[order.status] || 'muted'}>{order.statusLabel}</Badge>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
