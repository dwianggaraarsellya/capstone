import React from 'react';

export default function CategoriesLoading() {
  return (
    <div className="w-full bg-[#FCFCFC] min-h-screen pb-16 antialiased font-jost text-left">
      {/* Header Banner Skeleton */}
      <div className="w-full bg-[#174C3C]/5 py-12 px-6 md:px-8 border-b border-[#DDE9DF]/60">
        <div className="max-w-7xl mx-auto space-y-3 animate-pulse">
          <div className="h-3 w-28 bg-gray-200/80 rounded-full" />
          <div className="h-8 sm:h-10 w-64 sm:w-80 bg-gray-200/80 rounded-xl" />
          <div className="h-4 w-72 sm:w-96 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Categories Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs">
              <div className="h-48 w-full bg-gray-200/80" />
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-32 bg-gray-200/80 rounded-md" />
                  <div className="h-4 w-12 bg-gray-100 rounded-full" />
                </div>
                <div className="h-3.5 w-full bg-gray-100 rounded-md" />
                <div className="h-3.5 w-4/5 bg-gray-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
