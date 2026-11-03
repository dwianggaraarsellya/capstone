import { logger } from '@/utils/logger';

/**
 * Safely creates an instant local Object URL for fast, zero-delay preview.
 * This ensures the preview appears immediately (< 0.1s) without waiting for network upload.
 */
export function createPreviewUrl(file) {
  if (!file) return '';
  if (typeof file === 'string') {
    return file;
  }
  if (typeof window !== 'undefined' && (file instanceof Blob || file instanceof File)) {
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      logger.warn('[createPreviewUrl] Gagal membuat Object URL:', e);
      return '';
    }
  }
  return '';
}

/**
 * Revokes an object URL when no longer needed to prevent memory leaks.
 */
export function revokePreviewUrl(url) {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    if (typeof window !== 'undefined' && window.URL && typeof window.URL.revokeObjectURL === 'function') {
      try {
        window.URL.revokeObjectURL(url);
      } catch (_) {}
    }
  }
}

/**
 * Converts a data URL (base64) string into a binary Blob
 */
function dataUrlToBlob(dataUrl) {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    logger.warn('[uploadFileToSupabase] Failed to convert dataURL to Blob:', err);
    return null;
  }
}

/**
 * Uploads a file (or base64 string) to Supabase Storage via the server upload API.
 * Guarantees that files are stored in Supabase Storage buckets, returning public URLs.
 */
export async function uploadFileToSupabase(file, folder = 'tanico-public', customFilename = null, customHeaders = {}) {
  try {
    if (!file) {
      return { success: false, error: 'File tidak ditemukan' };
    }

    // If file is already a valid remote URL string, return as-is immediately (zero latency)
    if (typeof file === 'string') {
      if (file.startsWith('http://') || file.startsWith('https://')) {
        return {
          success: true,
          url: file,
          publicUrl: file,
          path: file,
          bucket: folder,
          toString: () => file
        };
      }
    }

    const cleanFolder = folder || 'tanico-public';
    let fileToUpload = file;
    let cleanFilename = customFilename || (file && file.name ? file.name : `upload_${Date.now()}.jpg`);

    // If input is a Base64 data URI, convert to binary Blob before uploading
    if (typeof file === 'string' && file.startsWith('data:')) {
      const blob = dataUrlToBlob(file);
      if (blob) {
        fileToUpload = blob;
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload, cleanFilename);
    formData.append('folder', cleanFolder);
    formData.append('bucket', cleanFolder);
    formData.append('filename', cleanFilename);

    // Retrieve auth token from localStorage if in browser
    let headers = { ...customHeaders };
    if (typeof window !== 'undefined') {
      try {
        const storedUser = JSON.parse(
          localStorage.getItem('tanico_user') || 
          localStorage.getItem('tanico_admin_user') || 
          'null'
        );
        const token = storedUser?.sessionToken || storedUser?.token;
        if (token && !headers.Authorization && !headers.authorization) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {}
    }

    // Try primary admin upload endpoint first
    let response = null;
    try {
      response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData
      });
    } catch (netErr) {
      logger.warn('[uploadFileToSupabase] /api/admin/upload network failure, attempting /api/upload', netErr);
    }

    // If primary route failed with 401, 403, 404, or network error, fallback to /api/upload
    if (!response || !response.ok) {
      try {
        const fallbackRes = await fetch('/api/upload', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: formData
        });
        if (fallbackRes.ok) {
          response = fallbackRes;
        }
      } catch (fallbackErr) {
        logger.warn('[uploadFileToSupabase] Fallback /api/upload error:', fallbackErr);
      }
    }

    if (!response || !response.ok) {
      const errData = response ? await response.json().catch(() => ({})) : {};
      const rawError = errData.error || errData.message || '';
      
      // Clean, user-friendly error message without technical Supabase leaks
      let errorMessage = 'Gambar gagal diupload. Silakan coba lagi.';
      if (rawError && !rawError.toLowerCase().includes('supabase') && !rawError.toLowerCase().includes('bucket')) {
        errorMessage = rawError;
      }
      
      logger.error('uploadFileToSupabase failed response:', rawError || errorMessage);
      return {
        success: false,
        error: errorMessage,
        url: '',
        publicUrl: ''
      };
    }

    const data = await response.json();
    const finalUrl = data.url || data.publicUrl || data.path || '';

    return {
      success: true,
      url: finalUrl,
      publicUrl: finalUrl,
      path: data.path || finalUrl,
      bucket: data.bucket || cleanFolder,
      data,
      toString: () => finalUrl
    };
  } catch (error) {
    logger.error('uploadFileToSupabase exception:', error);
    return {
      success: false,
      error: 'Gambar gagal diupload. Silakan coba lagi.',
      url: '',
      publicUrl: ''
    };
  }
}

export default uploadFileToSupabase;
