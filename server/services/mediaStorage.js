import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../..');
const uploadsDir = path.resolve(appRoot, 'public/uploads');

/**
 * Normalizes input bucket name to match configured Supabase Storage buckets:
 * - products (product images and gallery)
 * - categories (category icons, banners, hero images)
 * - hero (hero banners, benefits, promotional slides)
 * - gallery (website gallery)
 * - articles (articles and blog content)
 * - testimonials (customer reviews and testimonials)
 * - tanico-public (admin avatars, user avatars, general public assets)
 */
export function normalizeBucket(name) {
  if (!name || typeof name !== 'string') return 'tanico-public';
  const clean = name.trim().toLowerCase();

  if (clean === 'products' || clean === 'product' || clean === 'product-images') return 'products';
  if (clean === 'categories' || clean === 'category' || clean === 'category-banners' || clean === 'category-heroes' || clean === 'category-og-images') return 'categories';
  if (clean === 'hero' || clean === 'hero-banners' || clean === 'hero-benefits' || clean === 'banners') return 'hero';
  if (clean === 'gallery' || clean === 'galleries') return 'gallery';
  if (clean === 'articles' || clean === 'article' || clean === 'blog') return 'articles';
  if (clean === 'testimonials' || clean === 'testimonial') return 'testimonials';
  if (clean === 'avatars' || clean === 'admin-avatars' || clean === 'tanico-public') return 'tanico-public';

  return clean;
}

/**
 * Gets Supabase Storage configuration from environment variables
 */
function getSupabaseConfig() {
  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://mhcpphdvutuprofgfxcb.supabase.co'
  ).replace(/\/+$/, '');

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY;

  return { supabaseUrl, serviceKey };
}

/**
 * Formats a clean, collision-free filename with proper extension
 */
function formatStorageFilename(originalFilename, mimeType) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const baseName = (originalFilename || 'image.jpg')
    .replace(/^.*[\\\/]/, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();

  let ext = path.extname(baseName);
  if (!ext && mimeType) {
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('webp')) ext = '.webp';
    else if (mimeType.includes('gif')) ext = '.gif';
    else if (mimeType.includes('svg')) ext = '.svg';
    else ext = '.jpg';
  }

  const cleanBase = baseName.replace(/\.[^/.]+$/, '');
  return `${timestamp}_${randomSuffix}_${cleanBase}${ext}`;
}

/**
 * Checks whether an image path/filename is still referenced anywhere in the PostgreSQL database.
 * Prevents accidental deletion of shared or active media files (Orphan Protection).
 */
export async function isMediaUsedInDatabase(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string' || !urlOrPath.trim()) {
    return false;
  }

  // Base64 strings are self-contained and not stored as storage files
  if (urlOrPath.startsWith('data:')) {
    return false;
  }

  let storagePath = urlOrPath.replace(/^\/+/, '');
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    try {
      const parsed = new URL(urlOrPath);
      storagePath = parsed.pathname.replace(/^\/+/, '');
    } catch (_) {
      storagePath = urlOrPath;
    }
  }

  const filenameOnly = storagePath.includes('/') ? storagePath.split('/').pop() : storagePath;
  const pathMatchers = filenameOnly && filenameOnly !== storagePath
    ? [{ contains: storagePath }, { contains: filenameOnly }]
    : [{ contains: storagePath }];

  try {
    const [
      inProduct,
      inProductImage,
      inCategory,
      inArticle,
      inGallery,
      inHeroBanner,
      inHeroBenefit,
      inAdminProfile,
      inUser,
      inReview,
      inOrderItem,
      inWebsiteSetting
    ] = await Promise.all([
      prisma.product.findFirst({
        where: { OR: pathMatchers.map(m => ({ image: m })) },
        select: { id: true }
      }),
      prisma.productImage.findFirst({
        where: { OR: pathMatchers.map(m => ({ url: m })) },
        select: { id: true }
      }),
      prisma.category.findFirst({
        where: {
          OR: [
            ...pathMatchers.map(m => ({ image: m })),
            ...pathMatchers.map(m => ({ banner: m })),
            ...pathMatchers.map(m => ({ heroImage: m }))
          ]
        },
        select: { id: true }
      }),
      prisma.article.findFirst({
        where: { OR: pathMatchers.map(m => ({ image: m })) },
        select: { id: true }
      }),
      prisma.gallery.findFirst({
        where: { OR: pathMatchers.map(m => ({ image: m })) },
        select: { id: true }
      }),
      prisma.heroBanner.findFirst({
        where: {
          OR: [
            ...pathMatchers.map(m => ({ image: m })),
            ...pathMatchers.map(m => ({ desktopImage: m })),
            ...pathMatchers.map(m => ({ mobileImage: m }))
          ]
        },
        select: { id: true }
      }),
      prisma.heroBenefit.findFirst({
        where: { OR: pathMatchers.map(m => ({ image: m })) },
        select: { id: true }
      }),
      prisma.adminProfile.findFirst({
        where: { OR: pathMatchers.map(m => ({ avatar: m })) },
        select: { id: true }
      }),
      prisma.user.findFirst({
        where: { OR: pathMatchers.map(m => ({ avatar: m })) },
        select: { id: true }
      }),
      prisma.review.findFirst({
        where: { OR: pathMatchers.map(m => ({ userAvatar: m })) },
        select: { id: true }
      }),
      prisma.orderItem.findFirst({
        where: { OR: pathMatchers.map(m => ({ image: m })) },
        select: { id: true }
      }),
      prisma.websiteSetting.findFirst({
        where: {
          OR: [
            ...pathMatchers.map(m => ({ homepageCMS: m })),
            ...pathMatchers.map(m => ({ contactsCMS: m }))
          ]
        },
        select: { id: true }
      })
    ]);

    return Boolean(
      inProduct ||
      inProductImage ||
      inCategory ||
      inArticle ||
      inGallery ||
      inHeroBanner ||
      inHeroBenefit ||
      inAdminProfile ||
      inUser ||
      inReview ||
      inOrderItem ||
      inWebsiteSetting
    );
  } catch (err) {
    console.warn('[MediaStorage] Error checking media usage in database:', err.message);
    return false;
  }
}

/**
 * Batch check referenced URLs in PostgreSQL
 */
export async function getReferencedUrlsInDatabase(urls) {
  if (!urls || !Array.isArray(urls) || urls.length === 0) return new Set();
  const referencedSet = new Set();
  await Promise.all(
    urls.map(async (u) => {
      if (u && typeof u === 'string') {
        const inUse = await isMediaUsedInDatabase(u);
        if (inUse) referencedSet.add(u);
      }
    })
  );
  return referencedSet;
}

/**
 * Upload buffer directly to Supabase Storage.
 * Strictly uploads file to Supabase bucket and returns public URL.
 * NEVER stores Base64 string as fallback when upload fails.
 */
export async function uploadBufferToSupabase(buffer, mimeType, filename, bucketName = 'tanico-public') {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return {
      success: false,
      error: 'Buffer file gambar tidak valid'
    };
  }

  const { supabaseUrl, serviceKey } = getSupabaseConfig();
  if (!serviceKey) {
    return {
      success: false,
      error: 'Kunci otentikasi Supabase Storage (SUPABASE_SERVICE_ROLE_KEY) tidak ditemukan'
    };
  }

  const cleanBucket = normalizeBucket(bucketName);
  const cleanFilename = formatStorageFilename(filename, mimeType);
  const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${cleanBucket}/${cleanFilename}`;

  try {
    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': mimeType || 'image/jpeg',
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let parsedError = errText;
      try {
        const parsedJson = JSON.parse(errText);
        parsedError = parsedJson.message || parsedJson.error || errText;
      } catch (_) {}

      console.error(`[MediaStorage] Supabase upload failed (status ${res.status}):`, parsedError);
      return {
        success: false,
        error: `Gagal mengunggah file ke Supabase Storage bucket "${cleanBucket}": ${parsedError || res.statusText}`
      };
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${cleanBucket}/${cleanFilename}`;

    return {
      success: true,
      url: publicUrl,
      publicUrl,
      path: `${cleanBucket}/${cleanFilename}`,
      bucket: cleanBucket,
      filename: cleanFilename
    };
  } catch (netErr) {
    console.error('[MediaStorage] Network error uploading to Supabase Storage:', netErr);
    return {
      success: false,
      error: `Kesalahan jaringan saat mengunggah ke Supabase Storage: ${netErr.message}`
    };
  }
}

// Backwards compatibility alias
export const uploadBufferToMedia = uploadBufferToSupabase;

/**
 * Convert base64 data to binary buffer and upload to Supabase Storage.
 * Ensures that base64 is transformed into a real file in Supabase Storage,
 * returning a valid public Supabase URL and NEVER returning base64.
 */
export async function uploadBase64ToSupabase(base64Data, filename, bucketName = 'tanico-public') {
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      return {
        success: false,
        error: 'Data base64 tidak valid'
      };
    }

    let cleanBase64 = base64Data;
    let mimeType = 'image/jpeg';

    if (base64Data.includes(';base64,')) {
      const parts = base64Data.split(';base64,');
      const mimeMatch = parts[0].match(/data:(.*?)$/);
      if (mimeMatch) mimeType = mimeMatch[1];
      cleanBase64 = parts[1];
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    return await uploadBufferToSupabase(buffer, mimeType, filename, bucketName);
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Gagal memproses gambar base64 ke Supabase Storage'
    };
  }
}

// Backwards compatibility alias
export const uploadBase64ToMedia = uploadBase64ToSupabase;

/**
 * Helper to delete local legacy media file if exists
 */
async function deleteLocalMediaFile(urlOrPath) {
  try {
    let cleanFilename = '';
    if (typeof urlOrPath === 'string') {
      if (urlOrPath.startsWith('/uploads/')) {
        cleanFilename = urlOrPath.replace('/uploads/', '');
      } else if (urlOrPath.includes('/uploads/')) {
        cleanFilename = urlOrPath.split('/uploads/').pop();
      }
    }

    if (cleanFilename) {
      const targetPath = path.resolve(uploadsDir, cleanFilename);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    }
  } catch (_) {}
}

/**
 * Deletes file from Supabase Storage bucket
 */
export async function deleteFileFromSupabase(urlOrPath, bucketName = null) {
  if (!urlOrPath || typeof urlOrPath !== 'string' || !urlOrPath.trim()) {
    return { success: true, message: 'Tidak ada file untuk dihapus' };
  }

  // Base64 string in database doesn't occupy Supabase Storage file
  if (urlOrPath.startsWith('data:')) {
    return { success: true, message: 'Base64 data tidak memerlukan penghapusan storage' };
  }

  const { supabaseUrl, serviceKey } = getSupabaseConfig();

  try {
    let targetBucket = bucketName;
    let filenameOnly = '';

    if (urlOrPath.includes('/storage/v1/object/public/')) {
      const subpath = urlOrPath.split('/storage/v1/object/public/')[1];
      const parts = subpath.split('/');
      targetBucket = targetBucket || parts[0];
      filenameOnly = parts.slice(1).join('/');
    } else if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      try {
        const parsed = new URL(urlOrPath);
        const parts = parsed.pathname.replace(/^\/+/, '').split('/');
        filenameOnly = parts[parts.length - 1];
      } catch (_) {
        filenameOnly = urlOrPath.split('/').pop();
      }
    } else {
      const parts = urlOrPath.replace(/^\/+/, '').split('/');
      if (parts.length > 1 && !targetBucket) {
        targetBucket = parts[0];
        filenameOnly = parts.slice(1).join('/');
      } else {
        filenameOnly = parts.pop();
      }
    }

    targetBucket = normalizeBucket(targetBucket);

    if (filenameOnly && serviceKey) {
      await fetch(`${supabaseUrl}/storage/v1/object/${targetBucket}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prefixes: [filenameOnly] })
      }).catch((e) => console.warn('[MediaStorage] Supabase delete warning:', e.message));
    }

    // Clean up local file if legacy file was in /uploads/
    await deleteLocalMediaFile(urlOrPath);

    return { success: true, message: `File ${filenameOnly} berhasil dihapus dari Supabase Storage` };
  } catch (err) {
    console.warn('[MediaStorage] Error deleting from Supabase Storage:', err.message);
    return { success: false, error: err.message };
  }
}

// Backwards compatibility alias
export const deleteMediaFile = deleteFileFromSupabase;

/**
 * Safe file deletion with Orphan Protection
 */
export async function safeDeleteMediaFile(urlOrPath, bucketName = null) {
  if (!urlOrPath || typeof urlOrPath !== 'string' || !urlOrPath.trim()) {
    return { success: true, message: 'Tidak ada file untuk dihapus' };
  }

  const inUse = await isMediaUsedInDatabase(urlOrPath);
  if (inUse) {
    return {
      success: true,
      deleted: false,
      skipped: true,
      reason: 'STILL_IN_USE'
    };
  }

  const res = await deleteFileFromSupabase(urlOrPath, bucketName);
  return {
    ...res,
    deleted: Boolean(res.success),
    skipped: false
  };
}

// Backwards compatibility alias
export const safeDeleteFileFromSupabase = safeDeleteMediaFile;

/**
 * Handles media replacement: when a new image is provided, safely cleans up the old image
 */
export async function handleMediaReplacement(oldUrl, newUrl, bucketName = null) {
  if (!oldUrl || typeof oldUrl !== 'string' || !oldUrl.trim()) {
    return { success: true, message: 'Tidak ada media lama untuk dibersihkan' };
  }
  if (oldUrl === newUrl) {
    return { success: true, message: 'Media tidak berubah' };
  }
  return await safeDeleteMediaFile(oldUrl, bucketName);
}
