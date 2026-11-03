import React from 'react';

export default function FAQLoading() {
  return (
    <div className="w-full bg-[#FCFCFC] min-h-screen pb-16 antialiased font-jost text-left">
      {/* Header Banner Skeleton */}
      <div className="w-full bg-[#174C3C]/5 py-12 px-6 md:px-8 border-b border-[#DDE9DF]/60">
        <div className="max-w-4xl mx-auto space-y-3 animate-pulse">
          <div className="h-8 sm:h-10 w-72 sm:w-96 bg-gray-200/80 rounded-xl" />
          <div className="h-4 w-60 sm:w-80 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* FAQ Search and Accordions Skeleton */}
      <div className="max-w-4xl mx-auto px-6 md:px-8 pt-8 space-y-6">
        <div className="h-12 w-full bg-white border border-gray-100 rounded-xl animate-pulse" />
        
        <div className="space-y-4 pt-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-3/4 bg-gray-200/80 rounded-md" />
                <div className="w-5 h-5 bg-gray-200/60 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
