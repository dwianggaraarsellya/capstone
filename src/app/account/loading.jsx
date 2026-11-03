export default function AccountLoading() {
  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left animate-pulse">
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 space-y-8">
        {/* Header Profile Card Skeleton */}
        <div className="bg-white border border-[#DDE9DF] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-3 w-full max-w-md">
            <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            <div className="h-4 w-64 bg-gray-100 rounded-md" />
            <div className="h-3 w-32 bg-gray-100 rounded-md" />
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-[#DDE9DF] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="h-6 w-44 bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-11 bg-gray-100 rounded-xl" />
                <div className="h-11 bg-gray-100 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-11 bg-gray-100 rounded-xl" />
                <div className="h-11 bg-gray-100 rounded-xl" />
              </div>
              <div className="h-11 bg-gray-100 rounded-xl" />
              <div className="h-12 w-44 bg-gray-200 rounded-xl pt-2" />
            </div>
          </div>

          <div className="bg-white border border-[#DDE9DF] rounded-2xl p-6 sm:p-8 space-y-4 h-fit">
            <div className="h-6 w-36 bg-gray-200 rounded-lg" />
            <div className="space-y-3">
              <div className="h-12 bg-gray-50 rounded-xl" />
              <div className="h-12 bg-gray-50 rounded-xl" />
              <div className="h-12 bg-gray-50 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
