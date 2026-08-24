import type { Metadata } from 'next';
import { Header, Footer } from '@/components/Chrome';
import { StartPurchase } from '@/components/StartPurchase';

export const metadata: Metadata = {
  title: 'Sotib olish',
  robots: { index: false, follow: false },
};

export default function StartPurchasePage({ params }: { params: { id: string } }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-5 py-10 sm:px-8 sm:py-14">
        <StartPurchase productId={params.id} />
      </main>
      <Footer />
    </>
  );
}
