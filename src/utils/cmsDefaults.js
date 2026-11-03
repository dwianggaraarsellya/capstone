import { logger } from '@/utils/logger';

export function getHomepageCms(customCms = {}) {
  let cms = customCms;
  if (typeof customCms === 'string') {
    try {
      cms = JSON.parse(customCms);
    } catch {
      cms = {};
    }
  }
  if (!cms || typeof cms !== 'object') {
    cms = {};
  }

  return {
    hero: {
      badge: '100% Organik & Segar',
      title: 'Sayur Segar Berkualitas dari Petani Lokal Bangka',
      subtitle: 'Dipanen pagi hari, dikemas higienis, dan dikirim langsung ke rumah Anda di hari yang sama.',
      ctaText: 'Belanja Sekarang',
      ctaLink: '/products',
      show: true,
      ...(cms.hero || {})
    },
    featured: {
      badge: '',
      title: 'Produk Segar Terpopuler',
      subtitle: 'Sayuran dan buah organik segar favorit keluarga Indonesia.',
      show: true,
      limit: 8,
      ...(cms.featured || {})
    },
    umkm: {
      badge: '',
      title: 'Mendukung Petani Lokal & Pertanian Berkelanjutan',
      subtitle: 'Setiap pembelian Anda berkontribusi langsung pada kesejahteraan keluarga petani di Bangka.',
      show: true,
      ...(cms.umkm || {})
    },
    gallery: {
      badge: '',
      title: 'Aktivitas & Kebun TaniCo',
      subtitle: 'Intip proses penanaman, panen, dan pengemasan kami.',
      show: true,
      ...(cms.gallery || {})
    }
  };
}
