export default function TransactionsLoading() {
  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left animate-pulse">
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-7 w-52 bg-gray-200 rounded-lg" />
          <div className="h-4 w-72 bg-gray-100 rounded-md" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-28 bg-gray-200 rounded-xl shrink-0" />
          ))}
        </div>

        {/* Order Cards List */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#DDE9DF] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-xl shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-9 w-28 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
