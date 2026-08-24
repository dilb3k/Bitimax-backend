import type { Metadata } from 'next';
import { SellerForm } from '@/components/cabinet/SellerForm';

export const metadata: Metadata = { title: 'Yangi e’lon', robots: { index: false, follow: false } };

export default function NewListingPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-ink">Yangi e’lon</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        E’lon katalogda hamma uchun ko‘rinadi. Moderator tasdiqlagach chop etiladi.
      </p>
      <SellerForm mode="listing" />
    </>
  );
}
