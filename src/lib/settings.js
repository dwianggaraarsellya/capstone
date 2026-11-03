import { getApiBaseUrl } from '@/lib/apiBase.js';
import { logger } from '@/utils/logger.js';

function normalizeClientEmbedMapsUrl(rawMapsUrl, address) {
  const cleanUrl = typeof rawMapsUrl === 'string' ? rawMapsUrl.trim() : '';
  if (cleanUrl && (/\/maps\/embed/i.test(cleanUrl) || /[?&]output=embed/i.test(cleanUrl))) {
    return cleanUrl;
  }
  const query = (address && address.trim()) || 'Pemali, Kabupaten Bangka';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=id&z=15&output=embed`;
}

export async function getWebsiteSettings() {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/settings`, {
      next: { revalidate: 60, tags: ['settings'] },
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      if (data && data.id) {
        return {
          ...data,
          embedMapsUrl: data.embedMapsUrl || normalizeClientEmbedMapsUrl(data.googleMapsUrl, data.address),
          _isFallback: false
        };
      }
    }
  } catch (e) {
    logger.error('[SettingsLib] getWebsiteSettings error via Express API:', e);
  }

  const defaultAddress = "Jl. Raya Pemali No. 45, Kecamatan Pemali, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung 33251";
  return {
    id: "default",
    logoText: "TaniCo",
    tagline: "Murni Organik",
    websiteName: "TaniCo — Sayur Segar Organik",
    address: defaultAddress,
    googleMapsUrl: normalizeClientEmbedMapsUrl("", defaultAddress),
    embedMapsUrl: normalizeClientEmbedMapsUrl("", defaultAddress),
    whatsappNumber: "+628127300400",
    instagramUrl: "https://instagram.com/tanico.bangka",
    facebookUrl: "https://facebook.com/TaniCoBangka",
    emailAddress: "halo@tanico.id",
    operationalHours: "Setiap Hari: 07.00 - 17.00 WIB",
    footerText: "© 2026 TaniCo. Hak Cipta Dilindungi.",
    seoKeywords: "sayur organik, sayur segar bangka, tanico, sayur sehat",
    homepageCMS: "{}",
    contactsCMS: "{}",
    _isFallback: true
  };
}

export async function getWebsiteData() {
  try {
    const baseUrl = getApiBaseUrl();
    const productsRes = await fetch(`${baseUrl}/api/products?all=true&limit=100`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    }).catch(() => null);

    const products = productsRes && productsRes.ok ? await productsRes.json() : [];

    return {
      settings: { id: "default", homepageCMS: "{}" },
      adminProfile: { id: "default", name: "Admin TaniCo", email: "admin@tanico.id", role: "Super Admin", avatar: "" },
      categories: [],
      products: Array.isArray(products) ? products : [],
      orders: [],
      reviews: [],
      activityLogs: [],
      stockHistory: [],
      gallery: [],
      contactMessages: [],
      totalUsers: 0
    };
  } catch (error) {
    logger.error('[SettingsLib] getWebsiteData error via Express API:', error);
    return {
      settings: { id: "default", homepageCMS: "{}" },
      adminProfile: { id: "default", name: "Admin TaniCo", email: "admin@tanico.id", role: "Super Admin", avatar: "" },
      categories: [],
      products: [],
      orders: [],
      reviews: [],
      activityLogs: [],
      stockHistory: [],
      gallery: [],
      contactMessages: [],
      totalUsers: 0
    };
  }
}
