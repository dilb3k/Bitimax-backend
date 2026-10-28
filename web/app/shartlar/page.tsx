import { Header, Footer } from '@/components/Chrome';
import { RefundPolicy } from '@/components/Hero';
import { getPolicy } from '@/lib/server/policy';
export const metadata = { title: 'Savdo va qaytarish shartlari' };
export default async function TermsPage() {
  return <><Header /><main id="main-content"><h1 className="mx-auto max-w-6xl px-5 pt-10 text-3xl font-bold sm:px-8">Savdo shartlari</h1><RefundPolicy policy={await getPolicy()} /></main><Footer /></>;
}
