import type { Metadata } from 'next';
import { Header, Footer } from '@/components/Chrome';
import { Catalog } from '@/components/Catalog';
export const metadata: Metadata = { title: 'Akkauntlar katalogi' };
export default function CatalogPage() {
  return <><Header /><main id="main-content" className="min-h-[70vh]"><Catalog standalone /></main><Footer /></>;
}
