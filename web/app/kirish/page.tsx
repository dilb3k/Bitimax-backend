import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Header, Footer } from '@/components/Chrome';
import { LoginPanel } from '@/components/LoginPanel';
import { Loading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Kirish',
  description: 'Bitmax kabinetiga Telegram bot orqali xavfsiz kirish — parolsiz.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-lg px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="mb-2 text-2xl font-bold text-ink sm:text-3xl">Kabinetga kirish</h1>
        <p className="mb-7 text-sm leading-relaxed text-muted">
          Parol yo‘q. Kirishni botdagi bir tegish bilan tasdiqlaysiz.
        </p>
        <Suspense fallback={<Loading />}>
          <LoginPanel />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
