import type { Metadata } from 'next';
import { OrdersView } from '@/components/cabinet/OrdersView';

export const metadata: Metadata = { title: 'Buyurtmalarim', robots: { index: false, follow: false } };

export default function OrdersPage() {
  return <OrdersView />;
}
