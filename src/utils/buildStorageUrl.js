/**
 * Resolves static or uploaded image paths to browser-accessible URLs.
 * Standalone without external dependencies.
 */
export function buildStorageUrl(path) {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // Already a complete URL or data/blob URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Supabase Storage bucket relative paths
  const knownBuckets = [
    'products',
    'categories',
    'hero',
    'gallery',
    'articles',
    'testimonials',
    'tanico-public',
    'product-images',
    'category-banners',
    'category-heroes',
    'hero-banners',
    'hero-benefits',
    'avatars'
  ];
  const firstSegment = trimmed.replace(/^\/+/, '').split('/')[0];
  if (knownBuckets.includes(firstSegment)) {
    const supabaseUrl = (
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
      'https://mhcpphdvutuprofgfxcb.supabase.co'
    ).replace(/\/+$/, '');
    return `${supabaseUrl}/storage/v1/object/public/${trimmed.replace(/^\/+/, '')}`;
  }

  // Local static public assets & uploaded files
  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('uploads/') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('/icons/') ||
    trimmed.startsWith('/logos/') ||
    trimmed.startsWith('/hero-banners/') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('icons/') ||
    trimmed.startsWith('logos/')
  ) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Default fallback for clean path
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export default buildStorageUrl;
