import { Hero, RefundPolicy } from '@/components/Hero';
import { Catalog } from '@/components/Catalog';
import { Header, Footer } from '@/components/Chrome';
import { getPolicy } from '@/lib/server/policy';
import { DealCode } from '@/components/DealCode';
import { PlatformStats, PublicPolicy } from '@/lib/api';

// The landing numbers are the same for every visitor and go stale slowly, so they're fetched
// on the server and cached rather than costing each visitor a client round trip.
export const revalidate = 120;

async function getStats(): Promise<PlatformStats | null> {
  const backend = process.env.BACKEND_URL;
  if (!backend) return null;
  try {
    const res = await fetch(`${backend}/api/products/stats`, { next: { revalidate: 120 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // The catalog still renders without stats — a backend hiccup shouldn't blank the page.
    return null;
  }
}

export default async function HomePage() {
  const [stats, policy] = await Promise.all([getStats(), getPolicy()]);

  return (
    <>
      <Header />
      <main id="main-content">
        <Hero stats={stats} />
        <Catalog />
        <DealCode />
        <RefundPolicy policy={policy} />
      </main>
      <Footer />
    </>
  );
}
