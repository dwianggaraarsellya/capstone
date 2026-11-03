import prisma from '../services/prisma.js';
import {
  clearHomeCache,
  getCacheItem,
  setCacheItem,
  clearCacheByPrefix
} from '../services/cache.js';

const NOMINATIM_HEADERS = {
  'User-Agent': 'TaniCo-Platform/1.0 (halo@tanico.id)',
  'Accept': 'application/json',
  'Accept-Language': 'id,en;q=0.8'
};

export function normalizeEmbedMapsUrl(rawMapsUrl, address, coords = null) {
  const cleanUrl = typeof rawMapsUrl === 'string' ? rawMapsUrl.trim() : '';
  if (cleanUrl && (/\/maps\/embed/i.test(cleanUrl) || /[?&]output=embed/i.test(cleanUrl))) {
    return cleanUrl;
  }

  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=id&z=15&output=embed`;
  }

  const query = (address && String(address).trim()) || 'Pemali, Kabupaten Bangka';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=id&z=15&output=embed`;
}

function buildExternalMapsUrl(rawMapsUrl, address, coords = null) {
  const cleanUrl = typeof rawMapsUrl === 'string' ? rawMapsUrl.trim() : '';
  const isGenericRoot =
    !cleanUrl ||
    /^https?:\/\/(www\.)?(maps\.google\.com|google\.com\/maps)\/?$/i.test(cleanUrl);

  if (!isGenericRoot && !/\/maps\/embed/i.test(cleanUrl)) {
    return cleanUrl;
  }

  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  }

  const query = (address && String(address).trim()) || 'Pemali, Kabupaten Bangka';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildAddressCandidates(rawAddress) {
  const base = String(rawAddress || '').trim();
  if (!base) return ['Pemali, Kabupaten Bangka'];

  const candidates = [base];

  // Strip house numbers, street prefixes, and postal codes for broader OSM matching
  const simplified = base
    .replace(/\b(jl\.?|jalan|raya|gg\.?|gang)\b/gi, ' ')
    .replace(/\bno\.?\s*\d+[a-z]?/gi, ' ')
    .replace(/\brt\.?\s*\d+\s*(\/?\s*rw\.?\s*\d+)?/gi, ' ')
    .replace(/\b\d{5}\b/g, ' ')
    .replace(/\b(kecamatan|kec\.?|kabupaten|kab\.?|provinsi|prov\.?)\b/gi, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '');

  if (simplified && !candidates.includes(simplified)) {
    candidates.push(simplified);
  }

  const parts = simplified
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const tail = parts.slice(-2).join(', ');
    if (tail && !candidates.includes(tail)) {
      candidates.push(tail);
    }
  }

  return candidates;
}

async function geocodeQuery(rawQuery) {
  const clean = String(rawQuery || '').trim();
  if (!clean) return null;

  const cacheKey = `location_geo_${clean.toLowerCase()}`;
  const cached = getCacheItem(cacheKey);
  if (cached) return cached;

  const candidates = buildAddressCandidates(clean);

  for (const candidate of candidates) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=id&addressdetails=1&q=${encodeURIComponent(candidate)}`;
    const response = await fetch(url, {
      headers: NOMINATIM_HEADERS,
      signal: AbortSignal.timeout(6500)
    });

    if (!response.ok) {
      throw new Error(`Layanan geocoding merespons HTTP ${response.status}`);
    }

    const list = await response.json();
    if (Array.isArray(list) && list.length > 0) {
      const hit = list[0];
      const lat = Number(hit.lat);
      const lng = Number(hit.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const addr = hit.address || {};
        const parsed = {
          lat,
          lng,
          displayName: hit.display_name || candidate,
          area: {
            village: addr.village || addr.suburb || addr.hamlet || '',
            subdistrict: addr.municipality || addr.city_district || addr.town || addr.village || '',
            city: addr.county || addr.city || addr.regency || '',
            province: addr.state || '',
            postalCode: addr.postcode || ''
          }
        };
        setCacheItem(cacheKey, parsed, 60 * 60 * 1000);
        return parsed;
      }
    }
  }

  return null;
}

async function reverseGeocodeCoords(lat, lng) {
  const cacheKey = `location_rev_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  const cached = getCacheItem(cacheKey);
  if (cached) return cached;

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&accept-language=id`;
  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    signal: AbortSignal.timeout(6500)
  });

  if (!response.ok) {
    throw new Error(`Layanan reverse geocoding merespons HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.error) {
    throw new Error(data?.error || 'Lokasi tidak dapat dikenali dari koordinat tersebut.');
  }

  const addr = data.address || {};
  const parsed = {
    lat,
    lng,
    displayName: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    area: {
      road: addr.road || '',
      village: addr.village || addr.suburb || addr.neighbourhood || '',
      subdistrict: addr.municipality || addr.city_district || addr.town || addr.subdistrict || '',
      city: addr.city || addr.county || addr.state_district || '',
      province: addr.state || '',
      postalCode: addr.postcode || ''
    }
  };

  setCacheItem(cacheKey, parsed, 15 * 60 * 1000);
  return parsed;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const DEFAULT_ADDRESS = 'Jl. Raya Pemali No. 45, Bangka';

const DEFAULT_SETTINGS = {
  id: 'default',
  logoText: 'TaniCo',
  tagline: 'Murni Organik',
  websiteName: 'TaniCo — Sayur Segar Organik',
  address: DEFAULT_ADDRESS,
  googleMapsUrl: normalizeEmbedMapsUrl('', DEFAULT_ADDRESS),
  whatsappNumber: '+628127300400',
  instagramUrl: 'https://instagram.com/tanico.bangka',
  facebookUrl: 'https://facebook.com/TaniCoBangka',
  emailAddress: 'halo@tanico.id',
  operationalHours: 'Setiap Hari: 07.00 - 17.00 WIB',
  footerText: '© 2026 TaniCo. Hak Cipta Dilindungi.',
  seoKeywords: 'sayur organik, sayur segar bangka, tanico, sayur sehat',
  homepageCMS: '{}',
  contactsCMS: '{}'
};

function enrichSettingMaps(settingObj) {
  const base = settingObj || DEFAULT_SETTINGS;
  const embedMapsUrl = normalizeEmbedMapsUrl(base.googleMapsUrl, base.address);
  const externalMapsUrl = buildExternalMapsUrl(base.googleMapsUrl, base.address);
  return {
    ...base,
    embedMapsUrl,
    externalMapsUrl
  };
}

export async function getSettings(req, res) {
  try {
    const setting = await prisma.websiteSetting.findFirst().catch(() => null);
    if (!setting) {
      return res.json(enrichSettingMaps(DEFAULT_SETTINGS));
    }
    return res.json(enrichSettingMaps(setting));
  } catch (error) {
    console.error('getSettings error:', error);
    return res.json(enrichSettingMaps(DEFAULT_SETTINGS));
  }
}

export async function getLocationInfo(req, res) {
  try {
    const setting = (await prisma.websiteSetting.findFirst().catch(() => null)) || DEFAULT_SETTINGS;
    const storeAddress = setting.address || DEFAULT_ADDRESS;
    const storeName = setting.logoText || 'TaniCo';

    let storeGeo = null;
    let storeGeocodeWarning = null;
    try {
      storeGeo = await geocodeQuery(storeAddress);
    } catch (geoErr) {
      console.warn('[LocationAPI] Store geocoding warning:', geoErr.message);
      storeGeocodeWarning = geoErr.message;
    }

    const storeCoords = storeGeo ? { lat: storeGeo.lat, lng: storeGeo.lng } : null;
    const storePayload = {
      name: storeName,
      address: storeAddress,
      operationalHours: setting.operationalHours || DEFAULT_SETTINGS.operationalHours,
      displayName: storeGeo?.displayName || storeAddress,
      area: storeGeo?.area || null,
      coordinates: storeCoords,
      geocoded: Boolean(storeCoords),
      embedUrl: normalizeEmbedMapsUrl(setting.googleMapsUrl, storeAddress, storeCoords),
      externalMapsUrl: buildExternalMapsUrl(setting.googleMapsUrl, storeAddress, storeCoords)
    };

    const rawLat = req.query?.lat;
    const rawLon = req.query?.lon ?? req.query?.lng;
    const rawSearchQuery = typeof req.query?.q === 'string' ? req.query.q.trim() : '';

    // 1. Reverse-geocoding user's live browser coordinates
    if (rawLat !== undefined && rawLon !== undefined && rawLat !== '' && rawLon !== '') {
      const lat = Number(rawLat);
      const lng = Number(rawLon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          error: 'Parameter koordinat lokasi (lat/lon) tidak valid.'
        });
      }

      let userGeo = null;
      try {
        userGeo = await reverseGeocodeCoords(lat, lng);
      } catch (revErr) {
        console.error('[LocationAPI] Reverse geocoding error:', revErr.message);
        return res.status(502).json({
          success: false,
          error: 'Gagal menerjemahkan koordinat lokasi melalui layanan peta. Silakan coba beberapa saat lagi.',
          store: storePayload
        });
      }

      const distanceKm = storeCoords
        ? calculateDistanceKm(lat, lng, storeCoords.lat, storeCoords.lng)
        : null;

      const destinationParam = storeCoords
        ? `${storeCoords.lat},${storeCoords.lng}`
        : storeAddress;

      return res.json({
        success: true,
        store: storePayload,
        userLocation: {
          source: 'gps',
          coordinates: { lat, lng },
          displayName: userGeo.displayName,
          area: userGeo.area,
          distanceKm,
          embedUrl: `https://maps.google.com/maps?q=${lat},${lng}&hl=id&z=15&output=embed`,
          directionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(destinationParam)}&travelmode=driving`
        }
      });
    }

    // 2. Geocoding user's manual area/subdistrict search query
    if (rawSearchQuery) {
      let searchedGeo = null;
      try {
        searchedGeo = await geocodeQuery(rawSearchQuery);
      } catch (searchErr) {
        console.error('[LocationAPI] Search geocoding error:', searchErr.message);
        return res.status(502).json({
          success: false,
          error: 'Gagal menghubungi layanan pencarian lokasi. Silakan periksa koneksi dan coba lagi.',
          store: storePayload
        });
      }

      if (!searchedGeo) {
        return res.status(404).json({
          success: false,
          error: `Lokasi "${rawSearchQuery}" tidak ditemukan. Coba masukkan nama kecamatan atau kota yang lebih spesifik.`,
          store: storePayload
        });
      }

      const distanceKm = storeCoords
        ? calculateDistanceKm(searchedGeo.lat, searchedGeo.lng, storeCoords.lat, storeCoords.lng)
        : null;

      const destinationParam = storeCoords
        ? `${storeCoords.lat},${storeCoords.lng}`
        : storeAddress;

      return res.json({
        success: true,
        store: storePayload,
        userLocation: {
          source: 'search',
          coordinates: { lat: searchedGeo.lat, lng: searchedGeo.lng },
          displayName: searchedGeo.displayName,
          area: searchedGeo.area,
          distanceKm,
          embedUrl: `https://maps.google.com/maps?q=${searchedGeo.lat},${searchedGeo.lng}&hl=id&z=14&output=embed`,
          directionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${searchedGeo.lat},${searchedGeo.lng}&destination=${encodeURIComponent(destinationParam)}&travelmode=driving`
        }
      });
    }

    // 3. Default: Return store location payload
    return res.json({
      success: true,
      store: storePayload,
      userLocation: null,
      ...(storeGeocodeWarning ? { warning: storeGeocodeWarning } : {})
    });
  } catch (error) {
    console.error('getLocationInfo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi gangguan pada server saat memuat data lokasi.'
    });
  }
}

export async function updateSettings(req, res) {
  try {
    const body = req.body || {};
    let setting = await prisma.websiteSetting.findFirst();

    if (!setting) {
      setting = await prisma.websiteSetting.create({
        data: {
          id: 'default',
          ...DEFAULT_SETTINGS,
          ...body,
          ...(body.homepageCMS && typeof body.homepageCMS === 'object' && {
            homepageCMS: JSON.stringify(body.homepageCMS)
          }),
          ...(body.contactsCMS && typeof body.contactsCMS === 'object' && {
            contactsCMS: JSON.stringify(body.contactsCMS)
          })
        }
      });
    } else {
      setting = await prisma.websiteSetting.update({
        where: { id: setting.id },
        data: {
          ...body,
          ...(body.homepageCMS && typeof body.homepageCMS === 'object' && {
            homepageCMS: JSON.stringify(body.homepageCMS)
          }),
          ...(body.contactsCMS && typeof body.contactsCMS === 'object' && {
            contactsCMS: JSON.stringify(body.contactsCMS)
          })
        }
      });
    }

    clearHomeCache();
    clearCacheByPrefix('location_');
    return res.json(enrichSettingMaps(setting));
  } catch (error) {
    console.error('updateSettings error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui pengaturan' });
  }
}

