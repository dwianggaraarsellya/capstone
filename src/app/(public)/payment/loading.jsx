export default function PaymentLoading() {
  return (
    <div className="min-h-[75vh] bg-[#FCFCFC] py-12 px-4 sm:px-6 lg:px-8 font-jost animate-pulse">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Top Indicator */}
        <div className="text-center space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded-lg mx-auto" />
          <div className="h-4 w-64 bg-gray-100 rounded mx-auto" />
        </div>

        {/* Payment Card Skeleton */}
        <div className="bg-white border border-[#DDE9DF] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Amount Box */}
          <div className="bg-emerald-950/5 p-4 rounded-2xl flex justify-between items-center">
            <div className="space-y-1">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-6 w-36 bg-gray-200 rounded" />
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded-xl" />
          </div>

          {/* Payment Methods Skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 border border-gray-100 rounded-2xl bg-gray-50 flex items-center px-4 gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <div className="h-12 w-full bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
