import React from 'react';

export default function ProductsLoading() {
  return (
    <div className="w-full bg-[#FCFCFC] min-h-screen pb-16 antialiased font-jost text-left">
      {/* Header Banner Skeleton */}
      <div className="w-full bg-[#174C3C]/5 py-12 px-6 md:px-8 border-b border-[#DDE9DF]/60">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="h-3 w-28 bg-gray-200/80 rounded-full animate-pulse" />
          <div className="h-8 sm:h-10 w-72 sm:w-96 bg-gray-200/80 rounded-xl animate-pulse" />
          <div className="h-4 w-60 sm:w-80 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 animate-pulse">
          <div className="h-10 flex-1 max-w-md bg-gray-100 rounded-xl" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-36 bg-gray-100 rounded-xl" />
            <div className="h-10 w-28 bg-gray-100 rounded-xl" />
          </div>
        </div>

        {/* Categories Chip Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto py-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 w-24 bg-gray-200/70 rounded-full shrink-0" />
          ))}
        </div>

        {/* Product Cards Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-pulse">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={`skel-prod-${idx}`} className="flex flex-col justify-between bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="aspect-square w-full rounded-xl mb-3 bg-gray-200/80" />
              <div className="flex flex-col space-y-2 flex-1">
                <div className="h-3.5 bg-gray-200/80 rounded-md w-3/4" />
                <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                <div className="pt-2 flex items-center justify-between">
                  <div className="h-4 bg-gray-200/80 rounded-md w-2/5" />
                  <div className="h-7 w-7 bg-gray-200/70 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
