import type { Metadata } from 'next';
import { SellerForm } from '@/components/cabinet/SellerForm';

export const metadata: Metadata = { title: 'Yangi e’lon', robots: { index: false, follow: false } };

export default function NewListingPage() {
  return (
    <>
      <h1 className="page-title mb-3">Yangi e’lon</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        Ma’lumotlarni kiriting va tekshiring. Tasdiqlaganingizdan keyin e’lon darhol katalogda chiqadi.
      </p>
      <SellerForm mode="listing" />
    </>
  );
}
