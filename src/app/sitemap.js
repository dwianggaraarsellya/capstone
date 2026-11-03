import { getWebsiteData } from '@/lib/dbActions';

export default async function sitemap() {
  const baseUrl = process.env.APP_URL || 'https://tanico.id';

  const staticRoutes = [
    '',
    '/produk',
    '/kategori',
    '/tentang-kami',
    '/hubungi-kami',
    '/faq',
    '/knowledge-base'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' || route === '/produk' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8
  }));

  try {
    const data = await getWebsiteData();
    const products = data.products || [];

    const productRoutes = products.map((p) => ({
      url: `${baseUrl}/produk/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (e) {
    return staticRoutes;
  }
}
