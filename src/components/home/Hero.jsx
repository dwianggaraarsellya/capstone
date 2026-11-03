"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image, { getImageProps } from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { buildStorageUrl } from '@/utils/buildStorageUrl';

const jost = { className: 'font-jost' };

function resolveHeroImageProps(src, alt, isPriority) {
  if (!src) return null;
  try {
    return getImageProps({
      src,
      alt,
      fill: true,
      sizes: '100vw',
      quality: 85,
      priority: isPriority,
    }).props;
  } catch (_) {
    return {
      alt,
      decoding: 'async',
      loading: isPriority ? 'eager' : 'lazy',
      fetchPriority: isPriority ? 'high' : undefined,
      style: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        color: 'transparent',
      },
      sizes: '100vw',
      srcSet: undefined,
      src,
    };
  }
}

function BenefitImage({ src, alt }) {
  const [cleanSrc, setCleanSrc] = useState(null);

  useEffect(() => {
    if (!src) return;
    let isCancelled = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = 256;
        const height = 256;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let qStart = 0;
        let qEnd = 0;

        const isBg = (idx) => {
          const p = idx * 4;
          return Math.min(data[p], data[p + 1], data[p + 2]) >= 230;
        };

        for (let x = 0; x < width; x++) {
          if (isBg(x)) {
            visited[x] = 1;
            queue[qEnd++] = x;
          }
          const b = (height - 1) * width + x;
          if (isBg(b) && !visited[b]) {
            visited[b] = 1;
            queue[qEnd++] = b;
          }
        }
        for (let y = 0; y < height; y++) {
          const l = y * width;
          if (isBg(l) && !visited[l]) {
            visited[l] = 1;
            queue[qEnd++] = l;
          }
          const r = y * width + (width - 1);
          if (isBg(r) && !visited[r]) {
            visited[r] = 1;
            queue[qEnd++] = r;
          }
        }

        while (qStart < qEnd) {
          const curr = queue[qStart++];
          const cx = curr % width;
          const cy = (curr / width) | 0;

          if (cx > 0) {
            const n = curr - 1;
            if (!visited[n] && isBg(n)) {
              visited[n] = 1;
              queue[qEnd++] = n;
            }
          }
          if (cx < width - 1) {
            const n = curr + 1;
            if (!visited[n] && isBg(n)) {
              visited[n] = 1;
              queue[qEnd++] = n;
            }
          }
          if (cy > 0) {
            const n = curr - width;
            if (!visited[n] && isBg(n)) {
              visited[n] = 1;
              queue[qEnd++] = n;
            }
          }
          if (cy < height - 1) {
            const n = curr + width;
            if (!visited[n] && isBg(n)) {
              visited[n] = 1;
              queue[qEnd++] = n;
            }
          }
        }

        if (qEnd > 0) {
          for (let i = 0; i < width * height; i++) {
            if (visited[i]) {
              const p = i * 4;
              const minC = Math.min(data[p], data[p + 1], data[p + 2]);
              if (minC >= 244) {
                data[p + 3] = 0;
              } else {
                data[p + 3] = Math.round(255 * (244 - minC) / (244 - 230));
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          const transparentUrl = canvas.toDataURL('image/png');
          if (!isCancelled) {
            setCleanSrc(transparentUrl);
          }
        } else if (!isCancelled) {
          setCleanSrc(src);
        }
      } catch (_) {
        if (!isCancelled) {
          setCleanSrc(src);
        }
      }
    };

    img.onerror = () => {
      if (!isCancelled) {
        setCleanSrc(src);
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [src]);

  const displaySrc = cleanSrc || src;

  return (
    <div className="relative w-full max-w-[80px] h-[70px] sm:w-[88px] sm:h-[88px] mb-2 sm:mb-3 bg-transparent">
      <Image
        src={displaySrc}
        alt={alt || ''}
        fill
        unoptimized={Boolean(cleanSrc && cleanSrc.startsWith('data:'))}
        sizes="(max-width: 640px) 80px, 88px"
        style={cleanSrc ? undefined : { mixBlendMode: 'multiply' }}
        className={`object-contain select-none pointer-events-none bg-transparent ${
          cleanSrc ? '' : 'mix-blend-multiply contrast-[105%]'
        }`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

function Hero({ cms, heroBanners = [], heroBenefits: initialHeroBenefits = [], onExploreClick, isLoading = false }) {
  const router = useRouter();
  const heroCms = cms || {};

  // 1. Resolve initial slides from heroBanners prop, then heroCms.slides, then heroCms.banners
  const initialPropSlides = (Array.isArray(heroBanners) && heroBanners.length > 0)
    ? heroBanners
    : (Array.isArray(heroCms.slides) && heroCms.slides.length > 0
      ? heroCms.slides
      : (Array.isArray(heroCms.banners) && heroCms.banners.length > 0
        ? heroCms.banners
        : []));

  const [clientSlides, setClientSlides] = useState(initialPropSlides);
  const [clientBenefits, setClientBenefits] = useState(
    Array.isArray(initialHeroBenefits) && initialHeroBenefits.length > 0
      ? initialHeroBenefits
      : (Array.isArray(heroCms.benefits) ? heroCms.benefits : [])
  );

  // Sync state if props update
  useEffect(() => {
    if (initialPropSlides.length > 0) {
      setClientSlides(initialPropSlides);
    }
  }, [initialPropSlides]);

  useEffect(() => {
    if (Array.isArray(initialHeroBenefits) && initialHeroBenefits.length > 0) {
      setClientBenefits(initialHeroBenefits);
    } else if (Array.isArray(heroCms.benefits) && heroCms.benefits.length > 0) {
      setClientBenefits(heroCms.benefits);
    }
  }, [initialHeroBenefits, heroCms.benefits]);

  // Client-side fallback: fetch /api/hero-banners if still empty
  useEffect(() => {
    if (clientSlides.length === 0) {
      let isMounted = true;
      fetch('/api/hero-banners')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setClientSlides(data);
          }
        })
        .catch((err) => console.error('Failed to fetch /api/hero-banners in Hero:', err));
      return () => {
        isMounted = false;
      };
    }
  }, [clientSlides.length]);

  // Client-side fallback: fetch /api/hero-benefits if still empty
  useEffect(() => {
    if (clientBenefits.length === 0) {
      let isMounted = true;
      fetch('/api/hero-benefits')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setClientBenefits(data);
          }
        })
        .catch((err) => console.error('Failed to fetch /api/hero-benefits in Hero:', err));
      return () => {
        isMounted = false;
      };
    }
  }, [clientBenefits.length]);

  const rawSlides = clientSlides.length > 0 ? clientSlides : initialPropSlides;
  const filteredSlides = rawSlides.filter(
    (slide) => slide && (heroCms.allowInactive ? true : slide.active !== false)
  );

  // Fallback slide from hero CMS if no banner is available in database
  const slides = filteredSlides.length > 0
    ? filteredSlides
    : (heroCms.title ? [{
        id: 'default-hero-slide',
        title: heroCms.title,
        subtitle: heroCms.subtitle || '',
        badge: heroCms.badge || '100% Organik & Segar',
        description: heroCms.description || 'Dipanen pagi hari, dikemas higienis, dan dikirim langsung ke rumah Anda di hari yang sama.',
        buttonText: heroCms.ctaText || heroCms.buttonText || 'Belanja Sekarang',
        buttonLink: heroCms.ctaLink || heroCms.buttonLink || '/produk',
        image: heroCms.image || heroCms.desktopImage || '',
        desktopImage: heroCms.desktopImage || heroCms.image || '',
        mobileImage: heroCms.mobileImage || heroCms.image || '',
        active: true,
        background: heroCms.background || '#ECF6ED',
        overlay: Number(heroCms.overlay) || 0,
        sortOrder: 0
      }] : []);

  const heroBenefits = clientBenefits.length > 0 ? clientBenefits : (Array.isArray(heroCms.benefits) ? heroCms.benefits : []);

  const defaultIdx = typeof heroCms.defaultFirstSlideIdx === 'number' && heroCms.defaultFirstSlideIdx < slides.length
    ? heroCms.defaultFirstSlideIdx 
    : 0;

  const [activeIndex, setActiveIndex] = useState(defaultIdx);
  const [isPaused, setIsPaused] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mobileImageError, setMobileImageError] = useState(false);
  const intervalRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const activeSlide = slides[activeIndex] || slides[0] || {};
  const explicitDesk =
    typeof activeSlide.desktopImage === 'string' && activeSlide.desktopImage.trim()
      ? activeSlide.desktopImage.trim()
      : typeof activeSlide.image === 'string'
      ? activeSlide.image.trim()
      : '';
  const explicitMob =
    typeof activeSlide.mobileImage === 'string' ? activeSlide.mobileImage.trim() : '';

  const deskImg = explicitDesk ? buildStorageUrl(explicitDesk) : '';
  const mobileImg = explicitMob ? buildStorageUrl(explicitMob) : '';

  useEffect(() => {
    setImageError(false);
    setMobileImageError(false);
  }, [activeIndex, deskImg, mobileImg]);

  const totalSlides = slides.length;
  const autoplayEnabled = heroCms.autoplay ?? true;
  const autoplaySpeed = parseInt(heroCms.autoplaySpeed || '5000', 10);

  useEffect(() => {
    if (typeof heroCms.defaultFirstSlideIdx === 'number') {
      const idx = heroCms.defaultFirstSlideIdx;
      if (idx >= 0 && idx < slides.length) {
        setActiveIndex(idx);
      }
    }
  }, [heroCms.defaultFirstSlideIdx, slides.length]);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!autoplayEnabled || totalSlides <= 1 || isPaused || isLoading || heroCms.show === false) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, autoplaySpeed);
  }, [totalSlides, isPaused, autoplayEnabled, autoplaySpeed, isLoading, heroCms.show]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoplay]);

  const handleTouchStart = (e) => {
    if (!(heroCms.swipeEnabled ?? true)) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!(heroCms.swipeEnabled ?? true)) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!(heroCms.swipeEnabled ?? true)) return;
    const swipeSensitivity = parseInt(heroCms.swipeSensitivity ?? '50', 10);
    const distance = touchStartX.current - touchEndX.current;
    
    if (distance > swipeSensitivity) {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
      if (intervalRef.current) clearInterval(intervalRef.current);
      startAutoplay();
    } else if (distance < -swipeSensitivity) {
      setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
      if (intervalRef.current) clearInterval(intervalRef.current);
      startAutoplay();
    }
  };

  if (heroCms.show === false) return null;

  if (isLoading) {
    return (
      <section id="hero-section" className={`${jost.className} bg-[#FCFCFC] relative overflow-hidden pt-10 pb-14`}>
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8">
          <div className="w-full h-[380px] md:h-[420px] rounded-2xl bg-gray-100 animate-pulse border border-gray-200/60 flex flex-col justify-between p-8 md:p-12">
            <div className="space-y-4 max-w-xl">
              <div className="h-4 w-28 bg-gray-200/80 rounded-full animate-pulse" />
              <div className="h-8 w-3/4 bg-gray-200/80 rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-gray-200/80 rounded animate-pulse" />
              <div className="h-10 w-36 bg-gray-200/80 rounded-full animate-pulse mt-4" />
            </div>
            <div className="flex gap-2">
              <div className="h-2 w-8 bg-gray-300 rounded-full animate-pulse" />
              <div className="h-2 w-2 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-2 w-2 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
          <div id="hero-benefits-skeleton" className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-6 mt-8 md:mt-10 w-full animate-pulse bg-transparent">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="flex flex-col items-center text-center sm:items-start sm:text-left space-y-2 bg-transparent">
                <div className="w-[60px] h-[60px] bg-gray-200/60 rounded-lg" />
                <div className="h-4 w-28 bg-gray-200/60 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const goToSlide = (index) => {
    setActiveIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    startAutoplay();
  };

  const slideImg = deskImg || mobileImg;
  const slideMobileImg = !mobileImageError && mobileImg ? mobileImg : slideImg;
  const hasDistinctMobileImg = Boolean(
    slideMobileImg && slideImg && slideMobileImg !== slideImg
  );

  const slideAlt = activeSlide.altText || activeSlide.badge || activeSlide.title || 'Hero Banner';
  const isFirstSlide = activeIndex === 0;
  const desktopPictureProps = resolveHeroImageProps(slideImg, slideAlt, isFirstSlide);
  const mobilePictureProps = hasDistinctMobileImg
    ? resolveHeroImageProps(slideMobileImg, slideAlt, isFirstSlide)
    : null;

  const {
    style: baseDesktopStyle,
    className: _unusedClassName,
    alt: _unusedAlt,
    ...restDesktopAttrs
  } = desktopPictureProps || {};

  const handleBannerImageError = () => {
    if (
      hasDistinctMobileImg &&
      !mobileImageError &&
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches
    ) {
      setMobileImageError(true);
      return;
    }
    setImageError(true);
  };

  const desktopCropVal = activeSlide.desktopCrop || activeSlide.cropPosition || 'center center';
  const mobileCropVal = activeSlide.mobileCrop || activeSlide.cropPosition || 'center center';
  const desktopScaleVal = (parseFloat(activeSlide.desktopZoom || activeSlide.cropZoom || '100') || 100) / 100;
  const mobileScaleVal = (parseFloat(activeSlide.mobileZoom || activeSlide.cropZoom || '100') || 100) / 100;

  const desktopHeightVal = typeof heroCms.desktopHeight === 'number' ? `${heroCms.desktopHeight}px` : (heroCms.desktopHeight || '420px');
  const mobileHeightVal = typeof heroCms.mobileHeight === 'number' ? `${heroCms.mobileHeight}px` : (heroCms.mobileHeight || '380px');
  const overlayOpacityVal = typeof activeSlide.overlay === 'number' ? activeSlide.overlay / 100 : (typeof heroCms.overlayOpacity === 'number' ? heroCms.overlayOpacity / 100 : 0);
  const blurFilterVal = (heroCms.blurStrength && parseInt(heroCms.blurStrength, 10) > 0) ? `blur(${parseInt(heroCms.blurStrength, 10)}px)` : '';

  const activeBenefits = (Array.isArray(heroBenefits) ? heroBenefits : [])
    .filter(b => b && (b.active !== false))
    .slice(0, 4);

  return (
    <section
      id="hero-section"
      suppressHydrationWarning
      className={`${jost.className} bg-[#FCFCFC] relative overflow-hidden pt-10 pb-14`}
    >
      <style suppressHydrationWarning>{`
        @media (min-width: 768px) {
          .dynamic-hero-height {
            height: ${desktopHeightVal} !important;
            min-height: ${desktopHeightVal} !important;
          }
          .hero-slide-img {
            object-position: ${desktopCropVal} !important;
            transform: scale(${desktopScaleVal}) !important;
            transform-origin: ${desktopCropVal} !important;
          }
        }
        @media (max-width: 767px) {
          .dynamic-hero-height {
            height: ${mobileHeightVal} !important;
            min-height: ${mobileHeightVal} !important;
          }
          .hero-slide-img {
            object-position: ${mobileCropVal} !important;
            transform: scale(${mobileScaleVal}) !important;
            transform-origin: ${mobileCropVal} !important;
          }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.01]" 
          style={{
            backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} 
        />
        <div 
          className="absolute -top-20 -left-20 w-[450px] h-[450px] rounded-full blur-[130px] bg-[#f3f4f6]/25" 
        />
        <div 
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full blur-[140px] bg-[#e5e7eb]/20" 
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div
          className="relative w-full dynamic-hero-height rounded-2xl overflow-hidden border border-[#E7E7E7] shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-colors duration-500 group/hero-container"
          style={{ backgroundColor: activeSlide.background || '#ECF6ED' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 w-full h-full">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full overflow-hidden"
              >
                {desktopPictureProps && !imageError ? (
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                      <picture suppressHydrationWarning className="block w-full h-full">
                        {hasDistinctMobileImg && mobilePictureProps && (
                          <source
                            suppressHydrationWarning
                            media="(max-width: 767px)"
                            sizes={mobilePictureProps.sizes || '100vw'}
                            srcSet={mobilePictureProps.srcSet || mobilePictureProps.src}
                          />
                        )}
                        {hasDistinctMobileImg && (
                          <source
                            suppressHydrationWarning
                            media="(min-width: 768px)"
                            sizes={desktopPictureProps.sizes || '100vw'}
                            srcSet={desktopPictureProps.srcSet || desktopPictureProps.src}
                          />
                        )}
                        <img
                          suppressHydrationWarning
                          alt={slideAlt}
                          onError={handleBannerImageError}
                          referrerPolicy="no-referrer"
                          className="object-cover hero-slide-img select-none pointer-events-none transition-all duration-700 ease-out origin-center"
                          style={{
                            ...baseDesktopStyle,
                            objectPosition: desktopCropVal,
                            transform: `scale(${desktopScaleVal})`,
                            transformOrigin: desktopCropVal,
                            ...(blurFilterVal ? { filter: blurFilterVal } : {})
                          }}
                          {...restDesktopAttrs}
                        />
                      </picture>
                    </div>
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center transition-colors duration-500" 
                    style={{ backgroundColor: activeSlide.background || '#ECF6ED' }}
                  />
                )}
                <div 
                  className="absolute inset-0 bg-black pointer-events-none transition-all duration-300"
                  style={{ opacity: overlayOpacityVal }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-start md:justify-end p-6 sm:p-8 md:p-10 lg:p-12">
            <div className="mb-2 md:mb-3 pt-4 md:pt-0 max-w-[560px] md:max-w-[55%]">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-1.5 md:space-y-2"
                >
                  {activeSlide.title && (
                    <h1 className="text-[22px] sm:text-[30px] lg:text-[38px] font-semibold leading-[1.08] tracking-tight text-black whitespace-pre-line">
                      {activeSlide.title}
                      {activeSlide.subtitle && (
                        <span className="block font-semibold text-black/80 mt-0.5 md:mt-1">
                          {activeSlide.subtitle}
                        </span>
                      )}
                    </h1>
                  )}
                  {activeSlide.description && (
                    <p className="text-[12px] sm:text-[14px] lg:text-[15px] text-black/70 leading-relaxed max-w-[560px] font-normal">
                      {activeSlide.description}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3 md:gap-4 w-full items-start max-w-[560px] md:max-w-[55%]">
              {slides.length > 1 && (
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-x-6 md:gap-x-8 lg:gap-x-10 gap-y-2 text-[12px] sm:text-[13px] md:text-[14px] font-medium select-none">
                    {slides.map((slide, idx) => {
                      const isActive = activeIndex === idx;
                      return (
                        <button
                          suppressHydrationWarning
                          key={slide.id || idx}
                          onClick={() => goToSlide(idx)}
                          className={`group flex flex-col items-start gap-1 transition-all duration-300 cursor-pointer ${
                            isActive ? 'opacity-100' : 'opacity-40 hover:opacity-75'
                          }`}
                        >
                          <span className="text-black tracking-wide">{slide.badge || `Slide ${idx + 1}`}</span>
                          <div className="w-full min-w-[40px] h-[2px] bg-black/30 rounded-full overflow-hidden relative">
                            {isActive && autoplayEnabled ? (
                              <motion.div
                                key={activeIndex}
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: autoplaySpeed / 1000, ease: 'linear' }}
                                className="absolute left-0 top-0 h-full bg-black rounded-full"
                              />
                            ) : isActive ? (
                              <div className="absolute left-0 top-0 h-full w-full bg-black rounded-full" />
                            ) : (
                              <div className="absolute left-0 top-0 h-full w-full bg-transparent rounded-full" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSlide.buttonText && (
                <Link
                  href={activeSlide.buttonLink || '/produk'}
                  prefetch={true}
                  className="group inline-flex items-center justify-center bg-[#174C3C] hover:bg-[#1F5C49] text-white px-4 py-2 sm:px-5 sm:py-2.5 text-[12px] sm:text-[13px] md:text-[14px] font-semibold rounded-full transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span>{activeSlide.buttonText}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {activeBenefits.length > 0 && (
          <div id="hero-benefits-section" className="w-full bg-transparent">
            <motion.div
              initial={false}
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-6 mt-8 md:mt-10 w-full bg-transparent"
            >
              {activeBenefits.map((card, idx) => {
                const cardTitle = card.title || card.value || '';
                const cardDesc = card.description || card.label || '';
                const rawImg = card.image || '';
                const imageSrc = rawImg ? (rawImg.startsWith('http://') || rawImg.startsWith('https://') ? rawImg : buildStorageUrl(rawImg)) : null;

                return (
                  <motion.div
                    key={card.id || idx}
                    initial={false}
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { duration: 0.3, ease: 'easeOut' },
                      },
                    }}
                    className="flex flex-col items-center text-center sm:items-start sm:text-left bg-transparent"
                  >
                    {imageSrc && (
                      <BenefitImage src={imageSrc} alt={cardTitle} />
                    )}
                    {cardTitle && (
                      <h3 className="text-[13px] sm:text-[14px] md:text-[16px] font-semibold text-black">
                        {cardTitle}
                      </h3>
                    )}
                    {cardDesc && (
                      <p className="hidden sm:block text-[12px] md:text-[14px] font-normal text-black/60 mt-1 leading-relaxed">
                        {cardDesc}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}

export default React.memo(Hero);