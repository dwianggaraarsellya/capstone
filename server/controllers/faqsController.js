import prisma from '../services/prisma.js';
import { getCacheItem, setCacheItem } from '../services/cache.js';

export const STATIC_FAQS = [
  {
    id: 'faq-1',
    q: 'Bagaimana TaniCo memastikan kesegaran sayuran yang dikirim?',
    a: 'Kami menerapkan sistem Harvest-to-Doorstep: sayuran baru dipanen dari kebun mitra petani lokal pada fajar hari (pukul 04:00 - 06:00 WIB), disortir secara higienis, dan langsung dikirimkan ke alamat Anda sebelum siang hari.',
    active: true,
    sortOrder: 0
  },
  {
    id: 'faq-2',
    q: 'Apakah semua produk pertanian di TaniCo bersertifikat organik?',
    a: 'Seluruh sayur dan buah yang berlabel Organik dibudidayakan secara alami tanpa pestisida kimia sintetis, menggunakan pupuk kompos hayati, dan diawasi ketat melalui standardisasi Good Agricultural Practices (GAP).',
    active: true,
    sortOrder: 1
  },
  {
    id: 'faq-3',
    q: 'Berapa batas waktu pemesanan untuk pengantaran hari yang sama (Same Day)?',
    a: 'Pemesanan yang masuk sebelum pukul 07:00 WIB akan diproses dan dikirimkan pada jadwal pengantaran pagi/siang hari yang sama. Pesanan setelah pukul 07:00 WIB akan dijadwalkan untuk panen fajar keesokan harinya.',
    active: true,
    sortOrder: 2
  },
  {
    id: 'faq-4',
    q: 'Bagaimana prosedur klaim garansi jika sayuran tiba dalam kondisi rusak atau layu?',
    a: 'TaniCo memberikan Garansi 100% Kesegaran. Jika terdapat produk yang tidak sesuai standar, cukup foto kondisi produk dan hubungi layanan pelanggan kami dalam 1x24 jam sejak pesanan diterima untuk penggantian produk atau pengembalian dana.',
    active: true,
    sortOrder: 3
  },
  {
    id: 'faq-5',
    q: 'Metode pembayaran apa saja yang didukung?',
    a: 'Kami menerima pembayaran melalui Transfer Bank Virtual Account (BCA, Mandiri, BNI, BRI), E-Wallet (GoPay, OVO, ShopeePay, DANA), QRIS, serta layanan Bayar di Tempat (COD) untuk area jangkauan tertentu.',
    active: true,
    sortOrder: 4
  },
  {
    id: 'faq-6',
    q: 'Apakah ada minimal belanja untuk mendapatkan Gratis Ongkir?',
    a: 'Ya, Anda berhak menikmati fasilitas Gratis Ongkir dengan minimal pembelanjaan Rp 50.000 untuk seluruh area pengantaran dalam kota.',
    active: true,
    sortOrder: 5
  }
];

async function getStoredFaqs() {
  const cached = getCacheItem('admin_faqs_stored');
  if (cached) return cached;
  try {
    const setting = await prisma.websiteSetting.findFirst({
      select: { homepageCMS: true }
    });
    if (!setting || !setting.homepageCMS) {
      setCacheItem('admin_faqs_stored', STATIC_FAQS, 45000);
      return STATIC_FAQS;
    }
    let cms = {};
    try {
      cms = typeof setting.homepageCMS === 'string' ? JSON.parse(setting.homepageCMS) : setting.homepageCMS;
    } catch {
      return STATIC_FAQS;
    }
    if (Array.isArray(cms.faqs) && cms.faqs.length > 0) {
      setCacheItem('admin_faqs_stored', cms.faqs, 45000);
      return cms.faqs;
    }
    setCacheItem('admin_faqs_stored', STATIC_FAQS, 45000);
    return STATIC_FAQS;
  } catch (err) {
    console.error('getStoredFaqs error:', err);
    return STATIC_FAQS;
  }
}

// Public: Get active FAQs
export async function getPublicFaqs(req, res) {
  try {
    const faqs = await getStoredFaqs();
    const active = faqs
      .filter(f => f.active !== false)
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    return res.json({ success: true, faqs: active });
  } catch (error) {
    console.error('getPublicFaqs error:', error);
    return res.json({ success: true, faqs: STATIC_FAQS });
  }
}
