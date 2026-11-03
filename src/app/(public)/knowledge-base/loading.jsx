import React from 'react';

export default function KnowledgeBaseLoading() {
  return (
    <div className="w-full bg-[#FCFCFC] min-h-screen pb-16 antialiased font-jost text-left">
      {/* Header Banner Skeleton */}
      <div className="w-full bg-[#174C3C]/5 py-12 px-6 md:px-8 border-b border-[#DDE9DF]/60">
        <div className="max-w-5xl mx-auto space-y-3 animate-pulse">
          <div className="h-8 sm:h-10 w-80 sm:w-[420px] bg-gray-200/80 rounded-xl" />
          <div className="h-4 w-64 sm:w-96 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Steps and Content Skeleton */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pt-10">
        {/* Step Tabs Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-3 w-16 bg-gray-200 rounded-md" />
            </div>
          ))}
        </div>

        {/* Active Content Box Skeleton */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-2xs space-y-6 animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded-lg" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-100 rounded-md" />
            <div className="h-4 w-5/6 bg-gray-100 rounded-md" />
            <div className="h-4 w-3/4 bg-gray-100 rounded-md" />
          </div>
          <div className="h-64 w-full bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
