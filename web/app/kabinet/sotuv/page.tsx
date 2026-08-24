import type { Metadata } from 'next';
import { SellView } from '@/components/cabinet/SellView';

export const metadata: Metadata = { title: 'Sotuv', robots: { index: false, follow: false } };

export default function SellPage() {
  return <SellView />;
}
