/**
 * Sanitizes and normalizes the backend API base URL:
 * - Trims whitespace
 * - Ensures a proper http/https protocol prefix
 * - Strips trailing slashes
 * - Strips trailing '/api' to prevent double prefix (/api/api/...)
 */
export function sanitizeApiBaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  // Ensure protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // Strip trailing /api to prevent double /api/api/...
  url = url.replace(/\/api$/i, '');

  // Strip trailing slashes again just in case
  url = url.replace(/\/+$/, '');

  return url;
}

/**
 * Helper to get the base URL for API requests.
 * - In the browser: returns an empty string so requests use relative paths (handled by Next.js rewrites to Express).
 * - On the server (Next.js SSR / Server Components):
 *   Uses INTERNAL_API_URL pointing to the production Express backend.
 *   Production environment MUST NOT silently fallback to localhost.
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const rawInternalUrl = process.env.INTERNAL_API_URL;

  // 1. Explicit internal API URL override
  if (rawInternalUrl && rawInternalUrl.trim() && rawInternalUrl.trim() !== 'MY_APP_URL') {
    return sanitizeApiBaseUrl(rawInternalUrl);
  }

  // 2. Non-Vercel local or containerized environments (Docker, Cloud Run, local Node)
  // Express backend runs co-located in the same instance on 127.0.0.1:BACKEND_PORT
  if (!process.env.VERCEL) {
    const port = process.env.BACKEND_PORT || 5000;
    return `http://127.0.0.1:${port}`;
  }

  // 3. Vercel serverless deployment environments
  const rawAppUrl = process.env.APP_URL;
  if (rawAppUrl && rawAppUrl.trim() && rawAppUrl.trim() !== 'MY_APP_URL') {
    return sanitizeApiBaseUrl(rawAppUrl);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return sanitizeApiBaseUrl(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) {
    return sanitizeApiBaseUrl(`https://${process.env.VERCEL_URL}`);
  }

  if (isProduction) {
    console.warn('[getApiBaseUrl] In Vercel production but no VERCEL_URL/APP_URL provided. Using relative path fallback.');
    return '';
  }

  return '';
}

