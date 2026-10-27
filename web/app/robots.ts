import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://bitmax.uz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing behind a session should be crawled: order ids, payment screens and the
      // pairing flow are per-user and useless (or harmful) in an index.
      disallow: ['/kabinet', '/kabinet/', '/tolov/', '/sotib-olish/', '/kirish', '/api/'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
