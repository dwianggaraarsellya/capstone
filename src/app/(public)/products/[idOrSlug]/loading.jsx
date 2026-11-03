import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FCFCFC] text-slate-600 pb-16 antialiased font-jost">
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-8 animate-pulse">
          <div className="h-3 w-16 bg-gray-200/80 rounded-md" />
          <div className="h-3 w-3 bg-gray-200/50 rounded-md" />
          <div className="h-3 w-20 bg-gray-200/80 rounded-md" />
          <div className="h-3 w-3 bg-gray-200/50 rounded-md" />
          <div className="h-3 w-32 bg-gray-200/60 rounded-md" />
        </div>

        {/* Product Hero Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 animate-pulse">
          {/* Gallery Left Skeleton */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-square w-full bg-gray-200/80 rounded-2xl" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-16 h-16 rounded-xl bg-gray-200/70 shrink-0" />
              ))}
            </div>
          </div>

          {/* Product Meta Right Skeleton */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="h-3.5 w-28 bg-emerald-100/80 rounded-full" />
              <div className="h-8 w-3/4 bg-gray-200/80 rounded-lg" />
              <div className="h-4 w-32 bg-gray-100 rounded-md" />
            </div>

            <div className="h-10 w-44 bg-gray-200/80 rounded-xl" />

            <div className="space-y-2 border-t border-b border-gray-100 py-6">
              <div className="h-4 w-full bg-gray-100 rounded-md" />
              <div className="h-4 w-5/6 bg-gray-100 rounded-md" />
              <div className="h-4 w-2/3 bg-gray-100 rounded-md" />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-32 bg-gray-200/80 rounded-xl" />
              <div className="h-12 flex-1 bg-[#174C3C]/20 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
