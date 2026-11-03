"use client";

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { buildStorageUrl } from '@/utils/buildStorageUrl';
import Image from 'next/image';
import { uploadFileToSupabase, createPreviewUrl, revokePreviewUrl } from '@/utils/uploadHelper';
import { formatRupiah } from '@/utils/formatters';
import { getHomepageCms } from '@/utils/cmsDefaults';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';
import Hero from '@/components/home/Hero';
import Categories from '@/components/category/Categories';
import FeaturedCarousel from '@/components/home/FeaturedCarousel';
import Gallery from '@/components/home/Gallery';

export default function AdminHomepagePage() {
  const {
    settings,
    handleSaveSettings: onSaveSettings,
    adminProfile,
    handleSaveAdminProfile: onSaveAdminProfile,
    addToast: onAddToast,
    handleAddActivityLog: onAddActivityLog,
    products = [],
    handleSaveProducts: onSaveProducts
  } = useAdmin();

  const relationalBenefitsRef = useRef([]);
  const previewUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(u => revokePreviewUrl(u));
      previewUrlsRef.current = [];
    };
  }, []);

  const [activeSubTab, setActiveSubTab] = useState('hero');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [settingsForm, setSettingsForm] = useState(settings);
  const [profileForm, setProfileForm] = useState(adminProfile);
  const [homepageCmsForm, setHomepageCmsForm] = useState(() => getHomepageCms(settings?.homepageCMS));
  const [categoriesForm, setCategoriesForm] = useState([]);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCategoriesForm(data || []);
      }
    } catch {
      setCategoriesForm([]);
    }
  };

  const loadHeroBanners = async () => {
    try {
      const res = await fetch('/api/admin/hero-banners', { headers: getAuthHeaders(), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHomepageCmsForm(prev => {
            const existingSlides = prev?.hero?.slides || [];
            const mergedSlides = data.map((b, idx) => {
              const existing = existingSlides.find(s => s.id === b.id) || existingSlides[idx];
              return {
                ...b,
                ...existing,
                id: b.id,
                title: existing?.title || b.title || `Slide ${idx + 1}`,
                subtitle: existing?.subtitle ?? b.subtitle ?? '',
                badge: existing?.badge ?? b.badge ?? '',
                description: existing?.description ?? b.description ?? '',
                buttonText: existing?.buttonText ?? b.buttonText ?? '',
                buttonLink: existing?.buttonLink ?? b.buttonLink ?? '',
                image: existing?.image || b.desktopImage || b.image || '',
                desktopImage: existing?.desktopImage || b.desktopImage || b.image || '',
                mobileImage: existing?.mobileImage || b.mobileImage || b.desktopImage || b.image || '',
                active: existing?.active ?? b.active ?? true,
                background: existing?.background || b.background || '#ECF6ED',
                sortOrder: typeof b.sortOrder === 'number' ? b.sortOrder : idx
              };
            });
            return {
              ...prev,
              hero: {
                ...(prev?.hero || {}),
                slides: mergedSlides
              }
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to load hero banners in admin:', err);
    }
  };

  const loadHeroBenefits = async () => {
    try {
      const res = await fetch('/api/admin/hero-benefits', { headers: getAuthHeaders(), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          relationalBenefitsRef.current = sorted;
          setHomepageCmsForm(prev => {
            const hero = { ...(prev?.hero || {}) };
            const existingBenefits = Array.isArray(hero.benefits) ? hero.benefits : [];
            const mergedBenefits = sorted.map((item, idx) => {
              const num = idx + 1;
              const existing = existingBenefits.find(it => it.id === item.id) || existingBenefits[idx] || {};
              const finalId = item.id || existing.id || hero[`stat${num}Id`];
              const finalTitle = item.title || item.value || existing.title || existing.value || hero[`stat${num}Value`] || '';
              const finalDesc = item.description || item.label || existing.description || existing.label || hero[`stat${num}Label`] || '';
              // Relational table HeroBenefit is the authoritative source for image
              const finalImage = item.image || existing.image || hero[`stat${num}Image`] || '';
              const finalSortOrder = typeof item.sortOrder === 'number' ? item.sortOrder : (existing.sortOrder ?? idx);
              const finalActive = item.active !== false;

              hero[`stat${num}Id`] = finalId;
              hero[`stat${num}Value`] = finalTitle;
              hero[`stat${num}Label`] = finalDesc;
              hero[`stat${num}Image`] = finalImage;
              hero[`stat${num}SortOrder`] = finalSortOrder;
              hero[`stat${num}Active`] = finalActive;

              return {
                id: finalId,
                title: finalTitle,
                description: finalDesc,
                value: finalTitle,
                label: finalDesc,
                image: finalImage,
                sortOrder: finalSortOrder,
                active: finalActive
              };
            });

            hero.benefits = mergedBenefits;
            return {
              ...prev,
              hero
            };
          });
          return sorted;
        }
      }
    } catch (err) {
      console.error('Failed to load hero benefits in admin:', err);
    }
    return null;
  };

  const mergeSettingsWithRelationalData = (settingsData) => {
    if (!settingsData) return;
    setSettingsForm(settingsData);

    const rawHomepageCMS = settingsData.homepageCMS;
    let homepageCMS = rawHomepageCMS;
    if (typeof rawHomepageCMS === 'string') {
      try {
        homepageCMS = JSON.parse(rawHomepageCMS);
      } catch {
        homepageCMS = {};
      }
    }
    const parsed = getHomepageCms(homepageCMS);

    setHomepageCmsForm(prev => {
      const prevHero = prev?.hero || {};
      const parsedHero = parsed?.hero || {};

      // Hero slides: ALWAYS prioritize valid relational slides already in prev.hero.slides
      let effectiveSlides = prevHero.slides || [];
      if ((!effectiveSlides || effectiveSlides.length === 0) && Array.isArray(parsedHero.slides) && parsedHero.slides.length > 0) {
        effectiveSlides = parsedHero.slides;
      }

      // Hero benefits: ALWAYS prioritize valid relational benefits already in relationalBenefitsRef.current, prevHero.benefits, or prevHero.statX
      const prevBenefits = Array.isArray(prevHero.benefits) ? prevHero.benefits : [];
      const parsedBenefits = Array.isArray(parsedHero.benefits) ? parsedHero.benefits : [];
      const refBenefits = Array.isArray(relationalBenefitsRef.current) ? relationalBenefitsRef.current : [];

      const effectiveBenefits = [0, 1, 2, 3].map(idx => {
        const num = idx + 1;
        const refItem = refBenefits[idx] || refBenefits.find(b => b.sortOrder === idx) || null;
        const rel = prevBenefits[idx] || prevBenefits.find(b => b.sortOrder === idx) || null;
        const parsedB = parsedBenefits[idx] || parsedBenefits.find(b => b.sortOrder === idx) || null;

        // Priority: Relational HeroBenefit -> existing state -> homepageCMS compatibility -> fallback
        const finalId = refItem?.id || rel?.id || prevHero[`stat${num}Id`] || parsedB?.id || parsedHero[`stat${num}Id`] || undefined;
        const finalTitle = refItem?.title || refItem?.value || rel?.title || rel?.value || prevHero[`stat${num}Value`] || parsedB?.title || parsedB?.value || parsedHero[`stat${num}Value`] || '';
        const finalDesc = refItem?.description || refItem?.label || rel?.description || rel?.label || prevHero[`stat${num}Label`] || parsedB?.description || parsedB?.label || parsedHero[`stat${num}Label`] || '';
        
        // PENTING: Prioritas image:
        // 1. HeroBenefit.image dari API / relational database (refItem?.image)
        // 2. existing image di homepage state (rel?.image atau prevHero[`stat${num}Image`])
        // 3. parsed homepageCMS image (parsedB?.image atau parsedHero[`stat${num}Image`])
        // 4. ''
        const finalImage = refItem?.image || rel?.image || prevHero[`stat${num}Image`] || parsedB?.image || parsedHero[`stat${num}Image`] || '';
        const finalSortOrder = typeof refItem?.sortOrder === 'number' ? refItem.sortOrder : (typeof rel?.sortOrder === 'number' ? rel.sortOrder : idx);
        const finalActive = refItem?.active !== undefined ? refItem.active !== false : (rel?.active !== undefined ? rel.active !== false : (parsedB?.active !== false));

        return {
          id: finalId,
          title: finalTitle,
          description: finalDesc,
          value: finalTitle,
          label: finalDesc,
          image: finalImage,
          sortOrder: finalSortOrder,
          active: finalActive
        };
      });

      const effectiveHero = {
        ...parsedHero,
        ...prevHero,
        slides: effectiveSlides,
        benefits: effectiveBenefits,
        stat1Id: effectiveBenefits[0].id,
        stat1Value: effectiveBenefits[0].value,
        stat1Label: effectiveBenefits[0].label,
        stat1Image: effectiveBenefits[0].image,
        stat2Id: effectiveBenefits[1].id,
        stat2Value: effectiveBenefits[1].value,
        stat2Label: effectiveBenefits[1].label,
        stat2Image: effectiveBenefits[1].image,
        stat3Id: effectiveBenefits[2].id,
        stat3Value: effectiveBenefits[2].value,
        stat3Label: effectiveBenefits[2].label,
        stat3Image: effectiveBenefits[2].image,
        stat4Id: effectiveBenefits[3].id,
        stat4Value: effectiveBenefits[3].value,
        stat4Label: effectiveBenefits[3].label,
        stat4Image: effectiveBenefits[3].image,
      };

      return {
        ...parsed,
        ...prev,
        hero: effectiveHero
      };
    });
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: getAuthHeaders(), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          mergeSettingsWithRelationalData(data);
        }
      }
    } catch (err) {
      console.error('Failed to load settings in admin:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      // 1. Load settings first to populate overall layout structure
      await loadSettings();
      // 2. Then load relational tables so relational data acts as final authoritative source
      await Promise.allSettled([
        loadHeroBanners(),
        loadHeroBenefits(),
        fetchCategories()
      ]);
    };
    initData();
  }, []);

  useEffect(() => {
    if (settings) {
      mergeSettingsWithRelationalData(settings);
    }
  }, [settings]);

  useEffect(() => {
    setProfileForm(adminProfile);
  }, [adminProfile]);

  const updateSlideField = (index, field, value) => {
    setHomepageCmsForm(prev => {
      const slides = [...(prev.hero?.slides || [])];
      while (slides.length <= index) {
        slides.push({
          id: `hero-${slides.length + 1}`,
          badge: `Slide ${slides.length + 1}`,
          title: '',
          subtitle: '',
          description: '',
          buttonText: 'Belanja Sekarang',
          buttonLink: '/produk',
          image: '',
          desktopImage: '',
          mobileImage: '',
          cropPosition: 'center center',
          desktopCrop: 'center center',
          mobileCrop: 'center center',
          cropZoom: '100',
          desktopZoom: '100',
          mobileZoom: '100',
          overlay: 0,
          altText: '',
          background: '#ECF6ED',
          active: false
        });
      }
      const updatedSlide = { ...slides[index], [field]: value };
      if (field === 'image') updatedSlide.desktopImage = value;
      if (field === 'desktopImage') updatedSlide.image = value;
      if (field === 'cropPosition') updatedSlide.desktopCrop = value;
      if (field === 'desktopCrop') updatedSlide.cropPosition = value;
      if (field === 'cropZoom') updatedSlide.desktopZoom = value;
      if (field === 'desktopZoom') updatedSlide.cropZoom = value;

      slides[index] = updatedSlide;
      return {
         ...prev,
         hero: { ...prev.hero, slides }
      };
    });
  };

  // File handling functions
  const handleProfileFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      setProfileForm(prev => ({ ...prev, avatar: preview }));

      try {
        const res = await uploadFileToSupabase(file, 'tanico-public');
        if (res.success && res.url) {
          setProfileForm(prev => ({ ...prev, avatar: res.url }));
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('Profile avatar upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleAboutFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      setHomepageCmsForm(prev => ({ 
        ...prev, 
        about: { ...prev.about, image: preview } 
      }));

      try {
        const res = await uploadFileToSupabase(file, 'hero');
        if (res.success && res.url) {
          setHomepageCmsForm(prev => ({ 
            ...prev, 
            about: { ...prev.about, image: res.url } 
          }));
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('About file upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleAboutImageChange = async (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      setHomepageCmsForm(prev => ({ 
        ...prev, 
        about: { ...prev.about, [field]: preview } 
      }));

      try {
        const res = await uploadFileToSupabase(file, 'hero');
        if (res.success && res.url) {
          setHomepageCmsForm(prev => ({ 
            ...prev, 
            about: { ...prev.about, [field]: res.url } 
          }));
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('About image upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleFarmerFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      setHomepageCmsForm(prev => ({ 
        ...prev, 
        farmer: { ...prev.farmer, image: preview } 
      }));

      try {
        const res = await uploadFileToSupabase(file, 'hero');
        if (res.success && res.url) {
          setHomepageCmsForm(prev => ({ 
            ...prev, 
            farmer: { ...prev.farmer, image: res.url } 
          }));
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('Farmer file upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleHeroFileChange = async (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      // Instant UI preview (<0.1s)
      setHomepageCmsForm(prev => {
        const slides = [...(prev.hero?.slides || [])];
        while (slides.length <= index) {
          slides.push({
            id: `hero-${Date.now()}-${slides.length}`,
            badge: `Slide ${slides.length + 1}`,
            title: `Judul Slide ${slides.length + 1}`,
            subtitle: '',
            description: '',
            buttonText: 'Belanja Sekarang',
            buttonLink: '/produk',
            image: '',
            desktopImage: '',
            mobileImage: '',
            cropPosition: 'center center',
            cropZoom: '100',
            desktopCrop: 'center center',
            desktopZoom: '100',
            mobileCrop: 'center center',
            mobileZoom: '100',
            background: '#ECF6ED',
            overlay: 0,
            sortOrder: slides.length,
            active: true
          });
        }
        slides[index] = { 
          ...slides[index], 
          image: preview,
          desktopImage: preview 
        };
        return {
          ...prev,
          hero: { ...prev.hero, slides }
        };
      });

      try {
        const res = await uploadFileToSupabase(file, 'hero');
        if (res.success && res.url) {
          const uploadedUrl = res.url;
          setHomepageCmsForm(prev => {
            const slides = [...(prev.hero?.slides || [])];
            if (slides[index]) {
              slides[index] = { 
                ...slides[index], 
                image: uploadedUrl,
                desktopImage: uploadedUrl 
              };
            }
            return {
              ...prev,
              hero: { ...prev.hero, slides }
            };
          });
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('Hero slide upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleHeroMobileFileChange = async (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      // Instant UI preview (<0.1s)
      setHomepageCmsForm(prev => {
        const slides = [...(prev.hero?.slides || [])];
        while (slides.length <= index) {
          slides.push({
            id: `hero-${Date.now()}-${slides.length}`,
            badge: `Slide ${slides.length + 1}`,
            title: `Judul Slide ${slides.length + 1}`,
            subtitle: '',
            description: '',
            buttonText: 'Belanja Sekarang',
            buttonLink: '/produk',
            image: '',
            desktopImage: '',
            mobileImage: '',
            cropPosition: 'center center',
            cropZoom: '100',
            desktopCrop: 'center center',
            desktopZoom: '100',
            mobileCrop: 'center center',
            mobileZoom: '100',
            background: '#ECF6ED',
            overlay: 0,
            sortOrder: slides.length,
            active: true
          });
        }
        slides[index] = { 
          ...slides[index], 
          mobileImage: preview 
        };
        return {
          ...prev,
          hero: { ...prev.hero, slides }
        };
      });

      try {
        const res = await uploadFileToSupabase(file, 'hero');
        if (res.success && res.url) {
          const uploadedUrl = res.url;
          setHomepageCmsForm(prev => {
            const slides = [...(prev.hero?.slides || [])];
            if (slides[index]) {
              slides[index] = { 
                ...slides[index], 
                mobileImage: uploadedUrl 
              };
            }
            return {
              ...prev,
              hero: { ...prev.hero, slides }
            };
          });
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('Hero mobile slide upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleFeatureCardFileChange = async (e, num) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      const idx = num - 1;

      // Instant UI preview (<0.1s)
      setHomepageCmsForm(prev => {
        const hero = { ...(prev?.hero || {}) };
        hero[`stat${num}Image`] = preview;
        const currentBenefits = Array.isArray(hero.benefits) ? [...hero.benefits] : [];
        while (currentBenefits.length < 4) {
          currentBenefits.push({ sortOrder: currentBenefits.length, active: true, value: '', label: '', image: '' });
        }
        currentBenefits[idx] = {
          ...currentBenefits[idx],
          image: preview,
          removeImage: false,
          sortOrder: idx
        };
        hero.benefits = currentBenefits;
        return {
          ...prev,
          hero
        };
      });

      try {
        const res = await uploadFileToSupabase(file, 'hero', null, getAuthHeaders());
        if (res.success && res.url) {
          const uploadedUrl = res.url;
          if (Array.isArray(relationalBenefitsRef.current)) {
            while (relationalBenefitsRef.current.length < 4) {
              relationalBenefitsRef.current.push({ sortOrder: relationalBenefitsRef.current.length, active: true, value: '', label: '', image: '' });
            }
            if (relationalBenefitsRef.current[idx]) {
              relationalBenefitsRef.current[idx] = {
                ...relationalBenefitsRef.current[idx],
                image: uploadedUrl
              };
            }
          }
          setHomepageCmsForm(prev => {
            const hero = { ...(prev?.hero || {}) };
            hero[`stat${num}Image`] = uploadedUrl;
            const currentBenefits = Array.isArray(hero.benefits) ? [...hero.benefits] : [];
            while (currentBenefits.length < 4) {
              currentBenefits.push({ sortOrder: currentBenefits.length, active: true, value: '', label: '', image: '' });
            }
            currentBenefits[idx] = {
              ...currentBenefits[idx],
              image: uploadedUrl,
              removeImage: false,
              sortOrder: idx
            };
            hero.benefits = currentBenefits;
            return {
              ...prev,
              hero
            };
          });
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('Feature card upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handlePromoFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      setHomepageCmsForm(prev => ({ 
        ...prev, 
        promo: { ...prev.promo, banner: preview } 
      }));

      try {
        const res = await uploadFileToSupabase(file, 'hero');
        if (res.success && res.url) {
          setHomepageCmsForm(prev => ({ 
            ...prev, 
            promo: { ...prev.promo, banner: res.url } 
          }));
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('Promo banner upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleCategoriesFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      setHomepageCmsForm(prev => ({ 
        ...prev, 
        categories: { ...prev.categories, backgroundImage: preview } 
      }));

      try {
        const res = await uploadFileToSupabase(file, 'categories');
        if (res.success && res.url) {
          setHomepageCmsForm(prev => ({ 
            ...prev, 
            categories: { ...prev.categories, backgroundImage: res.url } 
          }));
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('Categories background upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleCtaImageChange = async (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = createPreviewUrl(file);
      previewUrlsRef.current.push(preview);
      setHomepageCmsForm(prev => ({ 
        ...prev, 
        cta: { ...prev.cta, [field]: preview } 
      }));

      try {
        const res = await uploadFileToSupabase(file, 'hero');
        if (res.success && res.url) {
          setHomepageCmsForm(prev => ({ 
            ...prev, 
            cta: { ...prev.cta, [field]: res.url } 
          }));
          onAddToast('Gambar berhasil diupload!', 'success');
        } else {
          onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
        }
      } catch (err) {
        logger.error('CTA image upload error:', err);
        onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  // Savers
  const handleSettingsSave = (e) => {
    e.preventDefault();
    onSaveSettings(settingsForm);
    onAddToast('Konfigurasi Pengaturan Website berhasil diperbarui!', 'success');
    onAddActivityLog('Mengubah pengaturan umum website');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const updatedForm = { ...profileForm, avatar: profileForm.avatar || '' };
      onSaveAdminProfile(updatedForm);
      onAddToast('Profil Administrator berhasil disimpan!', 'success');
      onAddActivityLog('Mengubah data profil admin');
    } catch (err) {
      logger.error(err);
      onAddToast('Gagal memproses profil: ' + err.message, 'error');
    }
  };

  const handleHomepageCmsSave = async (e) => {
    e.preventDefault();
    try {
      // Validation for Hero section if visible
      if (homepageCmsForm.hero?.show ?? true) {
        const slides = homepageCmsForm.hero?.slides || [];
        
        // 1. Maksimal 6 slide
        if (slides.length > 6) {
          onAddToast('Maksimal hanya diperbolehkan 6 slide Hero!', 'error');
          return;
        }

        // Validate each slide in the list
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          
          // Only enforce full rules if active or if the user actively filled out fields
          if (slide.active !== false) {
            const title = slide.title || '';
            if (title.trim() === '') {
              onAddToast(`Judul Slide ${i + 1} tidak boleh kosong jika aktif!`, 'error');
              return;
            }
            if (title.trim().length < 3) {
              onAddToast(`Judul Slide ${i + 1} minimal harus 3 karakter!`, 'error');
              return;
            }

            const img = slide.desktopImage || slide.image || '';
            if (!img) {
              onAddToast(`Gambar Desktop Slide ${i + 1} wajib diisi!`, 'error');
              return;
            }

            // Check if image is a valid URL (starts with http://, https://, or /)
            const isValidUrl = img.startsWith('http://') || 
                               img.startsWith('https://') || 
                               img.startsWith('/');
            if (!isValidUrl) {
              onAddToast(`Gambar Desktop Slide ${i + 1} harus berupa URL yang valid (dimulai dengan http://, https:// atau /)!`, 'error');
              return;
            }

            if (slide.mobileImage) {
              const mobileImg = slide.mobileImage;
              const isValidMobileUrl = mobileImg.startsWith('http://') || 
                                       mobileImg.startsWith('https://') || 
                                       mobileImg.startsWith('/');
              if (!isValidMobileUrl) {
                onAddToast(`Gambar Mobile Slide ${i + 1} harus berupa URL yang valid!`, 'error');
                return;
              }
            }

            const zoom = parseInt(slide.cropZoom || '100', 10);
            if (isNaN(zoom) || zoom < 100 || zoom > 180) {
              onAddToast(`Crop Zoom Slide ${i + 1} harus berupa angka antara 100 dan 180!`, 'error');
              return;
            }

            const validCropPositions = ['left center', 'center center', 'right center', 'center top', 'center bottom'];
            const pos = slide.cropPosition || 'center center';
            if (!validCropPositions.includes(pos)) {
              onAddToast(`Crop Position Slide ${i + 1} tidak valid! Pilih posisi yang tersedia.`, 'error');
              return;
            }

            const link = slide.buttonLink || '';
            if (!link) {
              onAddToast(`Tautan Tombol CTA Slide ${i + 1} wajib diisi!`, 'error');
              return;
            }
          }
        }
      }

      // Validation for Gallery section if shown
      if (homepageCmsForm.gallery?.show ?? true) {
        const badge = homepageCmsForm.gallery?.badge || '';
        if (badge.trim().length < 3) {
          onAddToast('Badge Galeri minimal harus 3 karakter!', 'error');
          return;
        }
        const title = homepageCmsForm.gallery?.title || '';
        if (title.trim().length < 5) {
          onAddToast('Judul Galeri minimal harus 5 karakter!', 'error');
          return;
        }
        const description = homepageCmsForm.gallery?.description || '';
        if (description.length > 300) {
          onAddToast('Deskripsi Galeri maksimal harus 300 karakter!', 'error');
          return;
        }
        const limit = parseInt(homepageCmsForm.gallery?.limit ?? 6, 10);
        if (isNaN(limit) || limit < 1 || limit > 12) {
          onAddToast('Limit Gambar Galeri harus antara 1 dan 12!', 'error');
          return;
        }
      }

      // Prepare images for the active slides list
      let processedSlides = [];
      if (homepageCmsForm.hero?.slides) {
        for (let i = 0; i < homepageCmsForm.hero.slides.length; i++) {
          const s = homepageCmsForm.hero.slides[i];
          const deskImg = s.desktopImage || s.image || '';
          const mobImg = s.mobileImage || '';
          processedSlides.push({
            ...s,
            image: deskImg,
            desktopImage: deskImg,
            mobileImage: mobImg
          });
        }
      }

      // Prepare images and IDs for the 4 benefit cards
      const processedStat1Image = homepageCmsForm.hero?.stat1Image || (homepageCmsForm.hero?.benefits?.[0]?.image) || relationalBenefitsRef.current?.[0]?.image || '';
      const processedStat2Image = homepageCmsForm.hero?.stat2Image || (homepageCmsForm.hero?.benefits?.[1]?.image) || relationalBenefitsRef.current?.[1]?.image || '';
      const processedStat3Image = homepageCmsForm.hero?.stat3Image || (homepageCmsForm.hero?.benefits?.[2]?.image) || relationalBenefitsRef.current?.[2]?.image || '';
      const processedStat4Image = homepageCmsForm.hero?.stat4Image || (homepageCmsForm.hero?.benefits?.[3]?.image) || relationalBenefitsRef.current?.[3]?.image || '';

      const processedStat1Id = homepageCmsForm.hero?.stat1Id || (homepageCmsForm.hero?.benefits?.[0]?.id) || relationalBenefitsRef.current?.[0]?.id || undefined;
      const processedStat2Id = homepageCmsForm.hero?.stat2Id || (homepageCmsForm.hero?.benefits?.[1]?.id) || relationalBenefitsRef.current?.[1]?.id || undefined;
      const processedStat3Id = homepageCmsForm.hero?.stat3Id || (homepageCmsForm.hero?.benefits?.[2]?.id) || relationalBenefitsRef.current?.[2]?.id || undefined;
      const processedStat4Id = homepageCmsForm.hero?.stat4Id || (homepageCmsForm.hero?.benefits?.[3]?.id) || relationalBenefitsRef.current?.[3]?.id || undefined;

      const processedFarmerImage = homepageCmsForm.farmer?.image || '';
      const processedGalleryBg = homepageCmsForm.gallery?.backgroundImage || '';

      // Bulk sync HeroBanners directly to database table public."HeroBanner"
      try {
        const authHeaders = getAuthHeaders();
        const heroRes = await fetch('/api/admin/hero-banners', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify({ slides: processedSlides })
        });
        if (heroRes.ok) {
          const heroData = await heroRes.json();
          if (Array.isArray(heroData)) {
            processedSlides = heroData;
          }
        }
      } catch (heroErr) {
        logger.error('Error syncing hero banners directly:', heroErr);
      }

      // Bulk sync HeroBenefits directly to database table public."HeroBenefit"
      const benefitCardsPayload = [1, 2, 3, 4].map((num, idx) => {
        const processedImg = num === 1 ? processedStat1Image : num === 2 ? processedStat2Image : num === 3 ? processedStat3Image : processedStat4Image;
        const benefitObj = homepageCmsForm.hero?.benefits?.[idx];
        const isExplicitlyRemoved = benefitObj?.removeImage === true;
        const refBenefit = relationalBenefitsRef.current?.[idx] || relationalBenefitsRef.current?.find(b => b.sortOrder === idx);

        const currentImg = isExplicitlyRemoved
          ? ''
          : (processedImg || homepageCmsForm.hero?.[`stat${num}Image`] || benefitObj?.image || refBenefit?.image || '');

        const titleVal = (homepageCmsForm.hero?.[`stat${num}Value`] || benefitObj?.value || benefitObj?.title || refBenefit?.title || '').trim();
        const descVal = (homepageCmsForm.hero?.[`stat${num}Label`] || benefitObj?.label || benefitObj?.description || refBenefit?.description || '').trim();
        const benefitId = homepageCmsForm.hero?.[`stat${num}Id`] || benefitObj?.id || refBenefit?.id || undefined;
        return {
          id: benefitId,
          title: titleVal,
          description: descVal,
          value: titleVal,
          label: descVal,
          image: currentImg,
          sortOrder: idx,
          active: Boolean(titleVal || descVal || currentImg)
        };
      });

      let processedBenefits = benefitCardsPayload;

      try {
        const authHeaders = getAuthHeaders();
        const benefitRes = await fetch('/api/admin/hero-benefits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify(benefitCardsPayload)
        });

        const savedBenefits = await benefitRes.json().catch(() => null);

        if (!benefitRes.ok) {
          throw new Error(
            savedBenefits?.error ||
            `Hero Benefit save failed: ${benefitRes.status}`
          );
        }

        if (Array.isArray(savedBenefits) && savedBenefits.length > 0) {
          // Update ONLY the image and ensure id from saved response, preserving title, description, sortOrder
          processedBenefits = benefitCardsPayload.map((card, idx) => {
            const savedMatch = savedBenefits.find(b => (card.id && b.id === card.id) || b.sortOrder === idx) || savedBenefits[idx];
            return {
              ...card,
              id: savedMatch?.id || card.id,
              image: (savedMatch && savedMatch.image !== undefined) ? savedMatch.image : card.image
            };
          });
          relationalBenefitsRef.current = processedBenefits;
        }
      } catch (benefitErr) {
        logger.error('Error syncing hero benefits directly:', benefitErr);
        onAddToast(benefitErr.message || 'Gagal menyimpan 4 Kartu Manfaat Hero ke database', 'error');
        throw benefitErr;
      }

      const finalizedCms = {
        ...homepageCmsForm,
        farmer: {
          ...homepageCmsForm.farmer,
          image: processedFarmerImage
        },
        hero: {
          ...homepageCmsForm.hero,
          slides: processedSlides,
          benefits: benefitCardsPayload.map((card, idx) => {
            const currentBenefit = (Array.isArray(homepageCmsForm.hero?.benefits) && homepageCmsForm.hero.benefits[idx]) || card;
            const validImg = processedBenefits[idx]?.image !== undefined ? processedBenefits[idx].image : (currentBenefit.image || card.image || '');
            return {
              ...currentBenefit,
              id: processedBenefits[idx]?.id || currentBenefit.id,
              image: validImg
            };
          }),
          stat1Id: processedBenefits[0]?.id || processedStat1Id,
          stat2Id: processedBenefits[1]?.id || processedStat2Id,
          stat3Id: processedBenefits[2]?.id || processedStat3Id,
          stat4Id: processedBenefits[3]?.id || processedStat4Id,
          stat1Image: (processedBenefits[0]?.image !== undefined ? processedBenefits[0].image : (homepageCmsForm.hero?.stat1Image || '')) || '',
          stat2Image: (processedBenefits[1]?.image !== undefined ? processedBenefits[1].image : (homepageCmsForm.hero?.stat2Image || '')) || '',
          stat3Image: (processedBenefits[2]?.image !== undefined ? processedBenefits[2].image : (homepageCmsForm.hero?.stat3Image || '')) || '',
          stat4Image: (processedBenefits[3]?.image !== undefined ? processedBenefits[3].image : (homepageCmsForm.hero?.stat4Image || '')) || '',
          stat1Value: homepageCmsForm.hero?.stat1Value || benefitCardsPayload[0]?.title || '',
          stat2Value: homepageCmsForm.hero?.stat2Value || benefitCardsPayload[1]?.title || '',
          stat3Value: homepageCmsForm.hero?.stat3Value || benefitCardsPayload[2]?.title || '',
          stat4Value: homepageCmsForm.hero?.stat4Value || benefitCardsPayload[3]?.title || '',
          stat1Label: homepageCmsForm.hero?.stat1Label || benefitCardsPayload[0]?.description || '',
          stat2Label: homepageCmsForm.hero?.stat2Label || benefitCardsPayload[1]?.description || '',
          stat3Label: homepageCmsForm.hero?.stat3Label || benefitCardsPayload[2]?.description || '',
          stat4Label: homepageCmsForm.hero?.stat4Label || benefitCardsPayload[3]?.description || '',
        },
        gallery: {
          ...homepageCmsForm.gallery,
          backgroundImage: processedGalleryBg
        }
      };

      const updatedSettings = {
        ...settingsForm,
        homepageCMS: JSON.stringify(finalizedCms)
      };
      
      const saveRes = await onSaveSettings(updatedSettings);
      if (saveRes && saveRes.success === false) {
        throw new Error(saveRes.error || 'Gagal menyimpan ke database');
      }

      setSettingsForm(updatedSettings);
      setHomepageCmsForm(finalizedCms);
      await loadHeroBanners();
      await loadHeroBenefits();
      onAddToast('Kisah & Editorial Halaman Utama berhasil diperbarui!', 'success');
      onAddActivityLog('Mengubah konten editorial halaman utama via CMS');
    } catch (err) {
      logger.error(err);
      onAddToast('Gagal menyimpan perubahan: ' + err.message, 'error');
    }
  };

  
  return (
    <div className="space-y-6">
      <form onSubmit={handleHomepageCmsSave} className="space-y-8 text-left w-full">
          <div>
            <span className="font-sans text-[10px] tracking-wider text-[#6E9C7C] font-bold block">Manajemen Halaman</span>
            <h3 className="font-sans text-2xl text-[#174C3C] font-bold mt-1">Homepage CMS Editor</h3>
            <p className="text-xs text-gray-500 mt-1">Konfigurasikan seluruh visual, slogan, deskripsi, tombol, tautan, warna latar belakang, dan status aktif untuk setiap section secara realtime.</p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-3 overflow-x-auto">
            {[
              { id: 'hero', name: 'Hero' },
              { id: 'categories', name: 'Kategori' },
              { id: 'featuredProducts', name: 'Produk' },
              { id: 'gallery', name: 'Galeri' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 text-[10px] font-sans tracking-wider rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-[#174C3C] text-white font-bold hover:bg-[#205E49] active:bg-[#123A2E] shadow-xs'
                    : 'bg-[#FCFCFC] text-[#174C3C] font-bold border border-[#DDE9DF] hover:border-[#174C3C] hover:shadow-xs'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Active Tab Panel */}
          <div className="bg-white border border-gray-200/50 p-6 rounded-[20px] shadow-xs space-y-6">
            
            {/* HERO TAB */}
            {activeSubTab === 'hero' && (() => {
              const heroCms = homepageCmsForm.hero || {};
              const slides = heroCms.slides || [];
              
              const activeSlideIdxClamped = Math.min(activeSlideIdx, Math.max(0, slides.length - 1));

              const handleAddSlide = () => {
                const currentSlides = [...slides];
                if (currentSlides.length >= 6) {
                  onAddToast('Maksimal hanya diperbolehkan 6 slide Hero!', 'error');
                  return;
                }
                const newSlide = {
                  id: `hero-${Date.now()}`,
                  badge: `Slide Baru`,
                  title: 'Judul Baru',
                  subtitle: 'Subjudul Baru',
                  description: 'Deskripsi singkat mengenai slide baru ini.',
                  buttonText: 'Belanja Sekarang',
                  buttonLink: '/produk',
                  image: '',
                  desktopImage: '',
                  mobileImage: '',
                  cropPosition: 'center center',
                  cropZoom: '100',
                  altText: 'Deskripsi gambar slide',
                  background: '#ECF6ED',
                  active: true
                };
                currentSlides.push(newSlide);
                setHomepageCmsForm(prev => ({
                  ...prev,
                  hero: { ...prev.hero, slides: currentSlides }
                }));
                setActiveSlideIdx(currentSlides.length - 1);
                onAddToast('Slide baru ditambahkan!', 'success');
              };

              const handleDeleteSlide = (idx) => {
                const currentSlides = [...slides];
                if (currentSlides.length <= 1) {
                  onAddToast('Harus menyisakan minimal 1 slide!', 'error');
                  return;
                }
                currentSlides.splice(idx, 1);
                setHomepageCmsForm(prev => ({
                  ...prev,
                  hero: { ...prev.hero, slides: currentSlides }
                }));
                setActiveSlideIdx(Math.max(0, idx - 1));
                onAddToast('Slide berhasil dihapus!', 'success');
              };

              const handleMoveSlide = (idx, direction) => {
                const currentSlides = [...slides];
                const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= currentSlides.length) return;
                const temp = currentSlides[idx];
                currentSlides[idx] = currentSlides[targetIdx];
                currentSlides[targetIdx] = temp;
                setHomepageCmsForm(prev => ({
                  ...prev,
                  hero: { ...prev.hero, slides: currentSlides }
                }));
                setActiveSlideIdx(targetIdx);
                onAddToast('Urutan slide berhasil diubah!', 'success');
              };

              const currentSlide = slides[activeSlideIdxClamped] || {
                id: '',
                badge: '',
                title: '',
                subtitle: '',
                description: '',
                buttonText: '',
                buttonLink: '',
                image: '',
                cropPosition: 'center center',
                cropZoom: '100',
                background: '#ECF6ED',
                active: true
              };

              return (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                    <h4 className="font-jost font-bold text-[#12372A] text-sm tracking-wider">Editor Visual Section Hero (Multi-Slide)</h4>
                    <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                      <input
                        type="checkbox"
                        checked={heroCms.show ?? true}
                        onChange={(e) => setHomepageCmsForm(prev => ({
                          ...prev,
                          hero: { ...prev.hero, show: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                      />
                      Tampilkan Section Hero
                    </label>
                  </div>

                  {/* FORM EDITORS CONTAINER (TOP) */}
                  <div className="w-full space-y-6">
                      
                      {/* PENGATURAN SLIDESHOW */}
                      <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                        <div className="text-[10px] font-jost font-bold text-gray-400 tracking-widest border-b border-gray-100 pb-1.5">PENGATURAN SLIDESHOW UTAMA</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Autoplay Toggle */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Autoplay Slideshow</label>
                            <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                              <input
                                type="checkbox"
                                checked={heroCms.autoplay ?? true}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, autoplay: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                              />
                              Aktifkan Autoplay
                            </label>
                          </div>

                          {/* Autoplay Speed */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Kecepatan Transisi (Autoplay Speed)</label>
                            <select
                              value={heroCms.autoplaySpeed || '5000'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                hero: { ...prev.hero, autoplaySpeed: e.target.value }
                              }))}
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10"
                            >
                              <option value="3000">3 Detik (3000ms)</option>
                              <option value="5000">5 Detik (5000ms)</option>
                              <option value="8000">8 Detik (8000ms)</option>
                              <option value="10000">10 Detik (10000ms)</option>
                            </select>
                          </div>

                          {/* Show Arrows */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Tombol Navigasi Panah (Arrows)</label>
                            <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                              <input
                                type="checkbox"
                                checked={heroCms.showArrows ?? true}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, showArrows: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                              />
                              Tampilkan Tombol Panah
                            </label>
                          </div>

                          {/* Show Dots */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Indikator Titik (Dots Indicator)</label>
                            <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                              <input
                                type="checkbox"
                                checked={heroCms.showDots ?? true}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, showDots: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                              />
                              Tampilkan Titik Indikator
                            </label>
                          </div>

                          {/* Default First Slide Select */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Pilih Slide Pertama Tampil (Default First Slide)</label>
                            <select
                              value={heroCms.defaultFirstSlideIdx ?? 0}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                hero: { ...prev.hero, defaultFirstSlideIdx: parseInt(e.target.value, 10) }
                              }))}
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10"
                            >
                              {slides.map((s, idx) => (
                                <option key={idx} value={idx}>
                                  Slide {idx + 1} - {s.badge || `Slide ${idx + 1}`} {s.active !== false ? '(🟢 Aktif)' : '(⚫ Nonaktif)'}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* TATA LETAK & ESTETIKA PREMIUM */}
                      <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                        <div className="text-[10px] font-jost font-bold text-gray-400 tracking-widest border-b border-gray-100 pb-1.5">TATA LETAK & ESTETIKA PREMIUM</div>
                        
                        {/* Height Sliders */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Tinggi Hero Desktop: <span className="text-brand-green font-mono font-bold">{heroCms.desktopHeight ?? 420}px</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">300px</span>
                              <input
                                type="range"
                                min="300"
                                max="700"
                                step="10"
                                value={heroCms.desktopHeight ?? 420}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, desktopHeight: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">700px</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Tinggi Hero Mobile: <span className="text-brand-green font-mono font-bold">{heroCms.mobileHeight ?? 380}px</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">250px</span>
                              <input
                                type="range"
                                min="250"
                                max="600"
                                step="10"
                                value={heroCms.mobileHeight ?? 380}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, mobileHeight: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">600px</span>
                            </div>
                          </div>
                        </div>

                        {/* Effects Sliders */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Kegelapan Overlay Gambar: <span className="text-brand-green font-mono font-bold">{heroCms.overlayOpacity ?? 0}%</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0%</span>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                step="5"
                                value={heroCms.overlayOpacity ?? 0}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, overlayOpacity: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">80%</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Kekuatan Kabur Gambar (Blur): <span className="text-brand-green font-mono font-bold">{heroCms.blurStrength ?? 0}px</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0px</span>
                              <input
                                type="range"
                                min="0"
                                max="15"
                                step="1"
                                value={heroCms.blurStrength ?? 0}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, blurStrength: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">15px</span>
                            </div>
                          </div>
                        </div>

                        {/* Grain & Glow */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Kepekatan Grain Film: <span className="text-brand-green font-mono font-bold">{heroCms.grainOpacity ?? 2}%</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0%</span>
                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={heroCms.grainOpacity ?? 2}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, grainOpacity: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">10%</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Kekuatan Pancaran (Glow Opacity): <span className="text-brand-green font-mono font-bold">{heroCms.glowOpacity ?? 3}%</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0%</span>
                              <input
                                type="range"
                                min="0"
                                max="15"
                                step="1"
                                value={heroCms.glowOpacity ?? 3}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, glowOpacity: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">15%</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Warna Pancaran (Glow Color)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={heroCms.glowColor || '#174C3C'}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, glowColor: e.target.value }
                                }))}
                                className="w-10 h-10 p-0 border border-gray-200 outline-none rounded-lg cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={heroCms.glowColor || '#174C3C'}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, glowColor: e.target.value }
                                }))}
                                className="flex-1 text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                                placeholder="#174C3C"
                              />
                            </div>
                          </div>

                          {/* Swipe Settings */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Sensitivitas Swipe Mobile: <span className="text-brand-green font-mono font-bold">{heroCms.swipeSensitivity ?? 50}px</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">20px</span>
                              <input
                                type="range"
                                min="20"
                                max="120"
                                step="5"
                                value={heroCms.swipeSensitivity ?? 50}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, swipeSensitivity: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">120px</span>
                            </div>
                          </div>
                        </div>

                        {/* Swipe Mobile Toggle */}
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Fitur Swipe Kiri/Kanan Mobile</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                            <input
                              type="checkbox"
                              checked={heroCms.swipeEnabled ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                hero: { ...prev.hero, swipeEnabled: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                            />
                            Aktifkan Gestur Swipe Mobile
                          </label>
                        </div>
                      </div>

                      {/* SLIDES LIST MANAGEMENT */}
                      <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                          <label className="font-jost text-[10px] tracking-wider text-gray-400 block font-bold">DAFTAR SLIDE ({slides.length}/6)</label>
                          {slides.length < 6 && (
                            <button
                              type="button"
                              onClick={handleAddSlide}
                              className="px-2.5 py-1 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white text-[9px] tracking-wider rounded font-bold transition-colors duration-200 cursor-pointer"
                            >
                              + Tambah Slide Baru
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {slides.map((slide, idx) => {
                            const isActiveTab = activeSlideIdxClamped === idx;
                            return (
                              <div 
                                key={idx}
                                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                  isActiveTab ? 'border-[#12372A] bg-[#12372A]/5' : 'border-gray-100 bg-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setActiveSlideIdx(idx)}
                                  className="flex-1 flex items-center gap-2 text-left cursor-pointer"
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isActiveTab ? 'bg-[#12372A] text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div className="leading-tight">
                                    <div className="text-xs font-bold text-gray-800 font-jost">{slide.badge || `Slide ${idx + 1}`}</div>
                                    <div className="text-[10px] text-gray-400 font-mono flex gap-2">
                                      <span>{slide.active !== false ? '🟢 Aktif' : '⚫ Nonaktif'}</span>
                                      {heroCms.defaultFirstSlideIdx === idx && <span className="text-[#174C3C] font-bold">★ Pertama</span>}
                                    </div>
                                  </div>
                                </button>

                                <div className="flex items-center gap-1">
                                  {/* Move Up */}
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveSlide(idx, 'up')}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                                    title="Pindahkan Ke Atas"
                                  >
                                    ▲
                                  </button>
                                  {/* Move Down */}
                                  <button
                                    type="button"
                                    disabled={idx === slides.length - 1}
                                    onClick={() => handleMoveSlide(idx, 'down')}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                                    title="Pindahkan Ke Bawah"
                                  >
                                    ▼
                                  </button>
                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlide(idx)}
                                    className="p-1 text-red-500 hover:text-red-700 cursor-pointer ml-1"
                                    title="Hapus Slide"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ACTIVE SLIDE DETAILED FORM */}
                      <div className="border border-gray-200 p-5 rounded-xl bg-white space-y-4 shadow-sm">
                        <div className="text-xs font-jost font-bold text-[#12372A] tracking-wider flex justify-between items-center border-b border-gray-100 pb-2">
                          <span>KONTEN DETAIL SLIDE {activeSlideIdxClamped + 1}: <span className="text-brand-green font-mono">{currentSlide.badge}</span></span>
                          <label className="flex items-center gap-1.5 cursor-pointer font-jost text-[10px] text-gray-500 font-bold normal-case">
                            <input
                              type="checkbox"
                              checked={currentSlide.active !== false}
                              onChange={(e) => updateSlideField(activeSlideIdxClamped, 'active', e.target.checked)}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                            />
                            Slide Aktif
                          </label>
                        </div>

                        {/* SLIDE BADGE & COLOR */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Judul Kecil (Badge / Tab Name)</label>
                            <input
                              type="text"
                              value={currentSlide.badge || ''}
                              onChange={(e) => updateSlideField(activeSlideIdxClamped, 'badge', e.target.value)}
                              placeholder="Masukkan label kecil, misal: 'Unggulan', 'Sayur Segar', 'Organik'"
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Warna Latar Belakang (Warna Default Latar)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={currentSlide.background || '#ECF6ED'}
                                onChange={(e) => updateSlideField(activeSlideIdxClamped, 'background', e.target.value)}
                                className="w-10 h-10 p-0 border border-gray-200 outline-none rounded-lg cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={currentSlide.background || '#ECF6ED'}
                                onChange={(e) => updateSlideField(activeSlideIdxClamped, 'background', e.target.value)}
                                className="flex-1 text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                                placeholder="#ECF6ED"
                              />
                            </div>
                          </div>
                        </div>

                        {/* TITLES */}
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Judul Utama Slide (Baris 1)</label>
                          <input
                            type="text"
                            value={currentSlide.title || ''}
                            onChange={(e) => updateSlideField(activeSlideIdxClamped, 'title', e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            placeholder="Tulis judul utama yang menarik perhatian..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Subjudul Slide (Baris 2)</label>
                          <input
                            type="text"
                            value={currentSlide.subtitle || ''}
                            onChange={(e) => updateSlideField(activeSlideIdxClamped, 'subtitle', e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            placeholder="Masukkan subjudul pelengkap..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Deskripsi Slide</label>
                          <textarea
                            rows={3}
                            value={currentSlide.description || ''}
                            onChange={(e) => updateSlideField(activeSlideIdxClamped, 'description', e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            placeholder="Tulis deskripsi singkat tentang slide ini..."
                          />
                        </div>

                        {/* BUTTONS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Teks Tombol CTA</label>
                            <input
                              type="text"
                              value={currentSlide.buttonText || ''}
                              onChange={(e) => updateSlideField(activeSlideIdxClamped, 'buttonText', e.target.value)}
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                              placeholder="Misal: Belanja Sekarang"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Tautan Tombol CTA</label>
                            <input
                              type="text"
                              value={currentSlide.buttonLink || ''}
                              onChange={(e) => updateSlideField(activeSlideIdxClamped, 'buttonLink', e.target.value)}
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                              placeholder="/produk atau https://..."
                            />
                          </div>
                        </div>

                        {/* IMAGE FIELDS: DESKTOP & MOBILE BANNERS */}
                        <div className="space-y-4 pt-3 border-t border-gray-100">
                          {/* DESKTOP BANNER */}
                          <div className="border border-gray-200 p-3.5 rounded-xl bg-gray-50/50 space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="font-jost text-[10px] tracking-wider text-[#12372A] block font-bold">
                                🖥️ Desktop Banner (Slide {activeSlideIdxClamped + 1})
                              </label>
                              {(currentSlide.desktopImage || currentSlide.image) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateSlideField(activeSlideIdxClamped, 'image', '');
                                    updateSlideField(activeSlideIdxClamped, 'desktopImage', '');
                                    onAddToast('Gambar Desktop slide direset!', 'info');
                                  }}
                                  className="text-red-500 hover:text-red-700 font-jost text-[9px] tracking-wider cursor-pointer font-bold"
                                >
                                  Reset Desktop Banner
                                </button>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={currentSlide.desktopImage || currentSlide.image || ''}
                                onChange={(e) => {
                                  updateSlideField(activeSlideIdxClamped, 'desktopImage', e.target.value);
                                  updateSlideField(activeSlideIdxClamped, 'image', e.target.value);
                                }}
                                className="flex-1 text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                                placeholder="Masukkan URL gambar untuk desktop (wajib)…"
                              />
                              <label className="px-4 py-3 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[10px] tracking-widest cursor-pointer flex items-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                                UPLOAD DESKTOP
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleHeroFileChange(e, activeSlideIdxClamped)}
                                />
                              </label>
                            </div>

                            {/* DESKTOP CROP & ZOOM */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              <div className="space-y-1">
                                <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Fokus Potong Desktop (Desktop Crop)</label>
                                <select
                                  value={currentSlide.desktopCrop || currentSlide.cropPosition || 'center center'}
                                  onChange={(e) => {
                                    updateSlideField(activeSlideIdxClamped, 'desktopCrop', e.target.value);
                                    updateSlideField(activeSlideIdxClamped, 'cropPosition', e.target.value);
                                  }}
                                  className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-9"
                                >
                                  <option value="left center">Kiri (left center)</option>
                                  <option value="center center">Tengah (center center)</option>
                                  <option value="right center">Kanan (right center)</option>
                                  <option value="center top">Atas (center top)</option>
                                  <option value="center bottom">Bawah (center bottom)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Zoom Desktop: <span className="text-brand-green font-bold font-mono">{currentSlide.desktopZoom || currentSlide.cropZoom || '100'}%</span></label>
                                <div className="flex items-center gap-2 h-9 bg-white border border-gray-200 px-3 rounded-lg">
                                  <span className="text-[9px] text-gray-400 font-mono">100%</span>
                                  <input
                                    type="range"
                                    min="100"
                                    max="180"
                                    step="5"
                                    value={currentSlide.desktopZoom || currentSlide.cropZoom || '100'}
                                    onChange={(e) => {
                                      updateSlideField(activeSlideIdxClamped, 'desktopZoom', e.target.value);
                                      updateSlideField(activeSlideIdxClamped, 'cropZoom', e.target.value);
                                    }}
                                    className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                  />
                                  <span className="text-[9px] text-gray-400 font-mono">180%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* MOBILE BANNER */}
                          <div className="border border-gray-200 p-3.5 rounded-xl bg-gray-50/50 space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="font-jost text-[10px] tracking-wider text-[#12372A] block font-bold">
                                📱 Mobile Banner (Slide {activeSlideIdxClamped + 1})
                              </label>
                              {currentSlide.mobileImage && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateSlideField(activeSlideIdxClamped, 'mobileImage', '');
                                    onAddToast('Gambar Mobile slide direset!', 'info');
                                  }}
                                  className="text-red-500 hover:text-red-700 font-jost text-[9px] tracking-wider cursor-pointer font-bold"
                                >
                                  Reset Mobile Banner
                                </button>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={currentSlide.mobileImage || ''}
                                onChange={(e) => updateSlideField(activeSlideIdxClamped, 'mobileImage', e.target.value)}
                                className="flex-1 text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                                placeholder="Opsional: URL gambar khusus untuk mobile…"
                              />
                              <label className="px-4 py-3 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[10px] tracking-widest cursor-pointer flex items-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                                UPLOAD MOBILE
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleHeroMobileFileChange(e, activeSlideIdxClamped)}
                                />
                              </label>
                            </div>

                            {/* MOBILE CROP & ZOOM */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              <div className="space-y-1">
                                <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Fokus Potong Mobile (Mobile Crop)</label>
                                <select
                                  value={currentSlide.mobileCrop || 'center center'}
                                  onChange={(e) => updateSlideField(activeSlideIdxClamped, 'mobileCrop', e.target.value)}
                                  className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-9"
                                >
                                  <option value="left center">Kiri (left center)</option>
                                  <option value="center center">Tengah (center center)</option>
                                  <option value="right center">Kanan (right center)</option>
                                  <option value="center top">Atas (center top)</option>
                                  <option value="center bottom">Bawah (center bottom)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Zoom Mobile: <span className="text-brand-green font-bold font-mono">{currentSlide.mobileZoom || '100'}%</span></label>
                                <div className="flex items-center gap-2 h-9 bg-white border border-gray-200 px-3 rounded-lg">
                                  <span className="text-[9px] text-gray-400 font-mono">100%</span>
                                  <input
                                    type="range"
                                    min="100"
                                    max="180"
                                    step="5"
                                    value={currentSlide.mobileZoom || '100'}
                                    onChange={(e) => updateSlideField(activeSlideIdxClamped, 'mobileZoom', e.target.value)}
                                    className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                  />
                                  <span className="text-[9px] text-gray-400 font-mono">180%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* OVERLAY DARKNESS PER SLIDE */}
                          <div className="space-y-1 border border-gray-200 p-3.5 rounded-xl bg-gray-50/50">
                            <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">
                              Kegelapan Overlay Per-Slide: <span className="text-brand-green font-bold font-mono">{currentSlide.overlay ?? 0}%</span>
                            </label>
                            <div className="flex items-center gap-3 h-9 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0% (Terang)</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={currentSlide.overlay ?? 0}
                                onChange={(e) => updateSlideField(activeSlideIdxClamped, 'overlay', parseInt(e.target.value, 10))}
                                className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">100% (Gelap)</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Teks SEO Gambar (Alt Text)</label>
                          <input
                            type="text"
                            value={currentSlide.altText || ''}
                            onChange={(e) => updateSlideField(activeSlideIdxClamped, 'altText', e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            placeholder="Deskripsi untuk keterbacaan SEO dan aksesibilitas…"
                          />
                        </div>
                      </div>

                      {/* 4 BENEFIT CARDS SECTION */}
                      <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                        <div className="text-[10px] font-jost font-bold text-gray-400 tracking-widest border-b border-gray-100 pb-1.5">4 KARTU MANFAAT TERKAIT</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map((num) => (
                            <div key={num} className="border border-gray-200 p-3 rounded-xl bg-white space-y-2 shadow-xs">
                              <div className="text-[9px] font-jost font-bold text-[#12372A] tracking-wider">KARTU MANFAAT {num}</div>
                              <div className="space-y-1">
                                <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold">Judul Singkat</label>
                                <input
                                  type="text"
                                  value={homepageCmsForm.hero?.[`stat${num}Value`] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setHomepageCmsForm(prev => {
                                      const hero = { ...(prev?.hero || {}) };
                                      hero[`stat${num}Value`] = val;
                                      const idx = num - 1;
                                      const currentBenefits = Array.isArray(hero.benefits) ? [...hero.benefits] : [];
                                      while (currentBenefits.length < 4) {
                                        currentBenefits.push({ sortOrder: currentBenefits.length, active: true, value: '', label: '', image: '' });
                                      }
                                      currentBenefits[idx] = { ...currentBenefits[idx], value: val, title: val, sortOrder: idx };
                                      hero.benefits = currentBenefits;
                                      return { ...prev, hero };
                                    });
                                  }}
                                  className="w-full text-xs p-2 bg-white border border-gray-200 outline-none rounded-lg font-bold text-[#12372A]"
                                  placeholder={`Misal: ${num === 1 ? 'Petani Lokal' : num === 2 ? 'Berkualitas' : num === 3 ? 'Segar' : 'Berkelanjutan'}`}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold">Deskripsi</label>
                                <textarea
                                  rows={2}
                                  value={homepageCmsForm.hero?.[`stat${num}Label`] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setHomepageCmsForm(prev => {
                                      const hero = { ...(prev?.hero || {}) };
                                      hero[`stat${num}Label`] = val;
                                      const idx = num - 1;
                                      const currentBenefits = Array.isArray(hero.benefits) ? [...hero.benefits] : [];
                                      while (currentBenefits.length < 4) {
                                        currentBenefits.push({ sortOrder: currentBenefits.length, active: true, value: '', label: '', image: '' });
                                      }
                                      currentBenefits[idx] = { ...currentBenefits[idx], label: val, description: val, sortOrder: idx };
                                      hero.benefits = currentBenefits;
                                      return { ...prev, hero };
                                    });
                                  }}
                                  className="w-full text-xs p-2 bg-white border border-gray-200 outline-none rounded-lg text-gray-600"
                                  placeholder="Tulis deskripsi manfaat ini…"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold">Ilustrasi Manfaat</label>
                                
                                {(homepageCmsForm.hero?.[`stat${num}Image`] || homepageCmsForm.hero?.benefits?.[num - 1]?.image) ? (
                                  <div className="space-y-2">
                                    <div className="relative w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                      <Image
                                        src={buildStorageUrl(homepageCmsForm.hero?.[`stat${num}Image`] || homepageCmsForm.hero?.benefits?.[num - 1]?.image) || null}
                                        alt={`Benefit ${num}`}
                                        fill
                                        sizes="80px"
                                        className="object-contain"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 font-medium rounded-lg text-[10px] px-2.5 py-1.5 hover:bg-gray-50 font-jost">
                                        Ganti Gambar
                                        <input
                                          type="file"
                                          accept=".png,.jpg,.jpeg,.webp"
                                          className="hidden"
                                          onChange={(e) => handleFeatureCardFileChange(e, num)}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const idx = num - 1;
                                          if (Array.isArray(relationalBenefitsRef.current) && relationalBenefitsRef.current[idx]) {
                                            relationalBenefitsRef.current[idx] = {
                                              ...relationalBenefitsRef.current[idx],
                                              image: ''
                                            };
                                          }
                                          setHomepageCmsForm(prev => {
                                            const hero = { ...(prev?.hero || {}) };
                                            hero[`stat${num}Image`] = '';
                                            const currentBenefits = Array.isArray(hero.benefits) ? [...hero.benefits] : [];
                                            if (currentBenefits[idx]) {
                                              currentBenefits[idx] = { ...currentBenefits[idx], image: '', removeImage: true };
                                            }
                                            hero.benefits = currentBenefits;
                                            return { ...prev, hero };
                                          });
                                        }}
                                        className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium rounded-lg text-[10px] px-2.5 py-1.5 font-jost"
                                      >
                                        Hapus Gambar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="text-[11px] text-gray-400 italic">Belum ada ilustrasi</div>
                                    <label className="cursor-pointer inline-block bg-[#12372A] text-white font-medium rounded-lg text-[10px] px-3 py-1.5 hover:bg-[#12372A]/90 font-jost">
                                      Upload Gambar
                                      <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.webp"
                                        className="hidden"
                                        onChange={(e) => handleFeatureCardFileChange(e, num)}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                  </div>

                  {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                  <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        <h5 className="font-sans text-xs font-bold tracking-wider text-[#174C3C]">
                          Pratinjau Live Website
                        </h5>
                        <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                      </div>

                      {/* Responsive Device Switcher */}
                      <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Desktop
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('tablet')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Tablet (768px)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Mobile (375px)
                        </button>
                      </div>
                    </div>

                    {/* LIVE PREVIEW FRAME */}
                    <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                      <div className={`transition-all duration-300 mx-auto w-full ${
                        previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                        previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                      }`}>
                        <Hero cms={{ ...homepageCmsForm.hero, allowInactive: true, defaultFirstSlideIdx: activeSlideIdxClamped }} />
                      </div>
                    </div>

                    {/* ACTIONS BAR CONTAINER */}
                    <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModalConfig({
                            title: 'Reset Section Hero',
                            itemName: 'Hero Section',
                            itemType: 'section',
                            message: 'Apakah Anda yakin ingin menyetel ulang bagian Hero saja ke setelan bawaan (default)?',
                            onConfirm: () => {
                              setHomepageCmsForm(prev => ({
                                ...prev,
                                hero: { slides: [], title: "", subtitle: "", badge: "", description: "", overlay: 0 }
                              }));
                              onAddToast('Bagian Hero diatur ulang ke default bawaan!', 'info');
                            }
                          });
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                      >
                        Reset Hero ke Default
                      </button>
                      <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                        Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KATEGORI TAB */}
            {activeSubTab === 'categories' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="font-jost font-bold text-[#12372A] text-sm tracking-wider">Bagian Kelompok Hasil Bumi (Kategori)</h4>
                  <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                    <input
                      type="checkbox"
                      checked={homepageCmsForm.categories?.show ?? true}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        categories: { ...prev.categories, show: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                    />
                    Tampilkan Section Kategori
                  </label>
                </div>

                {/* FORM EDITOR (TOP) */}
                <div className="w-full space-y-6 pt-2">
                  <h4 className="font-jost font-bold text-[#12372A] text-xs tracking-wider border-b border-gray-100 pb-2">
                    Pengaturan Teks & Layout Section Kategori
                  </h4>

                  {/* Header Text Settings */}
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Judul Kecil (Badge)</label>
                    <input
                      type="text"
                      value={homepageCmsForm.categories?.badge || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        categories: { ...prev.categories, badge: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-medium text-gray-800"
                      placeholder="Masukkan judul kecil untuk section Kategori"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Judul Utama</label>
                    <input
                      type="text"
                      value={homepageCmsForm.categories?.title || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        categories: { ...prev.categories, title: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-medium text-gray-800"
                      placeholder="Masukkan judul utama, misal: Temukan Hasil Bumi untuk Setiap Kebutuhan"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Deskripsi</label>
                    <textarea
                      rows={3}
                      value={homepageCmsForm.categories?.description || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        categories: { ...prev.categories, description: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg text-gray-700"
                      placeholder="Tulis deskripsi singkat untuk section Kategori, misal: Dipilih langsung dari petani lokal Bangka..."
                    />
                  </div>

                  {/* Tampilan & Limit */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/40 space-y-4">
                    <h5 className="font-jost font-bold text-[#12372A] text-xs">TAMPILAN & JUMLAH KATEGORI</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Jumlah Maksimal Kategori Ditamplikan (1 - 10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={homepageCmsForm.categories?.limit ?? 5}
                          onChange={(e) => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val)) val = 1;
                            if (val < 1) val = 1;
                            if (val > 10) val = 10;
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              categories: { ...prev.categories, limit: val }
                            }));
                          }}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-medium text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Hover Effect Card</label>
                        <select
                          value={homepageCmsForm.categories?.hoverEffect || 'lift'}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            categories: { ...prev.categories, hoverEffect: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 font-medium"
                        >
                          <option value="none">none (Tanpa Efek)</option>
                          <option value="scale">scale (Perbesar)</option>
                          <option value="lift">lift (Terangkat)</option>
                          <option value="glow">glow (Cahaya)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Opsi Kartu Kategori */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/40 space-y-3">
                    <h5 className="font-jost font-bold text-[#12372A] text-xs">OPSI KARTU KATEGORI</h5>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 font-medium">
                        <input
                          type="checkbox"
                          checked={homepageCmsForm.categories?.showCategoryDescription ?? true}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            categories: { ...prev.categories, showCategoryDescription: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                        />
                        Tampilkan Deskripsi Kategori
                      </label>
                    </div>
                  </div>

                  {/* Tombol Lihat Semua */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/40 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs">TOMBOL "LIHAT SEMUA KATEGORI"</h5>
                      <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                        <input
                          type="checkbox"
                          checked={homepageCmsForm.categories?.showViewAllButton ?? true}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            categories: { ...prev.categories, showViewAllButton: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                        />
                        Tampilkan Tombol
                      </label>
                    </div>

                    {homepageCmsForm.categories?.showViewAllButton !== false && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Teks Tombol</label>
                          <input
                            type="text"
                            value={homepageCmsForm.categories?.viewAllButtonText || 'Lihat Semua Kategori'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              categories: { ...prev.categories, viewAllButtonText: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-medium text-gray-800"
                            placeholder="Masukkan teks tombol, misal: Lihat Semua Kategori"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Tautan Tombol</label>
                          <input
                            type="text"
                            value={homepageCmsForm.categories?.viewAllButtonLink || '/kategori'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              categories: { ...prev.categories, viewAllButtonLink: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono text-gray-800"
                            placeholder="/kategori"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kelola Individual Items Kategori */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/40 space-y-6">
                    <div>
                      <h5 className="font-jost font-bold text-[#12372A] text-xs tracking-wider">Kelola Visual & Informasi Kategori Individual</h5>
                      <p className="text-[10px] text-gray-500 font-jost mt-1">
                        Atur gambar, posisi potong (crop position), zoom gambar, badge, serta deskripsi singkat untuk setiap kategori.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {categoriesForm.map((cat, index) => {
                        const imageUrl = buildStorageUrl(cat.image) || null;
                        
                        // Handle updating local fields instantly on blur/change
                        const handleUpdateField = (field, value) => {
                          const updated = categoriesForm.map((c, i) => {
                            if (i === index) {
                              return { ...c, [field]: value };
                            }
                            return c;
                          });
                          setCategoriesForm(updated);
                        };

                        // Hidden file upload handler
                        const handleFileUpload = async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const preview = createPreviewUrl(file);
                            previewUrlsRef.current.push(preview);
                            // Instant preview
                            handleUpdateField('image', preview);

                            try {
                              const res = await uploadFileToSupabase(file, 'categories', `category_${cat.slug || index}.jpg`);
                              if (res.success && res.url) {
                                handleUpdateField('image', res.url);
                                onAddToast('Gambar berhasil diupload!', 'success');
                              } else {
                                onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
                              }
                            } catch (err) {
                              logger.error('Category upload error:', err);
                              onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
                            } finally {
                              e.target.value = '';
                            }
                          }
                        };

                        return (
                          <div key={cat.id || cat.name} className="p-4 bg-white border border-gray-200/60 rounded-xl shadow-xs flex flex-col md:flex-row gap-5">
                            {/* 1. Preview Card Kecil */}
                            <div className="w-[140px] shrink-0 mx-auto md:mx-0">
                              <div className="text-[8px] font-jost font-bold text-gray-400 tracking-widest mb-1.5 text-center md:text-left">Preview Card</div>
                              <div className="h-[210px] w-[130px] rounded-lg border border-gray-100 overflow-hidden flex flex-col justify-between shadow-xs bg-white text-left mx-auto">
                                {/* Top Image Frame */}
                                <div className="h-[120px] w-full relative bg-gray-50 overflow-hidden shrink-0">
                                  {cat.metaTitle && (
                                    <span className="absolute top-1.5 left-1.5 z-20 text-[7px] font-bold text-[#174C3C] tracking-wide">
                                      {cat.metaTitle}
                                    </span>
                                  )}
                                  <div className="w-full h-full overflow-hidden relative">
                                    <Image
                                      src={imageUrl || null}
                                      alt={cat.name}
                                      fill
                                      sizes="130px"
                                      style={{
                                        objectPosition: cat.cropPosition || 'center center',
                                        transform: `scale(${parseFloat(cat.cropZoom || '100') / 100})`
                                      }}
                                      className="object-cover select-none pointer-events-none origin-center"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 pointer-events-none" />
                                </div>
                                
                                {/* Bottom Content Frame */}
                                <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
                                  <div className="space-y-0.5">
                                    <h6 className="text-[10px] font-semibold text-[#174C3C] tracking-tight line-clamp-1">
                                      {cat.name}
                                    </h6>
                                    {cat.description && (
                                      <p className="text-[8px] text-gray-400 font-normal leading-tight line-clamp-2">
                                        {cat.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-[#174C3C] font-semibold text-[8px] tracking-wide mt-1 flex items-center">
                                    <span>Lihat Kategori</span>
                                    <span className="ml-0.5">→</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. Form Inputs */}
                            <div className="flex-1 space-y-3.5 bg-white text-left">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                <span className="font-jost font-bold text-xs text-[#174C3C]">{cat.name}</span>
                                <span className={`text-[8px] font-mono font-bold ${
                                  cat.status !== 'Nonaktif' ? 'text-green-700' : 'text-gray-500'
                                }`}>
                                  {cat.status !== 'Nonaktif' ? '🟢 Aktif' : '⚫ Nonaktif'}
                                </span>
                              </div>

                              {/* URL Gambar & File Upload */}
                              <div className="space-y-1">
                                <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold">Gambar Kategori</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={cat.image || ''}
                                    onChange={(e) => {
                                      const updated = [...categoriesForm];
                                      updated[index] = { ...updated[index], image: e.target.value };
                                      setCategoriesForm(updated);
                                    }}
                                    onBlur={(e) => handleUpdateField('image', e.target.value)}
                                    className="flex-1 text-[11px] p-2 bg-white border border-gray-200 outline-none rounded-lg font-mono text-gray-800"
                                    placeholder="Masukkan URL gambar kategori..."
                                  />
                                  <label className="px-3 py-2 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] tracking-widest cursor-pointer flex items-center justify-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                                    UPLOAD
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleFileUpload}
                                    />
                                  </label>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Badge kategori */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold">Badge Kategori</label>
                                  <input
                                    type="text"
                                    value={cat.metaTitle || ''}
                                    onChange={(e) => {
                                      const updated = [...categoriesForm];
                                      updated[index] = { ...updated[index], metaTitle: e.target.value };
                                      setCategoriesForm(updated);
                                    }}
                                    onBlur={(e) => handleUpdateField('metaTitle', e.target.value)}
                                    className="w-full text-[11px] p-2 bg-white border border-gray-200 outline-none rounded-lg text-gray-800"
                                    placeholder="Masukkan badge, misal: Populer, Segar..."
                                  />
                                </div>

                                {/* Crop position */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold">Fokus Potong (Crop Position)</label>
                                  <select
                                    value={cat.cropPosition || 'center center'}
                                    onChange={(e) => handleUpdateField('cropPosition', e.target.value)}
                                    className="w-full text-[11px] p-2 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer text-gray-700 h-8"
                                  >
                                    <option value="left center">Kiri (left center)</option>
                                    <option value="center center">Tengah (center center)</option>
                                    <option value="right center">Kanan (right center)</option>
                                    <option value="center top">Atas (center top)</option>
                                    <option value="center bottom">Bawah (center bottom)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Deskripsi singkat */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold">Deskripsi Singkat</label>
                                  <input
                                    type="text"
                                    value={cat.description || ''}
                                    onChange={(e) => {
                                      const updated = [...categoriesForm];
                                      updated[index] = { ...updated[index], description: e.target.value };
                                      setCategoriesForm(updated);
                                    }}
                                    onBlur={(e) => handleUpdateField('description', e.target.value)}
                                    className="w-full text-[11px] p-2 bg-white border border-gray-200 outline-none rounded-lg text-gray-800"
                                    placeholder="Tulis deskripsi singkat kategori..."
                                  />
                                </div>

                                {/* Crop zoom */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold">Crop Zoom: <span className="text-brand-green font-bold font-mono">{cat.cropZoom || '100'}%</span></label>
                                  <div className="flex items-center gap-2 h-8 bg-white border border-gray-200 px-2 rounded-lg">
                                    <span className="text-[9px] text-gray-400 font-mono">100%</span>
                                    <input
                                      type="range"
                                      min="100"
                                      max="180"
                                      step="5"
                                      value={cat.cropZoom || '100'}
                                      onChange={(e) => handleUpdateField('cropZoom', e.target.value)}
                                      className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                                    />
                                    <span className="text-[9px] text-gray-400 font-mono">180%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h5 className="font-sans text-xs font-bold tracking-wider text-[#174C3C]">
                        Pratinjau Live Website
                      </h5>
                      <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                    </div>

                    {/* Responsive Device Switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Tablet (768px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Mobile (375px)
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW FRAME */}
                  <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                    <div className={`transition-all duration-300 mx-auto w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                      previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                    }`}>
                      <Categories cms={{ ...homepageCmsForm.categories, show: true }} categories={categoriesForm} />
                    </div>
                  </div>

                  {/* ACTIONS BAR CONTAINER */}
                  <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalConfig({
                          title: 'Reset Section Kategori',
                          itemName: 'Bagian Kategori',
                          itemType: 'section',
                          message: 'Apakah Anda yakin ingin menyetel ulang bagian Kategori saja ke setelan bawaan (default)?',
                          onConfirm: () => {
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              categories: { 
                                show: true, 
                                badge: "", 
                                title: "Temukan Hasil Bumi untuk Setiap Kebutuhan", 
                                description: "Dipilih langsung dari petani lokal Bangka dengan kualitas terbaik untuk kebutuhan sehari-hari Anda.", 
                                limit: 5, 
                                showCategoryDescription: true, 
                                showViewAllButton: true, 
                                viewAllButtonText: "Lihat Semua Kategori", 
                                viewAllButtonLink: "/kategori" 
                              }
                            }));
                            onAddToast('Bagian Kategori diatur ulang ke default bawaan!', 'info');
                          }
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                    >
                      Reset Kategori ke Default
                    </button>
                    <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                      Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUK TAB */}
            {activeSubTab === 'featuredProducts' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="font-jost font-bold text-[#12372A] text-sm tracking-wider">Bagian Rekomendasi / Produk Terpopuler</h4>
                  <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                    <input
                      type="checkbox"
                      checked={homepageCmsForm.featuredProducts?.show ?? true}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        featuredProducts: { ...prev.featuredProducts, show: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                    />
                    Tampilkan Section Produk
                  </label>
                </div>

                {/* FORM EDITOR (TOP) */}
                <div className="w-full space-y-6">
                  {/* SECTION 1: KONTEN */}
                  <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                    <h5 className="font-jost font-bold text-[#12372A] text-xs tracking-wide border-b border-gray-100 pb-2">Pengaturan Konten</h5>
                    
                    <div className="space-y-1">
                      <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Judul Kecil (Badge)</label>
                      <input
                        type="text"
                        value={homepageCmsForm.featuredProducts?.badge || ''}
                        onChange={(e) => setHomepageCmsForm(prev => ({
                          ...prev,
                          featuredProducts: { ...prev.featuredProducts, badge: e.target.value }
                        }))}
                        className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                        placeholder="Masukkan judul kecil, misal: REKOMENDASI TERPOPULER"
                      />
                    </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Judul Utama</label>
                        <input
                          type="text"
                          value={homepageCmsForm.featuredProducts?.title || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            featuredProducts: { ...prev.featuredProducts, title: e.target.value }
                          }))}
                          className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                          placeholder="Masukkan judul utama, misal: Produk Unggulan Hasil Bumi"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Deskripsi</label>
                        <textarea
                          rows={2}
                          value={homepageCmsForm.featuredProducts?.description || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            featuredProducts: { ...prev.featuredProducts, description: e.target.value }
                          }))}
                          className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                          placeholder="Tulis deskripsi singkat untuk section produk…"
                        />
                      </div>
                    </div>

                    {/* SECTION 2: LATAR BELAKANG */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs tracking-wide border-b border-gray-100 pb-2">02. Latar Belakang (Background)</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Warna Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.featuredProducts?.background?.startsWith('#') ? homepageCmsForm.featuredProducts.background : '#F7F8F5'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, background: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.featuredProducts?.background || '#F7F8F5'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, background: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                              placeholder="#ECF6ED atau bg-white..."
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Gambar Latar Belakang (URL)</label>
                          <input
                            type="text"
                            value={homepageCmsForm.featuredProducts?.backgroundImage || ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, backgroundImage: e.target.value }
                            }))}
                            className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px]"
                            placeholder="URL gambar atau kosongi..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: LAYOUT */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs tracking-wide border-b border-gray-100 pb-2">03. Layout & Padding</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Limit Produk Tampil (1-20)</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={homepageCmsForm.featuredProducts?.limit ?? 12}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, limit: Math.max(1, Math.min(20, parseInt(e.target.value) || 12)) }
                            }))}
                            className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Spasi Vertikal (Padding Y)</label>
                          <select
                            value={homepageCmsForm.featuredProducts?.paddingY || 'py-16'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, paddingY: e.target.value }
                            }))}
                            className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 bg-[image:none]"
                          >
                            <option value="py-8">py-8 (Lebih Rapat)</option>
                            <option value="py-12">py-12 (Sedang)</option>
                            <option value="py-16">py-16 (Standar)</option>
                            <option value="py-20">py-20 (Lebar)</option>
                            <option value="py-24">py-24 (Sangat Lebar)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: HOVER & SLIDER */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs tracking-wide border-b border-gray-100 pb-2">04. Efek Hover & Pengaturan Slider</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Efek Hover Kartu</label>
                          <select
                            value={homepageCmsForm.featuredProducts?.hoverEffect || 'lift'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, hoverEffect: e.target.value }
                            }))}
                            className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 bg-[image:none]"
                          >
                            <option value="none">Tanpa Efek (none)</option>
                            <option value="scale">Perbesar Sedikit (scale)</option>
                            <option value="lift">Melayang ke Atas (lift)</option>
                            <option value="glow">Efek Berpendar (glow)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Autoplay Interval</label>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] font-mono text-gray-400 shrink-0">3s</span>
                            <input
                              type="range"
                              min="3000"
                              max="10000"
                              step="500"
                              value={homepageCmsForm.featuredProducts?.autoplaySpeed ?? 6000}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, autoplaySpeed: parseInt(e.target.value) }
                              }))}
                              className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                              disabled={!(homepageCmsForm.featuredProducts?.autoplay ?? true)}
                            />
                            <span className="text-[9px] font-mono text-gray-400 shrink-0">10s</span>
                            <span className="text-[10px] font-mono text-brand-green font-bold shrink-0">({(homepageCmsForm.featuredProducts?.autoplaySpeed ?? 6000) / 1000}s)</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.autoplay ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, autoplay: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Aktifkan Autoplay
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showProgress ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showProgress: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tampilkan Progress Indicator
                        </label>
                      </div>

                      <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showArrows ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showArrows: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tampilkan Panah Navigasi
                        </label>
                      </div>
                    </div>

                    {/* SECTION 5: KARTU PRODUK */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs tracking-wide border-b border-gray-100 pb-2">05. Elemen Kartu Produk</h5>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showCategory ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showCategory: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Kategori Produk
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showDiscountPrice ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showDiscountPrice: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Harga Diskon
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showUnit ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showUnit: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Satuan Unit (ex. PPN/kg)
                        </label>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showCartButton ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showCartButton: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tombol Keranjang
                        </label>
                      </div>
                    </div>

                    {/* SECTION 6: TOMBOL CTA */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs tracking-wide border-b border-gray-100 pb-2">06. Tombol Aksi (CTA)</h5>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showViewAllButton ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showViewAllButton: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tampilkan Tombol Eksplorasi Utama
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Teks Tombol</label>
                            <input
                              type="text"
                              value={homepageCmsForm.featuredProducts?.buttonText || 'Eksplorasi Katalog Lengkap'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, buttonText: e.target.value }
                              }))}
                              className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                              placeholder="Eksplorasi Katalog Lengkap"
                              disabled={!(homepageCmsForm.featuredProducts?.showViewAllButton ?? true)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] tracking-wider text-gray-400 block font-bold">Tautan Tombol (URL/Hash)</label>
                            <input
                              type="text"
                              value={homepageCmsForm.featuredProducts?.buttonLink || '/produk'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, buttonLink: e.target.value }
                              }))}
                              className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px]"
                              placeholder="/produk atau #catalog"
                              disabled={!(homepageCmsForm.featuredProducts?.showViewAllButton ?? true)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 7: INTERACTIVE PRODUCT PRIORITY SYSTEM */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <div className="space-y-1 border-b border-gray-100 pb-2">
                        <h5 className="font-jost font-bold text-[#12372A] text-xs tracking-wide">07. Pilih & Urutkan Produk Unggulan</h5>
                        <p className="text-[10px] text-gray-500 font-jost leading-relaxed">
                          Daftar di bawah menampilkan semua produk dari database Anda. Centang produk untuk menambahkannya ke list **Selected Product IDs** dan **Order** di CMS. Atur urutan visual menggunakan tombol (▲/▼) secara dinamis tanpa mempengaruhi data produk master.
                        </p>
                      </div>

                      {/* Search Bar for products */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari produk sayuran..."
                          id="cms-product-search"
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase();
                            document.querySelectorAll('.cms-prod-item').forEach(el => {
                              const name = el.getAttribute('data-name')?.toLowerCase() || '';
                              if (name.includes(val)) {
                                el.classList.remove('hidden');
                              } else {
                                el.classList.add('hidden');
                              }
                            });
                          }}
                          className="w-full text-xs p-2.5 pl-8 bg-white border border-gray-200 outline-none rounded-lg font-jost"
                        />
                        <span className="absolute left-3 top-3 text-gray-400 text-xs">🔍</span>
                      </div>

                      {/* Scrollable list of products */}
                      <div className="max-h-[350px] overflow-y-auto border border-gray-200/60 rounded-xl divide-y divide-gray-100 bg-white shadow-xs">
                        {products.filter(p => p.status !== 'Draft').map((p) => {
                          const selectedProductIds = homepageCmsForm.featuredProducts?.selectedProductIds || [];
                          const order = homepageCmsForm.featuredProducts?.order || [];
                          
                          // Check if featured either via CMS manually or legacy isFeatured flag
                          const isFeat = selectedProductIds.includes(p.id) || p.isFeatured;
                          
                          return (
                            <div 
                              key={p.id} 
                              data-name={p.name}
                              className="cms-prod-item p-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors bg-white"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isFeat}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    
                                    // 1. Update legacy isFeatured database state for backward compatibility
                                    const updatedProducts = products.map(prod => {
                                      if (prod.id === p.id) {
                                        return { ...prod, isFeatured: isChecked };
                                      }
                                      return prod;
                                    });
                                    onSaveProducts(updatedProducts);

                                    // 2. Update new CMS selectedProductIds and order state
                                    setHomepageCmsForm(prev => {
                                      const curFeat = prev.featuredProducts || {};
                                      let selIds = [...(curFeat.selectedProductIds || [])];
                                      let ordIds = [...(curFeat.order || [])];

                                      // Migrate legacy values to state if empty initially
                                      if (selIds.length === 0) {
                                        selIds = products.filter(prod => prod.isFeatured && prod.id !== p.id).map(prod => prod.id);
                                        ordIds = [...selIds];
                                      }

                                      if (isChecked) {
                                        if (!selIds.includes(p.id)) {
                                          selIds.push(p.id);
                                        }
                                        if (!ordIds.includes(p.id)) {
                                          ordIds.push(p.id);
                                        }
                                      } else {
                                        selIds = selIds.filter(id => id !== p.id);
                                        ordIds = ordIds.filter(id => id !== p.id);
                                      }

                                      return {
                                        ...prev,
                                        featuredProducts: {
                                          ...curFeat,
                                          selectedProductIds: selIds,
                                          order: ordIds
                                        }
                                      };
                                    });

                                    onAddToast(`Status Featured "${p.name}" berhasil diperbarui!`, 'success');
                                  }}
                                  className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                                />
                                <div className="relative w-10 h-10 rounded-md border border-gray-100 overflow-hidden shrink-0">
                                  {p.image ? (
                                    <Image 
                                      src={buildStorageUrl(p.image)} 
                                      alt={p.name} 
                                      fill
                                      sizes="40px"
                                      className="object-cover" 
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                                      {p.name.slice(0, 2)}
                                    </div>
                                  )}
                                </div>
                                <div className="text-left leading-tight">
                                  <span className="font-jost text-xs font-semibold text-[#12372A] block leading-tight">{p.name}</span>
                                  <span className="font-jost text-[9px] text-gray-400 tracking-wider block mt-0.5">
                                    {p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category) || 'Hasil Panen'} • {formatRupiah(p.price)}
                                  </span>
                                </div>
                              </div>

                              {/* Sorting Up / Down buttons */}
                              {isFeat && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    title="Naikkan Urutan"
                                    onClick={() => {
                                      const curFeat = homepageCmsForm.featuredProducts || {};
                                      let ordIds = [...(curFeat.order || [])];
                                      
                                      // If order is empty, populate from isFeatured products
                                      if (ordIds.length === 0) {
                                        ordIds = products.filter(prod => prod.isFeatured).map(prod => prod.id);
                                      }
                                      // Make sure current product is in order array
                                      if (!ordIds.includes(p.id)) {
                                        ordIds.push(p.id);
                                      }

                                      const fIdx = ordIds.indexOf(p.id);
                                      if (fIdx > 0) {
                                        const temp = ordIds[fIdx];
                                        ordIds[fIdx] = ordIds[fIdx - 1];
                                        ordIds[fIdx - 1] = temp;

                                        // Update state
                                        setHomepageCmsForm(prev => ({
                                          ...prev,
                                          featuredProducts: {
                                            ...(prev.featuredProducts || {}),
                                            order: ordIds,
                                            selectedProductIds: prev.featuredProducts?.selectedProductIds?.length ? prev.featuredProducts.selectedProductIds : ordIds
                                          }
                                        }));

                                        // Optionally sort the database products too for legacy compatibility
                                        const reorderedProducts = [...products];
                                        reorderedProducts.sort((a, b) => {
                                          const idxA = ordIds.indexOf(a.id);
                                          const idxB = ordIds.indexOf(b.id);
                                          if (idxA === -1 && idxB === -1) return 0;
                                          if (idxA === -1) return 1;
                                          if (idxB === -1) return -1;
                                          return idxA - idxB;
                                        });
                                        onSaveProducts(reorderedProducts);

                                        onAddToast(`Urutan "${p.name}" berhasil dinaikkan!`, 'success');
                                      }
                                    }}
                                    disabled={(() => {
                                      const ordIds = homepageCmsForm.featuredProducts?.order || products.filter(prod => prod.isFeatured).map(prod => prod.id);
                                      return ordIds.indexOf(p.id) <= 0;
                                    })()}
                                    className="p-1 bg-white border border-gray-200 hover:border-[#12372A] disabled:opacity-30 disabled:hover:border-gray-200 text-[#12372A] rounded cursor-pointer transition-colors text-[9px] w-6 h-6 flex items-center justify-center font-bold"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    title="Turunkan Urutan"
                                    onClick={() => {
                                      const curFeat = homepageCmsForm.featuredProducts || {};
                                      let ordIds = [...(curFeat.order || [])];
                                      
                                      // If order is empty, populate from isFeatured products
                                      if (ordIds.length === 0) {
                                        ordIds = products.filter(prod => prod.isFeatured).map(prod => prod.id);
                                      }
                                      // Make sure current product is in order array
                                      if (!ordIds.includes(p.id)) {
                                        ordIds.push(p.id);
                                      }

                                      const fIdx = ordIds.indexOf(p.id);
                                      if (fIdx !== -1 && fIdx < ordIds.length - 1) {
                                        const temp = ordIds[fIdx];
                                        ordIds[fIdx] = ordIds[fIdx + 1];
                                        ordIds[fIdx + 1] = temp;

                                        // Update state
                                        setHomepageCmsForm(prev => ({
                                          ...prev,
                                          featuredProducts: {
                                            ...(prev.featuredProducts || {}),
                                            order: ordIds,
                                            selectedProductIds: prev.featuredProducts?.selectedProductIds?.length ? prev.featuredProducts.selectedProductIds : ordIds
                                          }
                                        }));

                                        // Optionally sort the database products too for legacy compatibility
                                        const reorderedProducts = [...products];
                                        reorderedProducts.sort((a, b) => {
                                          const idxA = ordIds.indexOf(a.id);
                                          const idxB = ordIds.indexOf(b.id);
                                          if (idxA === -1 && idxB === -1) return 0;
                                          if (idxA === -1) return 1;
                                          if (idxB === -1) return -1;
                                          return idxA - idxB;
                                        });
                                        onSaveProducts(reorderedProducts);

                                        onAddToast(`Urutan "${p.name}" berhasil diturunkan!`, 'success');
                                      }
                                    }}
                                    disabled={(() => {
                                      const ordIds = homepageCmsForm.featuredProducts?.order || products.filter(prod => prod.isFeatured).map(prod => prod.id);
                                      const fIdx = ordIds.indexOf(p.id);
                                      return fIdx === -1 || fIdx === ordIds.length - 1;
                                    })()}
                                    className="p-1 bg-white border border-gray-200 hover:border-[#12372A] disabled:opacity-30 disabled:hover:border-gray-200 text-[#12372A] rounded cursor-pointer transition-colors text-[9px] w-6 h-6 flex items-center justify-center font-bold"
                                  >
                                    ▼
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h5 className="font-sans text-xs font-bold tracking-wider text-[#174C3C]">
                        Pratinjau Live Website
                      </h5>
                      <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                    </div>

                    {/* Responsive Device Switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Tablet (768px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Mobile (375px)
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW FRAME */}
                  <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                    <div className={`transition-all duration-300 mx-auto w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                      previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                    }`}>
                      <FeaturedCarousel
                        products={products}
                        cms={homepageCmsForm.featuredProducts}
                        onOpenProductDetail={(p) => onAddToast(`Preview Detail: ${p.name}`, 'info')}
                        onAddToCart={(p) => onAddToast(`Preview Beli: ${p.name}`, 'success')}
                      />
                    </div>
                  </div>

                  {/* ACTIONS BAR CONTAINER */}
                  <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalConfig({
                          title: 'Reset Section Produk',
                          itemName: 'Bagian Produk Terpopuler',
                          itemType: 'section',
                          message: 'Apakah Anda yakin ingin menyetel ulang bagian Produk saja ke setelan bawaan (default)?',
                          onConfirm: () => {
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: {
                                show: true,
                                badge: "REKOMENDASI TERPOPULER",
                                title: "Produk Unggulan Hasil Bumi",
                                description: "Koleksi hasil bumi terlaris yang langsung dipanen oleh para petani lokal Bangka.",
                                limit: 8,
                                mode: "manual"
                              }
                            }));
                            onAddToast('Bagian Produk Terpopuler diatur ulang ke default bawaan!', 'info');
                          }
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                    >
                      Reset Produk ke Default
                    </button>
                    <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                      Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GALERI TAB */}
            {activeSubTab === 'gallery' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="font-jost font-bold text-[#12372A] text-sm tracking-wider">Bagian Galeri Foto Lanskap</h4>
                  <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                    <input
                      type="checkbox"
                      checked={homepageCmsForm.gallery?.show ?? true}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        gallery: { ...prev.gallery, show: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                    />
                    Tampilkan Section Galeri
                  </label>
                </div>

                {/* FORM EDITOR (TOP) */}
                <div className="w-full space-y-6">
                  {/* A. INFORMASI SECTION */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                    <div className="text-[10px] font-jost font-bold text-gray-400 tracking-widest border-b border-gray-100 pb-1.5">A. Informasi Section</div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Judul Kecil (Badge) *</label>
                        <input
                          type="text"
                          required
                          value={homepageCmsForm.gallery?.badge || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            gallery: { ...prev.gallery, badge: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          placeholder="Masukkan badge, misal: GALERI TANI"
                        />
                      </div>
                    </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Judul Utama *</label>
                        <input
                          type="text"
                          required
                          value={homepageCmsForm.gallery?.title || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            gallery: { ...prev.gallery, title: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          placeholder="Masukkan judul utama, misal: Dokumentasi Kebun & Aktivitas"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Deskripsi</label>
                        <textarea
                          rows={2}
                          value={homepageCmsForm.gallery?.description || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            gallery: { ...prev.gallery, description: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg text-gray-700 leading-relaxed focus:border-[#12372A]"
                          placeholder="Tulis deskripsi singkat galeri…"
                        />
                      </div>
                    </div>

                    {/* B. LATAR BELAKANG */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 tracking-widest border-b border-gray-100 pb-1.5">B. Latar Belakang (Background)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Warna Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.gallery?.background?.startsWith('#') ? homepageCmsForm.gallery.background : '#F4F8F4'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, background: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.gallery?.background ?? '#F4F8F4'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, background: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#F4F8F4"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Gambar Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={homepageCmsForm.gallery?.backgroundImage ?? ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, backgroundImage: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px] focus:border-[#12372A]"
                              placeholder="URL gambar background (opsional)"
                            />
                            <label className="px-3 py-2 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] tracking-widest cursor-pointer flex items-center justify-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                              UPLOAD
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const preview = createPreviewUrl(file);
                                    previewUrlsRef.current.push(preview);
                                    setHomepageCmsForm(prev => ({
                                      ...prev,
                                      gallery: { ...prev.gallery, backgroundImage: preview }
                                    }));
                                    try {
                                      const res = await uploadFileToSupabase(file, 'gallery');
                                      if (res.success && res.url) {
                                        setHomepageCmsForm(prev => ({
                                          ...prev,
                                          gallery: { ...prev.gallery, backgroundImage: res.url }
                                        }));
                                        onAddToast('Gambar berhasil diupload!', 'success');
                                      } else {
                                        onAddToast(res.error || 'Gambar gagal diupload. Silakan coba lagi.', 'error');
                                      }
                                    } catch (err) {
                                      logger.error('Gallery bg upload error:', err);
                                      onAddToast('Gambar gagal diupload. Silakan coba lagi.', 'error');
                                    } finally {
                                      e.target.value = '';
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* C. LAYOUT */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 tracking-widest border-b border-gray-100 pb-1.5">C. Tata Letak (Layout)</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Limit Gambar Tampil (1-12)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={homepageCmsForm.gallery?.limit ?? 6}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, limit: parseInt(e.target.value, 10) || 6 }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Padding Y (Spasi Vertikal)</label>
                          <select
                            value={homepageCmsForm.gallery?.paddingY ?? 'py-16'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, paddingY: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="py-8">py-8 (Sangat Rapat)</option>
                            <option value="py-12">py-12</option>
                            <option value="py-16">py-16 (Sedang)</option>
                            <option value="py-20">py-20</option>
                            <option value="py-24">py-24 (Sangat Lapang)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Efek Hover Kartu</label>
                          <select
                            value={homepageCmsForm.gallery?.hoverEffect ?? 'lift'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, hoverEffect: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="none">none (Tanpa Efek)</option>
                            <option value="lift">lift (Terangkat)</option>
                            <option value="scale">scale (Perbesar)</option>
                            <option value="glow">glow (Cahaya)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Gaya Kartu (Card Style)</label>
                          <select
                            value={homepageCmsForm.gallery?.cardStyle ?? 'modern'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, cardStyle: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="classic">Classic (Tradisional)</option>
                            <option value="modern">Modern (Bersih & Tipis)</option>
                            <option value="minimalist">Minimalist (Tanpa Batas)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Bayangan Kartu (Card Shadow)</label>
                          <select
                            value={homepageCmsForm.gallery?.cardShadow ?? 'soft'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, cardShadow: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="none">None (Tanpa Bayangan)</option>
                            <option value="sm">sm (Tipis)</option>
                            <option value="soft">soft (Sangat Lembut)</option>
                            <option value="lg">lg (Tegas)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* D. CARD COLORS */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 tracking-widest border-b border-gray-100 pb-1.5">D. Tampilan Kartu (Card Colors)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Latar Belakang Kartu</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.gallery?.cardBackground?.startsWith('#') ? homepageCmsForm.gallery.cardBackground : '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, cardBackground: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.gallery?.cardBackground ?? '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, cardBackground: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] tracking-wider text-gray-500 block font-bold">Warna Batas (Border) Kartu</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.gallery?.cardBorder?.startsWith('#') ? homepageCmsForm.gallery.cardBorder : '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, cardBorder: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.gallery?.cardBorder ?? '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, cardBorder: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* E. TOGGLES */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 tracking-widest border-b border-gray-100 pb-1.5">E. Fitur & Interaksi (Toggles)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold font-jost">Efek Pijar (Glow Effect)</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg mt-1 select-none focus-within:border-[#12372A]">
                            <input
                              type="checkbox"
                              checked={homepageCmsForm.gallery?.showGlow ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, showGlow: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                            />
                            Aktifkan Efek Glow Kartu
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[8px] tracking-wider text-gray-400 block font-bold font-jost">Pop-up Gambar (Lightbox)</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg mt-1 select-none focus-within:border-[#12372A]">
                            <input
                              type="checkbox"
                              checked={homepageCmsForm.gallery?.showLightbox ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, showLightbox: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                            />
                            Aktifkan Fitur Lightbox
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* GALERI ITEM MANAGEMENT REMINDER */}
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800 space-y-1.5">
                      <p className="font-jost font-bold tracking-wider text-[10px]">💡 Manajemen Koleksi Foto Galeri</p>
                      <p className="text-[11px] leading-relaxed text-emerald-700/90 font-jost">
                        Formulir di atas berfungsi untuk mengatur estetika visual section (judul, latar belakang, efek, limit, dll). Untuk menambah, mengubah deskripsi, atau menghapus foto-foto spesifik dari database Galeri, silakan gunakan menu **Gallery Management** pada sidebar admin kiri.
                      </p>
                    </div>
                  </div>

                {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h5 className="font-sans text-xs font-bold tracking-wider text-[#174C3C]">
                        Pratinjau Live Website
                      </h5>
                      <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                    </div>

                    {/* Responsive Device Switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Tablet (768px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Mobile (375px)
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW FRAME */}
                  <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                    <div className={`transition-all duration-300 mx-auto w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                      previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                    }`}>
                      <Gallery cms={homepageCmsForm.gallery} />
                    </div>
                  </div>

                  {/* ACTIONS BAR CONTAINER */}
                  <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalConfig({
                          title: 'Reset Section Galeri',
                          itemName: 'Bagian Galeri',
                          itemType: 'section',
                          message: 'Apakah Anda yakin ingin menyetel ulang bagian Galeri ke setelan bawaan (default)?',
                          onConfirm: () => {
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { list: [] }
                            }));
                            onAddToast('Bagian Galeri diatur ulang ke default bawaan!', 'info');
                          }
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                    >
                      Reset Galeri ke Default
                    </button>
                    <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                      Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 08. FOOTER TAB */}
            {activeSubTab === 'footer' && (
              <div className="space-y-5">
                <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#12372A] text-white text-[10px] font-jost flex items-center justify-center rounded-full font-bold">08</span>
                  <h4 className="font-jost font-bold text-[#12372A] text-sm">Konfigurasi Footer Halaman</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] tracking-wider text-gray-400 block">Teks Logo / Nama Brand</label>
                    <input
                      type="text"
                      value={homepageCmsForm.footer?.logoText || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        footer: { ...prev.footer, logoText: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                      placeholder="Masukkan teks logo atau nama brand"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] tracking-wider text-gray-400 block">Nama Lengkap Website</label>
                    <input
                      type="text"
                      value={homepageCmsForm.footer?.websiteName || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        footer: { ...prev.footer, websiteName: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                      placeholder="Masukkan nama lengkap website"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-jost text-[9px] tracking-wider text-gray-400 block">Deskripsi / Manifesto Singkat Footer</label>
                  <textarea
                    rows={3}
                    value={homepageCmsForm.footer?.description || ''}
                    onChange={(e) => setHomepageCmsForm(prev => ({
                      ...prev,
                      footer: { ...prev.footer, description: e.target.value }
                    }))}
                    className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                    placeholder="Tulis deskripsi singkat atau manifesto untuk footer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-jost text-[9px] tracking-wider text-gray-400 block">Alamat Fisik Kebun / Kantor</label>
                  <input
                    type="text"
                    value={homepageCmsForm.footer?.address || ''}
                    onChange={(e) => setHomepageCmsForm(prev => ({
                      ...prev,
                      footer: { ...prev.footer, address: e.target.value }
                    }))}
                    className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] tracking-wider text-gray-400 block">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={homepageCmsForm.footer?.whatsapp || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        footer: { ...prev.footer, whatsapp: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                      placeholder="Masukkan nomor WhatsApp"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] tracking-wider text-gray-400 block">Alamat Email</label>
                    <input
                      type="text"
                      value={homepageCmsForm.footer?.email || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        footer: { ...prev.footer, email: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                      placeholder="Masukkan alamat email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-jost text-[9px] tracking-wider text-gray-400 block">Teks Hak Cipta (Copyright)</label>
                  <input
                    type="text"
                    value={homepageCmsForm.footer?.copyright || ''}
                    onChange={(e) => setHomepageCmsForm(prev => ({
                      ...prev,
                      footer: { ...prev.footer, copyright: e.target.value }
                    }))}
                    className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                    placeholder="Masukkan teks hak cipta, misal: © 2025 TaniCo. All rights reserved."
                  />
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-4 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-[#F5F3E7] font-jost text-[10px] tracking-widest transition-colors duration-200 rounded-lg font-bold shadow-md cursor-pointer"
            >
              Simpan & Terapkan Perubahan Halaman Utama
            </button>
          </div>
        </form>

      <DeleteConfirmModal
        isOpen={Boolean(confirmModalConfig)}
        title={confirmModalConfig?.title || 'Konfirmasi'}
        itemName={confirmModalConfig?.itemName || ''}
        itemType={confirmModalConfig?.itemType || 'data'}
        message={confirmModalConfig?.message}
        onConfirm={() => {
          if (confirmModalConfig?.onConfirm) {
            confirmModalConfig.onConfirm();
          }
          setConfirmModalConfig(null);
        }}
        onClose={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}