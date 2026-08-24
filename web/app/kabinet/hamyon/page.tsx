import type { Metadata } from 'next';
import { WalletView } from '@/components/cabinet/WalletView';

export const metadata: Metadata = { title: 'Hamyon', robots: { index: false, follow: false } };

export default function WalletPage() {
  return <WalletView />;
}
