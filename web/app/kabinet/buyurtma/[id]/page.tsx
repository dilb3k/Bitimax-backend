import type { Metadata } from 'next';
import { OrderView } from '@/components/cabinet/OrderView';

export const metadata: Metadata = { title: 'Buyurtma', robots: { index: false, follow: false } };

export default function OrderPage({ params }: { params: { id: string } }) {
  return <OrderView key={params.id} orderId={params.id} />;
}
