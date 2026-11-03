/**
 * Helper to filter out specific disallowed labels and badges from being displayed across the UI.
 * Forbidden labels:
 * 1. Pilihan Kategori
 * 2. Pilihan Terbaik
 * 3. Galeri Kebun
 * 4. Katalog Tani
 * 5. Hubungi Tanico
 * 6. Filosofi Tanico
 * 7. Rekomendasi Kebun
 * 8. Kategori Panduan Utama
 * 9. Kisah Kami
 * 10. Keunggulan Kami
 */

export const FORBIDDEN_LABELS = [
  'pilihan kategori',
  'pilihan terbaik',
  'galeri kebun',
  'katalog tani',
  'hubungi tanico',
  'filosofi tanico',
  'rekomendasi kebun',
  'kategori panduan utama',
  'kisah kami',
  'keunggulan kami',
  'pusat bantuan tanico',
  'pusat bantuan',
  'panduan pembelajaran'
];

export function isForbiddenLabel(text) {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return FORBIDDEN_LABELS.includes(normalized);
}

export function filterBadge(text) {
  if (!text || typeof text !== 'string') return '';
  return isForbiddenLabel(text) ? '' : text;
}
