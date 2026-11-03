"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { buildStorageUrl } from '@/utils/buildStorageUrl';
import { 
  Menu, 
  Bell, 
  ChevronDown, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useLayout } from '@/context/LayoutContext';
import Toasts from '@/components/ui/Toasts';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { clearStockClientCache } from '@/components/admin/stock/StockManager';

const AdminContext = createContext(null);

export function getAdminAuthHeaders() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('tanico_admin_user');
    const u = raw ? JSON.parse(raw) : null;
    const token = u?.sessionToken || u?.token || u?.user?.sessionToken;
    return token
      ? {
          Authorization: `Bearer ${token}`,
          'x-admin-token': token
        }
      : {};
  } catch (e) {
    return {};
  }
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminShell / AdminProvider');
  }
  return context;
}

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isCheckingAuth, setIsCheckingAuth] = useState(pathname !== '/admin/login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSessionExpired = React.useCallback(() => {
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
      return;
    }
    setIsAuthenticated(false);
    setIsCheckingAuth(false);
    setProducts([]);
    setCategories([]);
    setOrders([]);
    setReviews([]);
    setContacts([]);
    setBanners([]);
    setAdminProfile(null);
    try {
      clearStockClientCache();
    } catch (_) {}
    cacheTimestamps.current = {
      products: 0,
      categories: 0,
      orders: 0,
      reviews: 0,
      contacts: 0,
      settings: 0,
    };
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tanico_admin_user');
      document.cookie = 'tanico_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    router.replace('/admin/login');
  }, [pathname, router]);

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (e) {}

    handleSessionExpired();
  };

  // Responsive sidebar toggler
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // DATABASE STATES
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState({ id: 'default', siteName: 'TaniCo Admin' });
  const [adminProfile, setAdminProfile] = useState({
    name: 'Administrator',
    role: 'ADMIN',
    email: 'admin@tanico.id',
    avatar: '/avatars/admin.jpg'
  });
  const [logs, setLogs] = useState([]);

  // LOADING STATES FOR SKELETON LOADERS
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // TOAST MESSAGING STATE
  const [toasts, setToasts] = useState([]);
  const settingsLoadedRef = React.useRef(false);
  const cacheTimestamps = React.useRef({
    products: 0,
    categories: 0,
    orders: 0,
    reviews: 0,
    contacts: 0,
    settings: 0,
  });
  const CACHE_TTL = 45000; // 45 seconds cache TTL for seamless navigation

  const getAuthHeaders = React.useCallback(() => getAdminAuthHeaders(), []);

  const refreshProducts = React.useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - cacheTimestamps.current.products < CACHE_TTL) {
      setIsLoadingProducts(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/products', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
          cacheTimestamps.current.products = Date.now();
        }
      }
    } catch (e) {
    } finally {
      setIsLoadingProducts(false);
    }
  }, [getAuthHeaders, handleSessionExpired]);

  const refreshCategories = React.useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - cacheTimestamps.current.categories < CACHE_TTL) {
      setIsLoadingCategories(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/categories', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
          cacheTimestamps.current.categories = Date.now();
        }
      }
    } catch (e) {
    } finally {
      setIsLoadingCategories(false);
    }
  }, [getAuthHeaders, handleSessionExpired]);

  const refreshOrders = React.useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - cacheTimestamps.current.orders < CACHE_TTL) {
      setIsLoadingOrders(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/orders', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
          cacheTimestamps.current.orders = Date.now();
        }
      }
    } catch (e) {
    } finally {
      setIsLoadingOrders(false);
    }
  }, [getAuthHeaders, handleSessionExpired]);

  const refreshReviews = React.useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - cacheTimestamps.current.reviews < CACHE_TTL) {
      setIsLoadingReviews(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/reviews', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
          cacheTimestamps.current.reviews = Date.now();
        }
      }
    } catch (e) {
    } finally {
      setIsLoadingReviews(false);
    }
  }, [getAuthHeaders, handleSessionExpired]);

  const refreshContacts = React.useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - cacheTimestamps.current.contacts < CACHE_TTL) {
      setIsLoadingContacts(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/contacts', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setContacts(data);
          cacheTimestamps.current.contacts = Date.now();
        }
      }
    } catch (e) {
    } finally {
      setIsLoadingContacts(false);
    }
  }, [getAuthHeaders, handleSessionExpired]);

  const refreshSettings = React.useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - cacheTimestamps.current.settings < CACHE_TTL) {
      setIsLoadingSettings(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/settings', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        handleSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setSettings(data);
          cacheTimestamps.current.settings = Date.now();
        }
      }
    } catch (e) {
    } finally {
      setIsLoadingSettings(false);
    }
  }, [getAuthHeaders, handleSessionExpired]);

  // Route-targeted data fetcher with cache check
  const fetchAdminData = React.useCallback(async () => {
    const p = pathname || '';
    const promises = [];

    // Always fetch settings once if not loaded
    if (!settingsLoadedRef.current) {
      promises.push(refreshSettings().then(() => { settingsLoadedRef.current = true; }));
    }

    if (p.includes('/produk') || p.includes('/products')) {
      promises.push(refreshProducts(), refreshCategories());
    } else if (p.includes('/kategori') || p.includes('/categories')) {
      promises.push(refreshCategories());
    } else if (p.includes('/pesanan') || p.includes('/orders')) {
      promises.push(refreshOrders());
    } else if (p.includes('/ulasan') || p.includes('/reviews')) {
      promises.push(refreshReviews());
    } else if (p.includes('/kontak') || p.includes('/contacts')) {
      promises.push(refreshContacts());
    } else if (p.includes('/stok') || p.includes('/stock')) {
      promises.push(refreshProducts());
    } else if (p.includes('/analitik') || p.includes('/analytics')) {
      promises.push(refreshOrders(), refreshProducts(), refreshCategories());
    } else if (p.includes('/pengaturan') || p.includes('/settings') || p.includes('/homepage')) {
      promises.push(refreshSettings());
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }, [pathname, refreshCategories, refreshContacts, refreshOrders, refreshProducts, refreshReviews, refreshSettings]);

  useEffect(() => {
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login') || !isAuthenticated) {
      return;
    }
    let isMounted = true;
    async function loadAdminData() {
      try {
        const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tanico_admin_user') || 'null') : null;

        if (u) {
          setAdminProfile({
            name: u?.name || 'Administrator',
            role: (typeof u?.role === 'string' ? u?.role : (u?.role?.name || 'Admin')).toUpperCase(),
            email: u?.email || '',
            avatar: u?.image || u?.avatar || ''
          });
        }

        if (isMounted) {
          await fetchAdminData();
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
      }
    }
    loadAdminData();
    return () => { isMounted = false; };
  }, [isAuthenticated, pathname, fetchAdminData]);

  // Periodic session validity check (every 60s and on tab visibility change)
  useEffect(() => {
    if (!isAuthenticated || pathname === '/admin/login') return;

    let isChecking = false;
    const checkSession = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await fetch('/api/admin/auth/me', { headers: getAuthHeaders() });
        if (res.status === 401 || res.status === 403) {
          handleSessionExpired();
        }
      } catch (_) {
        // Network offline, do not aggressively logout
      } finally {
        isChecking = false;
      }
    };

    const intervalId = setInterval(checkSession, 60000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, pathname, getAuthHeaders, handleSessionExpired]);

  const addToast = (message, type = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const handleAddActivityLog = (action) => {
    setLogs(prev => [{ id: Date.now(), action, time: 'Baru saja' }, ...prev]);
  };

  // CRUD PRODUCTS (Optimistic UI < 20ms + Automatic Rollback on Failure)
  const handleAddProduct = async (newProduct) => {
    const tempId = `PROD-OPT-${Date.now()}`;
    const optimisticItem = {
      ...newProduct,
      id: tempId,
      price: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      categoryName: newProduct.categoryName || newProduct.category || 'Hasil Panen',
      category: newProduct.categoryName || newProduct.category || 'Hasil Panen',
      createdAt: new Date().toISOString()
    };

    let snapshot = [];
    setProducts(prev => {
      snapshot = prev;
      return [optimisticItem, ...prev];
    });
    cacheTimestamps.current.products = Date.now();

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        const saved = await res.json();
        const normalizedSaved = {
          ...saved,
          categoryName: saved.categoryName || saved.category?.name || optimisticItem.categoryName,
          category: saved.categoryName || saved.category?.name || optimisticItem.category
        };
        setProducts(prev => prev.map(p => p.id === tempId ? normalizedSaved : p));
        cacheTimestamps.current.products = Date.now();
        clearStockClientCache();
        addToast(`Produk "${newProduct.name}" berhasil diterbitkan!`, 'success');
        handleAddActivityLog(`Menerbitkan produk baru "${newProduct.name}"`);
        return { success: true, data: normalizedSaved };
      } else {
        setProducts(snapshot);
        const errData = await res.json().catch(() => ({}));
        addToast(`Gagal menambahkan produk: ${errData.error || 'Terjadi kesalahan pada server'}`, 'error');
        return { success: false, error: errData.error };
      }
    } catch (err) {
      setProducts(snapshot);
      console.error('Error adding product:', err);
      addToast(`Gagal menambahkan produk: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  const handleEditProduct = async (edited) => {
    let snapshot = [];
    setProducts(prev => {
      snapshot = prev;
      return prev.map(p => p.id === edited.id ? {
        ...p,
        ...edited,
        categoryName: edited.categoryName || p.categoryName,
        category: edited.categoryName || edited.category || p.category
      } : p);
    });
    cacheTimestamps.current.products = Date.now();

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(edited.id)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(edited)
      });
      if (res.ok) {
        const saved = await res.json().catch(() => null);
        if (saved) {
          const normalizedSaved = {
            ...saved,
            categoryName: saved.categoryName || saved.category?.name || edited.categoryName,
            category: saved.categoryName || saved.category?.name || edited.categoryName
          };
          setProducts(prev => prev.map(p => p.id === edited.id ? normalizedSaved : p));
        }
        cacheTimestamps.current.products = Date.now();
        clearStockClientCache();
        addToast(`Perubahan produk "${edited.name}" berhasil disimpan!`, 'success');
        handleAddActivityLog(`Memperbarui rincian produk "${edited.name}"`);
        return { success: true, data: saved || edited };
      } else {
        setProducts(snapshot);
        const errData = await res.json().catch(() => ({}));
        addToast(`Gagal memperbarui produk: ${errData.error || 'Terjadi kesalahan pada server'}`, 'error');
        return { success: false, error: errData.error };
      }
    } catch (err) {
      setProducts(snapshot);
      console.error('Error updating product:', err);
      addToast(`Gagal memperbarui produk: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  const handleDeleteProduct = async (id, name) => {
    let snapshot = [];
    setProducts(prev => {
      snapshot = prev;
      return prev.filter(p => p.id !== id);
    });
    cacheTimestamps.current.products = Date.now();

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        }
      });
      if (res.ok) {
        cacheTimestamps.current.products = Date.now();
        clearStockClientCache();
        addToast(`Produk "${name}" berhasil dihapus.`, 'success');
        handleAddActivityLog(`Menghapus produk "${name}"`);
        return { success: true };
      } else {
        setProducts(snapshot);
        const errData = await res.json().catch(() => ({}));
        addToast(`Gagal menghapus produk: ${errData.error || 'Terjadi kesalahan pada server'}`, 'error');
        return { success: false, error: errData.error };
      }
    } catch (err) {
      setProducts(snapshot);
      console.error('Error deleting product:', err);
      addToast(`Gagal menghapus produk: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  // CRUD CATEGORIES
  const handleSaveCategories = async (updatedCategories, syncBackend = false) => {
    setCategories(updatedCategories);
    cacheTimestamps.current.categories = Date.now();
    if (!syncBackend) return;
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedCategories)
      });
    } catch (err) {
      console.error('Error saving categories:', err);
    }
  };

  // CRUD ORDERS (Optimistic Status Transitions & Atomic Deletion)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    let snapshot = [];
    setOrders(prev => {
      snapshot = prev;
      return prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    });
    cacheTimestamps.current.orders = Date.now();

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json().catch(() => null);
        if (updated && updated.id) {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
        }
        cacheTimestamps.current.orders = Date.now();
        addToast(`Status Pesanan ${orderId} diubah ke ${newStatus.toUpperCase()}`, 'success');
        handleAddActivityLog(`Mengubah status pesanan ${orderId} menjadi ${newStatus}`);
        if (newStatus === 'Dibatalkan') {
          clearStockClientCache();
          refreshProducts(true);
        }
        return { success: true };
      } else {
        setOrders(snapshot);
        const err = await res.json().catch(() => ({}));
        addToast(err.error || 'Gagal memperbarui status pesanan', 'error');
        return { success: false, error: err.error };
      }
    } catch (err) {
      setOrders(snapshot);
      console.error('Error updating order status:', err);
      addToast(err.message || 'Koneksi gagal saat memperbarui pesanan', 'error');
      return { success: false, error: err.message };
    }
  };

  const handleDeleteOrder = async (orderId) => {
    let snapshot = [];
    setOrders(prev => {
      snapshot = prev;
      return prev.filter(o => o.id !== orderId);
    });
    cacheTimestamps.current.orders = Date.now();

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        }
      });
      if (res.ok) {
        cacheTimestamps.current.orders = Date.now();
        clearStockClientCache();
        refreshProducts(true);
        addToast(`Pesanan ${orderId} berhasil dihapus dari sistem.`, 'success');
        handleAddActivityLog(`Menghapus pesanan ${orderId}`);
        return { success: true };
      } else {
        setOrders(snapshot);
        const err = await res.json().catch(() => ({}));
        addToast(err.error || 'Gagal menghapus pesanan', 'error');
        return { success: false, error: err.error };
      }
    } catch (err) {
      setOrders(snapshot);
      console.error('Error deleting order:', err);
      addToast(err.message || 'Koneksi gagal saat menghapus pesanan', 'error');
      return { success: false, error: err.message };
    }
  };

  // REVIEWS & CONTACTS (Optimistic Single-Item & Batch Handlers with Rollback)
  const handleUpdateReview = async (reviewId, patch) => {
    let snapshot = [];
    setReviews(prev => {
      snapshot = prev;
      return prev.map(r => r.id === reviewId ? { ...r, ...patch } : r);
    });
    cacheTimestamps.current.reviews = Date.now();

    try {
      const res = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(patch)
      });
      if (!res.ok) {
        setReviews(snapshot);
        const err = await res.json().catch(() => ({}));
        addToast(err.error || 'Gagal memperbarui ulasan di database', 'error');
        return { success: false };
      }
      const saved = await res.json().catch(() => null);
      if (saved && saved.id) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...saved } : r));
      }
      return { success: true };
    } catch (err) {
      setReviews(snapshot);
      addToast(err.message || 'Gagal memperbarui ulasan', 'error');
      return { success: false };
    }
  };

  const handleDeleteReview = async (reviewId) => {
    let snapshot = [];
    setReviews(prev => {
      snapshot = prev;
      return prev.filter(r => r.id !== reviewId);
    });
    cacheTimestamps.current.reviews = Date.now();

    try {
      const res = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        }
      });
      if (!res.ok) {
        setReviews(snapshot);
        const err = await res.json().catch(() => ({}));
        addToast(err.error || 'Gagal menghapus ulasan dari database', 'error');
        return { success: false };
      }
      return { success: true };
    } catch (err) {
      setReviews(snapshot);
      addToast(err.message || 'Gagal menghapus ulasan', 'error');
      return { success: false };
    }
  };

  const handleSaveReviews = async (updatedReviews) => {
    let snapshot = [];
    setReviews(prev => {
      snapshot = prev;
      return updatedReviews;
    });
    cacheTimestamps.current.reviews = Date.now();
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedReviews)
      });
      if (!res.ok) {
        setReviews(snapshot);
        addToast('Gagal menyimpan perubahan ulasan', 'error');
      }
    } catch (err) {
      setReviews(snapshot);
      console.error('Error saving reviews:', err);
    }
  };

  const handleUpdateContact = async (contactId, patch) => {
    let snapshot = [];
    setContacts(prev => {
      snapshot = prev;
      return prev.map(c => c.id === contactId ? { ...c, ...patch } : c);
    });
    cacheTimestamps.current.contacts = Date.now();

    try {
      const res = await fetch(`/api/admin/contacts/${encodeURIComponent(contactId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(patch)
      });
      if (!res.ok) {
        setContacts(snapshot);
        const err = await res.json().catch(() => ({}));
        addToast(err.error || 'Gagal memperbarui status pesan kontak', 'error');
        return { success: false };
      }
      const saved = await res.json().catch(() => null);
      if (saved && saved.id) {
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, ...saved } : c));
      }
      return { success: true };
    } catch (err) {
      setContacts(snapshot);
      addToast(err.message || 'Gagal memperbarui pesan kontak', 'error');
      return { success: false };
    }
  };

  const handleDeleteContact = async (contactId) => {
    let snapshot = [];
    setContacts(prev => {
      snapshot = prev;
      return prev.filter(c => c.id !== contactId);
    });
    cacheTimestamps.current.contacts = Date.now();

    try {
      const res = await fetch(`/api/admin/contacts/${encodeURIComponent(contactId)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...getAuthHeaders()
        }
      });
      if (!res.ok) {
        setContacts(snapshot);
        const err = await res.json().catch(() => ({}));
        addToast(err.error || 'Gagal menghapus pesan kontak dari database', 'error');
        return { success: false };
      }
      return { success: true };
    } catch (err) {
      setContacts(snapshot);
      addToast(err.message || 'Gagal menghapus pesan kontak', 'error');
      return { success: false };
    }
  };

  const handleSaveContacts = async (updatedContacts) => {
    let snapshot = [];
    setContacts(prev => {
      snapshot = prev;
      return updatedContacts;
    });
    cacheTimestamps.current.contacts = Date.now();
    try {
      const res = await fetch('/api/admin/contacts', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedContacts)
      });
      if (!res.ok) {
        setContacts(snapshot);
        addToast('Gagal menyimpan perubahan pesan kontak', 'error');
      }
    } catch (err) {
      setContacts(snapshot);
      console.error('Error saving contacts:', err);
    }
  };

  // CUSTOMIZATION & SETTINGS
  const handleSaveBanners = (updatedBanners) => {
    setBanners(updatedBanners);
  };

  const handleSaveSettings = async (updatedSetting) => {
    let snapshot = settings;
    setSettings(prev => {
      snapshot = prev;
      return { ...prev, ...updatedSetting };
    });
    cacheTimestamps.current.settings = Date.now();

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedSetting)
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved || updatedSetting);
        cacheTimestamps.current.settings = Date.now();
        return { success: true, data: saved };
      } else {
        setSettings(snapshot);
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save settings:', err);
        return { success: false, error: err.error || 'Gagal menyimpan pengaturan' };
      }
    } catch (err) {
      setSettings(snapshot);
      console.error('Error saving settings:', err);
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  };

  const handleSaveAdminProfile = (updatedProfile) => {
    setAdminProfile(prev => ({ ...prev, ...updatedProfile }));
  };

  // QUICK ACTIONS TRIGGERED FROM OVERVIEW
  const handleQuickAction = (action) => {
    if (action === 'add-product') {
      router.push('/admin/products');
      setTimeout(() => {
        const addBtn = document.querySelector('[aria-label="Tambah Produk"]');
        if (addBtn) addBtn.click();
      }, 100);
    } else if (action === 'restock') {
      router.push('/admin/stock');
    } else if (action.startsWith('restock-')) {
      const prodId = action.replace('restock-', '');
      router.push('/admin/stock');
      setTimeout(() => {
        const selectEl = document.querySelector('select');
        if (selectEl) {
          selectEl.value = prodId;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 100);
    }
  };

  const handleBackToStorefront = () => {
    router.push('/');
  };

  const getActiveUser = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tanico_admin_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const u = parsed.user || parsed;
          if (u) {
            const roleStr = (typeof u.role === 'string' ? u.role : (u.role?.name || '')).toUpperCase();
            if (roleStr === 'ADMIN' || roleStr === 'SUPER_ADMIN' || roleStr === 'SUPERADMIN' || u.isAdmin) {
              return u;
            }
          }
        }
      } catch (e) {}
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
      setIsCheckingAuth(false);
      return;
    }

    if (isAuthenticated) {
      setIsCheckingAuth(false);
      return;
    }

    async function verifyAdminAuth() {
      // 1. Check local session
      const u = getActiveUser();
      if (u) {
        const roleStr = (typeof u.role === 'string' ? u.role : (u.role?.name || '')).toUpperCase();
        if (roleStr === 'ADMIN' || roleStr === 'SUPER_ADMIN' || roleStr === 'SUPERADMIN' || u.isAdmin) {
          if (isMounted) {
            setAdminProfile({
              name: u?.name || 'Administrator',
              role: roleStr || 'ADMIN',
              email: u?.email || '',
              avatar: u?.image || u?.avatar || ''
            });
            setIsAuthenticated(true);
            setIsCheckingAuth(false);
          }
          return;
        }
      }

      // 2. Asynchronous fallback check via /api/admin/auth/me (handles cookies)
      try {
        const res = await fetch('/api/admin/auth/me', {
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const userObj = data.user || data;
          if (userObj) {
            const roleStr = (typeof userObj.role === 'string' ? userObj.role : (userObj.role?.name || '')).toUpperCase();
            if (roleStr === 'ADMIN' || roleStr === 'SUPER_ADMIN' || roleStr === 'SUPERADMIN') {
              if (typeof window !== 'undefined') {
                localStorage.setItem('tanico_admin_user', JSON.stringify({ ...userObj, role: roleStr, sessionToken: data.sessionToken || userObj.sessionToken }));
              }
              if (isMounted) {
                setAdminProfile({
                  name: userObj.name || 'Administrator',
                  role: roleStr,
                  email: userObj.email || '',
                  avatar: userObj.avatar || userObj.image || ''
                });
                setIsAuthenticated(true);
                setIsCheckingAuth(false);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Session verification via /api/admin/auth/me error:', err);
      }

      // 3. Truly unauthenticated, safely redirect to login
      if (isMounted) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        if (pathname !== '/admin/login' && !pathname.startsWith('/admin/login')) {
          router.replace('/admin/login');
        }
      }
    }

    verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, pathname, router, getActiveUser, getAuthHeaders]);

  // If current route is /admin/login, render children directly without admin layout wrapper
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If checking authentication, show clean minimal loader
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F6F8F6] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#174C3C] mx-auto" />
          <p className="mt-3 text-xs text-gray-500 font-medium">Memverifikasi sesi admin...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, prevent layout rendering while redirect completes with clean feedback
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F8F6] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#174C3C] mx-auto" />
          <p className="mt-3 text-xs text-gray-500 font-medium">Mengarahkan ke login admin...</p>
        </div>
      </div>
    );
  }

  const categoryNamesList = categories.map(c => c.name);

  const contextValue = {
    products,
    setProducts,
    isLoadingProducts,
    categories,
    categoryNamesList,
    isLoadingCategories,
    orders,
    isLoadingOrders,
    reviews,
    isLoadingReviews,
    contacts,
    isLoadingContacts,
    banners,
    settings,
    isLoadingSettings,
    adminProfile,
    logs,
    toasts,
    addToast,
    removeToast: (id) => setToasts(prev => prev.filter(t => t.id !== id)),
    getAuthHeaders,
    refreshAdminData: fetchAdminData,
    refreshProducts,
    refreshCategories,
    refreshOrders,
    refreshReviews,
    refreshContacts,
    refreshSettings,
    handleAddActivityLog,
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleSaveCategories,
    handleUpdateOrderStatus,
    handleDeleteOrder,
    handleUpdateReview,
    handleDeleteReview,
    handleSaveReviews,
    handleUpdateContact,
    handleDeleteContact,
    handleSaveContacts,
    handleSaveBanners,
    handleSaveSettings,
    handleSaveAdminProfile,
    handleQuickAction,
    onBackToStorefront: handleBackToStorefront
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="min-h-screen max-w-full overflow-x-hidden bg-[#FCFCFC] text-[#202020] flex relative selection:bg-[#DCEFE0] selection:text-[#174C3C] font-sans">
        
        {/* 1. LEFT SIDEBAR COMPONENT */}
        <AdminSidebar 
          onLogout={handleAdminLogout}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        {/* 2. RIGHT WORKSPACE AREA */}
        <div className="flex-1 min-w-0 max-w-full lg:pl-64 flex flex-col min-h-screen overflow-x-hidden">
          
          {/* Top bar header */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#DDE9DF] py-3 sm:py-3.5 px-3.5 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between gap-2 min-w-0">
            
            {/* Mobile Hamburg trigger */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-[#174C3C] shrink-0"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Back to website button */}
              <button
                onClick={handleBackToStorefront}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-sans  tracking-wider text-gray-500 hover:text-[#174C3C] transition-colors cursor-pointer group font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Kembali Ke Toko</span>
              </button>
            </div>

            {/* Quick status & Admin metadata row */}
            <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
              {/* Notification simulated badge */}
              <button 
                onClick={() => addToast('Pusat Notifikasi: Sistem berjalan normal.', 'info')}
                className="p-2 text-gray-400 hover:text-[#174C3C] transition-colors relative cursor-pointer" 
                aria-label="Notifikasi"
              >
                <Bell className="w-4 h-4" strokeWidth={1.5} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#6E9C7C] rounded-full"></span>
              </button>

              {/* User credentials */}
              <div 
                onClick={() => router.push('/admin/profile')}
                className="flex items-center gap-2 sm:gap-2.5 pl-2.5 sm:pl-4 border-l border-gray-200/60 cursor-pointer group"
              >
                {adminProfile?.avatar ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-100 group-hover:border-[#174C3C] transition-all shrink-0">
                    <Image 
                      src={buildStorageUrl(adminProfile.avatar)} 
                      alt="Profil Admin" 
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#174C3C] text-white font-bold text-xs flex items-center justify-center border border-gray-100 group-hover:border-[#174C3C] transition-all shrink-0">
                    {adminProfile?.name ? adminProfile.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <span className="font-sans text-xs font-bold text-[#174C3C] block leading-none">{adminProfile.name}</span>
                  <span className="font-sans text-[8px] text-gray-400  tracking-widest font-semibold mt-0.5 block">{adminProfile.role}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors hidden md:block" />
              </div>
            </div>

          </header>

          {/* Dynamic sub-screen viewport */}
          <main className="flex-1 min-w-0 max-w-full p-3.5 sm:p-6 md:p-8 lg:p-10 overflow-x-hidden overflow-y-auto">
            <div key={pathname} className="min-w-0 max-w-full animate-in fade-in duration-75">
              {children}
            </div>
          </main>

        </div>

        {/* 3. ABSOLUTE TOAST NOTIFICATIONS ALERTS CONTAINER */}
        <Toasts toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      </div>
    </AdminContext.Provider>
  );
}
