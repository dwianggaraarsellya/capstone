export default function AdminProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-gray-100 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 bg-gray-200 rounded-full" />
          <div className="h-10 w-32 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-[#DDE9DF] p-4 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
        <div className="h-10 w-full md:w-72 bg-gray-100 rounded-full" />
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-100 rounded-full" />
          <div className="h-10 w-32 bg-gray-100 rounded-full" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-2xs">
        <div className="h-12 bg-gray-50 border-b border-gray-100 px-6 flex items-center justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
