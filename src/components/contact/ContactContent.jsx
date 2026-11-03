"use client";

import React, { useState, useCallback } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  LocateFixed,
  Navigation,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import { useLayout } from '@/context/LayoutContext';

function buildSafeEmbedUrl(rawUrl, fallbackAddress) {
  const clean = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (clean && (/\/maps\/embed/i.test(clean) || /[?&]output=embed/i.test(clean))) {
    return clean;
  }
  const query = (fallbackAddress && String(fallbackAddress).trim()) || 'Pemali, Kabupaten Bangka';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=id&z=15&output=embed`;
}

export default function ContactContent({ initialSettings = null }) {
  const { addToast } = useLayout();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  // Location API & user geolocation states
  const [storeLocation, setStoreLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [activeMapView, setActiveMapView] = useState('store'); // 'store' | 'user'
  const [isLoadingStoreLocation, setIsLoadingStoreLocation] = useState(true);
  const [isDetectingUser, setIsDetectingUser] = useState(false);
  const [locationApiError, setLocationApiError] = useState('');
  const [detectError, setDetectError] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [showManualSearch, setShowManualSearch] = useState(false);

  const fetchStoreLocation = useCallback(async () => {
    setIsLoadingStoreLocation(true);
    setLocationApiError('');
    try {
      const res = await fetch('/api/settings/location', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Respons server lokasi bukan format JSON yang valid.');
      }

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || `Gagal memuat data lokasi (HTTP ${res.status}).`);
      }

      if (data.store) {
        setStoreLocation(data.store);
      }
    } catch (err) {
      console.error('Error fetching /api/settings/location:', err);
      setLocationApiError(
        err?.message || 'Tidak dapat terhubung ke layanan API lokasi. Menampilkan peta berdasarkan alamat kantor.'
      );
    } finally {
      setIsLoadingStoreLocation(false);
    }
  }, []);

  const hasInitialSettings = Boolean(initialSettings);
  const isInitialFallback = Boolean(initialSettings?._isFallback);

  React.useEffect(() => {
    let isMounted = true;

    async function syncSettingsAndLocation() {
      // Always refresh settings from live API when initialSettings is absent or build-time fallback
      if (!hasInitialSettings || isInitialFallback) {
        try {
          const res = await fetch('/api/settings', {
            headers: { Accept: 'application/json' },
            cache: 'no-store'
          });
          if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            const data = await res.json();
            if (isMounted && data) {
              setSettings(data);
            }
          }
        } catch (err) {
          console.error('Error fetching /api/settings:', err);
        }
      }

      if (isMounted) {
        await fetchStoreLocation();
      }
    }

    syncSettingsAndLocation();
    return () => {
      isMounted = false;
    };
  }, [hasInitialSettings, isInitialFallback, fetchStoreLocation]);

  const resolveCoordsViaApi = async (lat, lon) => {
    const res = await fetch(
      `/api/settings/location?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      }
    );

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Format respons API lokasi tidak valid.');
    }

    const payload = await res.json();
    if (!res.ok || payload.success === false) {
      throw new Error(payload.error || 'Gagal memuat detail lokasi Anda dari server.');
    }

    if (payload.store) {
      setStoreLocation(payload.store);
    }
    if (payload.userLocation) {
      setUserLocation(payload.userLocation);
      setActiveMapView('user');
      setShowManualSearch(false);
      if (addToast) {
        addToast('Lokasi Anda berhasil terdeteksi!', 'success');
      }
    }
  };

  const handleDetectMyLocation = () => {
    setDetectError('');

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setDetectError('Browser perangkat Anda tidak mendukung fitur deteksi lokasi otomatis. Gunakan pencarian kecamatan di bawah.');
      setShowManualSearch(true);
      return;
    }

    if (window.isSecureContext === false) {
      setDetectError('Deteksi lokasi browser memerlukan koneksi aman (HTTPS). Silakan akses melalui HTTPS atau cari kecamatan secara manual.');
      setShowManualSearch(true);
      return;
    }

    setIsDetectingUser(true);

    const onGeoSuccess = async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        await resolveCoordsViaApi(latitude, longitude);
      } catch (apiErr) {
        setDetectError(apiErr?.message || 'Gagal menghubungkan koordinat ke API lokasi.');
        setShowManualSearch(true);
      } finally {
        setIsDetectingUser(false);
      }
    };

    const onFinalGeoError = (geoErr) => {
      setIsDetectingUser(false);
      setShowManualSearch(true);
      if (geoErr.code === 1) {
        setDetectError(
          'Akses lokasi ditolak atau dibatasi oleh pengaturan izin browser. Izinkan akses lokasi pada browser Anda atau masukkan nama kecamatan di bawah.'
        );
      } else if (geoErr.code === 2) {
        setDetectError(
          'Sinyal lokasi perangkat tidak tersedia saat ini. Pastikan GPS/Layanan Lokasi aktif atau cari kecamatan secara manual.'
        );
      } else if (geoErr.code === 3) {
        setDetectError(
          'Waktu deteksi lokasi habis. Silakan coba lagi di area dengan sinyal lebih stabil atau masukkan kecamatan Anda.'
        );
      } else {
        setDetectError('Tidak dapat membaca lokasi perangkat. Silakan gunakan pencarian kecamatan di bawah.');
      }
    };

    navigator.geolocation.getCurrentPosition(
      onGeoSuccess,
      (firstErr) => {
        // Fallback to network/Wi-Fi triangulation if high-accuracy GPS times out or fails indoors on mobile/desktop
        if (firstErr.code === 2 || firstErr.code === 3) {
          navigator.geolocation.getCurrentPosition(
            onGeoSuccess,
            onFinalGeoError,
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000
            }
          );
          return;
        }
        onFinalGeoError(firstErr);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  };

  const handleManualLocationSearch = async (e) => {
    e.preventDefault();
    const q = manualQuery.trim();
    if (!q) return;

    setIsDetectingUser(true);
    setDetectError('');

    try {
      const res = await fetch(`/api/settings/location?q=${encodeURIComponent(q)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Format respons API pencarian lokasi tidak valid.');
      }

      const payload = await res.json();
      if (!res.ok || payload.success === false) {
        throw new Error(payload.error || 'Lokasi tidak ditemukan.');
      }

      if (payload.store) {
        setStoreLocation(payload.store);
      }
      if (payload.userLocation) {
        setUserLocation(payload.userLocation);
        setActiveMapView('user');
        if (addToast) {
          addToast('Lokasi berhasil ditemukan melalui API!', 'success');
        }
      }
    } catch (err) {
      setDetectError(err?.message || 'Gagal mencari lokasi melalui API.');
    } finally {
      setIsDetectingUser(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      if (addToast) addToast('Harap lengkapi nama, email, dan pesan Anda.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      if (res.ok) {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        if (addToast) {
          addToast('Pesan Anda berhasil dikirim! Tim TaniCo akan segera menghubungi Anda.', 'success');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (addToast) addToast(errData.error || 'Gagal mengirim pesan.', 'error');
      }
    } catch (err) {
      if (addToast) addToast('Terjadi kesalahan saat mengirim pesan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedAddress = storeLocation?.address || settings?.address || '-';

  const contactDetails = [
    {
      icon: <Phone className="w-5 h-5 text-[#1B4D3E]" />,
      title: "Nomor WhatsApp",
      detail: settings?.whatsappNumber || "-",
      sub: "Layanan Pelanggan"
    },
    {
      icon: <Mail className="w-5 h-5 text-[#1B4D3E]" />,
      title: "Email Dukungan",
      detail: settings?.emailAddress || "-",
      sub: "Balasan maksimal dalam 24 jam kerja"
    },
    {
      icon: <MapPin className="w-5 h-5 text-[#1B4D3E]" />,
      title: "Alamat Kantor",
      detail: resolvedAddress,
      sub: "Pusat Distribusi & Pengemasan"
    },
    {
      icon: <Clock className="w-5 h-5 text-[#1B4D3E]" />,
      title: "Jam Operasional",
      detail: settings?.operationalHours || "-",
      sub: "Pengiriman fajar terjadwal"
    }
  ];

  const storeEmbedUrl =
    storeLocation?.embedUrl ||
    settings?.embedMapsUrl ||
    buildSafeEmbedUrl(settings?.googleMapsUrl, resolvedAddress);

  const activeEmbedUrl =
    activeMapView === 'user' && userLocation?.embedUrl ? userLocation.embedUrl : storeEmbedUrl;

  const externalStoreMapsUrl =
    storeLocation?.externalMapsUrl ||
    settings?.externalMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      resolvedAddress !== '-' ? resolvedAddress : 'Pemali, Kabupaten Bangka'
    )}`;

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-12 sm:pb-16 lg:pb-24 text-left select-none">
      {/* Banner Cover */}
      <section className="bg-[#1B4D3E] text-white py-12 sm:py-16 lg:py-24 px-5 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-[#A3E635]">
          </span>
          <h1 className="text-[24px] sm:text-[30px] lg:text-[38px] font-bold font-sans mt-3 sm:mt-4 tracking-tight leading-snug sm:leading-tight">
            Kami Siap Melayani Anda
          </h1>
          <p className="mt-3 sm:mt-4 text-[13px] sm:text-[14px] lg:text-[15px] text-[#E3EBF0]/80 font-light leading-relaxed">
            Butuh bantuan pemesanan? Punya pertanyaan tentang kemitraan tani, atau ingin mengajukan saran kerja sama? Sampaikan pesan Anda di bawah ini.
          </p>
        </div>
      </section>

      {/* Main Grid content */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mt-10 sm:mt-14 lg:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-[18px] sm:text-[26px] lg:text-[32px] font-bold font-sans text-[#1B4D3E]">Informasi Kontak</h2>
              <p className="text-gray-500 text-[12px] sm:text-[13px] lg:text-[14px]">Hubungi kami melalui kanal bantuan resmi atau kunjungi langsung titik pengemasan kami.</p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {contactDetails.map((det, i) => (
                <div key={i} className="flex gap-4 p-4 sm:p-5 bg-white border border-[#DDE9DF] rounded-2xl">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center shrink-0">
                    {det.icon}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold tracking-wider">{det.title}</p>
                    <p className="font-bold text-[#1B4D3E] text-[14px] sm:text-[15px] lg:text-[16px]">{det.detail}</p>
                    <p className="text-[12px] sm:text-[13px] lg:text-[14px] text-gray-500">{det.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Feedback Form Column */}
          <div className="lg:col-span-7 bg-white border border-[#DDE9DF] rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xs">
            <h3 className="text-[18px] sm:text-[26px] lg:text-[32px] font-bold font-sans text-[#1B4D3E] mb-5 sm:mb-6">Kirim Pesan Langsung</h3>
            
            <form suppressHydrationWarning onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1">
                  <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-gray-400 tracking-wider block">Nama Lengkap</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    required
                    placeholder="Nama Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 sm:h-11 bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-[13px] sm:text-[14px] px-3.5 sm:px-4 outline-none transition-all duration-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-gray-400 tracking-wider block">Alamat Email</label>
                  <input
                    suppressHydrationWarning
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 sm:h-11 bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-[13px] sm:text-[14px] px-3.5 sm:px-4 outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-gray-400 tracking-wider block">Subjek</label>
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Judul topik pesan"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 sm:h-11 bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-[13px] sm:text-[14px] px-3.5 sm:px-4 outline-none transition-all duration-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-gray-400 tracking-wider block">Isi Pesan Anda</label>
                <textarea
                  suppressHydrationWarning
                  rows={4}
                  required
                  placeholder="Tuliskan pesan atau masukan secara lengkap..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-[13px] sm:text-[14px] p-3.5 sm:p-4 outline-none transition-all duration-300 resize-none"
                />
              </div>

              <button
                suppressHydrationWarning
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#143D31] active:bg-[#0F2D24] text-white font-semibold text-[12px] sm:text-[13px] lg:text-[14px] rounded-full shadow-md transition-all duration-300 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Kirim Pesan Sekarang</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Location & Interactive Map Section */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mt-10 sm:mt-14 lg:mt-16">
        <div className="bg-white border border-[#DDE9DF] rounded-3xl p-4 sm:p-6 overflow-hidden shadow-xs space-y-4">
          {/* Location Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#1B4D3E]">
                <MapPin className="w-4 h-4 shrink-0" />
                <h3 className="text-[15px] sm:text-[18px] font-bold font-sans">
                  Lokasi Titik Pengemasan & Distribusi TaniCo
                </h3>
              </div>
              <p className="text-[12px] sm:text-[13px] text-gray-500">
                {storeLocation?.displayName || resolvedAddress}
                {storeLocation?.coordinates && (
                  <span className="text-gray-400">
                    {' '}
                    · ({storeLocation.coordinates.lat.toFixed(5)}, {storeLocation.coordinates.lng.toFixed(5)})
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleDetectMyLocation}
                disabled={isDetectingUser}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1B4D3E] hover:bg-[#143D31] text-white text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {isDetectingUser ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5" />
                )}
                <span>{isDetectingUser ? 'Mendeteksi Lokasi...' : 'Deteksi Lokasi Saya'}</span>
              </button>

              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setShowManualSearch((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FCFCFC] hover:bg-gray-100 border border-[#DDE9DF] text-[#1B4D3E] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari Kecamatan</span>
              </button>

              <a
                href={externalStoreMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FCFCFC] hover:bg-gray-100 border border-[#DDE9DF] text-[#1B4D3E] text-[12px] font-semibold transition-colors whitespace-nowrap"
              >
                <span>Buka Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Optional Manual Kecamatan/Area Search Bar */}
          {showManualSearch && (
            <form
              suppressHydrationWarning
              onSubmit={handleManualLocationSearch}
              className="flex flex-col sm:flex-row gap-2.5 p-3.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-2xl"
            >
              <input
                suppressHydrationWarning
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Masukkan kecamatan atau kota Anda (contoh: Sungailiat, Bangka)..."
                className="flex-1 h-10 bg-white border border-[#DDE9DF] focus:border-[#1B4D3E] rounded-xl text-[13px] px-3.5 outline-none"
              />
              <button
                suppressHydrationWarning
                type="submit"
                disabled={isDetectingUser || !manualQuery.trim()}
                className="h-10 px-5 rounded-xl bg-[#1B4D3E] hover:bg-[#143D31] text-white text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Cek Jarak & Lokasi
              </button>
            </form>
          )}

          {/* Store Location API Error Notice (Non-destructive) */}
          {locationApiError && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[12px] sm:text-[13px]">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{locationApiError}</span>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                onClick={fetchStoreLocation}
                disabled={isLoadingStoreLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStoreLocation ? 'animate-spin' : ''}`} />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {/* Browser Geolocation / Lookup Error Notice (Non-destructive) */}
          {detectError && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-[12px] sm:text-[13px]">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{detectError}</span>
              </div>
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleDetectMyLocation}
                disabled={isDetectingUser}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDetectingUser ? 'animate-spin' : ''}`} />
                <span>Ulangi Deteksi</span>
              </button>
            </div>
          )}

          {/* Detected User Location Info & Route Switcher */}
          {userLocation && (
            <div className="p-4 rounded-2xl bg-[#FCFCFC] border border-[#DDE9DF] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-wider text-[#1B4D3E]">
                  LOKASI ANDA TERDETEKSI
                  {typeof userLocation.distanceKm === 'number'
                    ? ` · SEKITAR ${userLocation.distanceKm} KM DARI TANICO`
                    : ''}
                </p>
                <p className="text-[13px] sm:text-[14px] font-semibold text-[#111111]">
                  {userLocation.displayName}
                </p>
                {userLocation.coordinates && (
                  <p className="text-[11px] sm:text-[12px] text-gray-500">
                    Koordinat: {userLocation.coordinates.lat.toFixed(5)}, {userLocation.coordinates.lng.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="inline-flex p-1 rounded-xl bg-white border border-[#DDE9DF]">
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setActiveMapView('store')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      activeMapView === 'store'
                        ? 'bg-[#1B4D3E] text-white'
                        : 'text-gray-600 hover:text-[#1B4D3E]'
                    }`}
                  >
                    Titik TaniCo
                  </button>
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setActiveMapView('user')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      activeMapView === 'user'
                        ? 'bg-[#1B4D3E] text-white'
                        : 'text-gray-600 hover:text-[#1B4D3E]'
                    }`}
                  >
                    Lokasi Saya
                  </button>
                </div>

                {userLocation.directionsUrl && (
                  <a
                    href={userLocation.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#143D31] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Petunjuk Rute</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Embedded Map Viewport */}
          <div className="aspect-[16/10] sm:aspect-[21/9] min-h-[240px] rounded-2xl overflow-hidden bg-gray-100 relative">
            <iframe
              key={activeEmbedUrl}
              title="Peta Lokasi TaniCo"
              src={activeEmbedUrl}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

