"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ResponsivePagination({
  currentPage,
  totalPages,
  onPageChange,
  showSummary = true,
  className = ""
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 639px)');
    const update = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  if (!totalPages || totalPages <= 1) return null;

  const getPageNumbers = () => {
    // Compact mobile windowing (320px - 639px): e.g. 1 2 ... 6 | 1 ... 4 ... 8 | 1 ... 5 6
    if (isMobile) {
      if (totalPages <= 4) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      if (currentPage <= 2) {
        return [1, 2, '...', totalPages];
      }
      if (currentPage >= totalPages - 1) {
        return [1, '...', totalPages - 1, totalPages];
      }
      return [1, '...', currentPage, '...', totalPages];
    }

    // Desktop & Tablet windowing (>= 640px)
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`w-full max-w-full min-w-0 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-xs select-none ${className}`}>
      {/* Summary Text: Format "Halaman 1 dari 6" (tanpa ) */}
      {showSummary && (
        <div className="text-xs sm:text-sm text-gray-600 font-medium text-center sm:text-left shrink-0">
          Halaman <span className="font-bold text-[#174C3C]">{currentPage}</span> dari <span className="font-bold text-[#174C3C]">{totalPages}</span>
        </div>
      )}

      {/* Navigation Controls: perfectly circular buttons with < and > arrow icons only */}
      <nav
        aria-label="Navigasi halaman"
        className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2 flex-nowrap"
      >
        {/* Tombol Sebelumnya (<) tanpa teks */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Halaman sebelumnya"
          title="Halaman sebelumnya"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border border-[#DDE9DF] bg-white text-gray-700 hover:text-[#174C3C] hover:bg-[#ECF6ED] disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150 cursor-pointer shrink-0 aspect-square shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2} />
        </button>

        {/* Nomor Halaman - Bulat Sempurna (aspect-square & rounded-full) */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 shrink-0">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`dots-${idx}`}
                  className="w-6 sm:w-7 h-8 sm:h-9 flex items-center justify-center text-gray-400 font-bold text-xs select-none shrink-0"
                >
                  ...
                </span>
              );
            }

            const isCurrent = currentPage === p;
            return (
              <button
                suppressHydrationWarning
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Ke Halaman ${p}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-150 cursor-pointer shrink-0 aspect-square ${
                  isCurrent
                    ? 'bg-[#174C3C] text-white shadow-xs font-black ring-1 ring-[#174C3C]'
                    : 'bg-white text-gray-600 border border-[#DDE9DF] hover:bg-[#ECF6ED] hover:text-[#174C3C] hover:border-[#6E9C7C]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Tombol Selanjutnya (>) tanpa teks */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Halaman selanjutnya"
          title="Halaman selanjutnya"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border border-[#DDE9DF] bg-white text-gray-700 hover:text-[#174C3C] hover:bg-[#ECF6ED] disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150 cursor-pointer shrink-0 aspect-square shadow-2xs"
        >
          <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2} />
        </button>
      </nav>
    </div>
  );
}

