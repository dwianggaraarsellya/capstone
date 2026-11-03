export default function AdminStockLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-52 bg-gray-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Stock summary mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#DDE9DF] p-4 rounded-2xl space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DDE9DF] p-4 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
        <div className="h-10 w-full md:w-72 bg-gray-100 rounded-full" />
        <div className="h-10 w-32 bg-gray-100 rounded-full" />
      </div>

      <div className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-2xs">
        <div className="h-12 bg-gray-50 border-b border-gray-100 px-6 flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
              <div className="h-8 w-24 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
