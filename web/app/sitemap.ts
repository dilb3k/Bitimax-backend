import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://bitimax.uz';

/** Refreshed hourly — new listings should be findable without a redeploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE}/kod`, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const backend = process.env.BACKEND_URL;
  if (!backend) return staticRoutes;

  try {
    const response = await fetch(`${backend}/api/products?limit=100&sort=-createdAt`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return staticRoutes;

    const data = await response.json();
    const products: { _id: string; createdAt: string }[] = data.products ?? [];

    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${SITE}/product/${product._id}`,
        lastModified: new Date(product.createdAt),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // A backend hiccup should cost the sitemap its product entries, not the whole file.
    return staticRoutes;
  }
}
