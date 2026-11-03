"use client";

import React, { Suspense } from 'react';
import StockManager from '@/components/admin/stock/StockManager';

export default function AdminStockPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-72" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-28 bg-gray-200 rounded-xl" />
            <div className="h-9 w-32 bg-gray-200 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`stat-skel-${idx}`} className="bg-white border border-gray-100 p-5 rounded-2xl space-y-2">
              <div className="h-3 bg-gray-100 rounded w-24" />
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#DDE9DF] flex justify-between gap-4">
            <div className="h-9 bg-gray-100 rounded-xl w-64" />
            <div className="h-9 bg-gray-100 rounded-xl w-36" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={`row-skel-${idx}`} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-2.5 bg-gray-100 rounded w-20" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded-full w-20" />
                <div className="h-8 bg-gray-200 rounded-lg w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <StockManager />
    </Suspense>
  );
}
