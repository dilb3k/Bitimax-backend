import type { Metadata } from 'next';
import { SellerForm } from '@/components/cabinet/SellerForm';

export const metadata: Metadata = { title: 'Kafil bitim', robots: { index: false, follow: false } };

export default function NewDealPage() {
  return (
    <>
      <h1 className="page-title mb-3">Kafil bitim</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        Xaridor allaqachon topilgan bo‘lsa: kod olasiz, xaridor kodni kiritadi, pul kafilda
        saqlanadi. Moderatsiya kutilmaydi.
      </p>
      <SellerForm mode="deal" />
    </>
  );
}
