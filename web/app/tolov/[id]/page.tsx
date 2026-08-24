import type { Metadata } from 'next';
import { Header, Footer } from '@/components/Chrome';
import { PaymentPanel } from '@/components/PaymentPanel';

export const metadata: Metadata = {
  title: 'To‘lov',
  robots: { index: false, follow: false },
};

export default function PaymentPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-5 py-10 sm:px-8 sm:py-14">
        <h1 className="mb-1 text-2xl font-bold text-ink">To‘lov</h1>
        <p className="mb-6 text-sm text-muted">
          Pul kafilda saqlanadi — siz tasdiqlamaguningizcha sotuvchiga o‘tmaydi.
        </p>
        <PaymentPanel transactionId={params.id} />
      </main>
      <Footer />
    </>
  );
}
