"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Image from 'next/image'; 
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useLayout } from '@/context/LayoutContext';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Non-blocking check: if already logged in as valid admin, redirect to dashboard
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('tanico_admin_user');
        if (raw) {
          const user = JSON.parse(raw);
          const roleUpper = (typeof user.role === 'string' ? user.role : (user.role?.name || '')).toUpperCase();
          if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPERADMIN' || user.isAdmin) {
            router.replace('/admin/dashboard');
          }
        }
      }
    } catch (e) {}
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const resText = await res.text();
      let data = {};
      try {
        data = JSON.parse(resText);
      } catch (_) {
        throw new Error(`Respon server tidak valid (${res.status}). Silakan coba beberapa saat lagi.`);
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Gagal masuk ke Konsol Admin.');
      }

      // Store exclusively in tanico_admin_user to prevent overwriting user's session
      localStorage.setItem('tanico_admin_user', JSON.stringify(data));
      if (data.sessionToken) {
        document.cookie = `tanico_admin_session=${encodeURIComponent(data.sessionToken)}; path=/; max-age=604800; SameSite=Lax`;
      }

      router.replace('/admin/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat otentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#174C3C] selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto w-full max-w-md text-center"
      >
     <div className="flex items-center justify-center">
<Image
                src="/images/logo-tanico.png"
                alt="TaniCo"
                width={140}
                height={44}
                priority
                referrerPolicy="no-referrer"
                className="h-9 sm:h-11 w-auto object-contain group-hover:opacity-90 transition-opacity"
              />
              </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-6 sm:mx-auto w-full max-w-md"
      >
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-[#DDE9DF] rounded-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-[#174C3C]">Masuk Administrator</h2>
            <p className="text-xs text-gray-500 mt-1">Akses area terbatas khusus pengelola sistem</p>
          </div>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-red-700 font-medium"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form suppressHydrationWarning onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-[#174C3C] mb-1.5">
                Email Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  suppressHydrationWarning
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@tanico.id"
                  className="w-full bg-[#FCFCFC] text-xs text-[#202020] pl-10 pr-3.5 py-3 border border-[#DDE9DF] rounded-xl focus:outline-none focus:border-[#174C3C] focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider text-[#174C3C] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  suppressHydrationWarning
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FCFCFC] text-xs text-[#202020] pl-10 pr-3.5 py-3 border border-[#DDE9DF] rounded-xl focus:outline-none focus:border-[#174C3C] focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <button
              suppressHydrationWarning
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-11 bg-[#174C3C] text-white hover:bg-[#1F5C49] active:bg-[#123A2E] transition-all duration-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span>Masuk Konsol Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <a
              href="/"
              className="inline-flex items-center text-xs text-[#4D8B55] hover:text-[#174C3C] font-medium transition-colors"
            >
              &larr; Kembali ke Toko TaniCo
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}