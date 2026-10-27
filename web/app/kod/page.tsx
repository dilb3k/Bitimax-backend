import type { Metadata } from 'next';
import { Header, Footer } from '@/components/Chrome';
import { DealCodePanel } from '@/components/DealCodePanel';

export const metadata: Metadata = {
  title: 'Kod bilan sotib olish',
  description: 'Sotuvchi bergan bitim kodini kiriting — pul kafilda saqlanadi.',
};

export default function DealCodePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="mb-2 text-2xl font-bold text-ink sm:text-3xl">Kod bilan sotib olish</h1>
        <p className="mb-7 text-sm leading-relaxed text-muted">
          Sotuvchi bilan allaqachon kelishgan bo‘lsangiz — u bergan kodni kiriting. Bitmax
          o‘rtada kafil bo‘lib turadi.
        </p>
        <DealCodePanel />
      </main>
      <Footer />
    </>
  );
}
