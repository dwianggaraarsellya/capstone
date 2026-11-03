export default function CheckoutLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form Fields */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="space-y-4">
            <div className="h-10 w-full bg-gray-100 rounded-xl" />
            <div className="h-10 w-full bg-gray-100 rounded-xl" />
            <div className="h-20 w-full bg-gray-100 rounded-xl" />
            <div className="h-10 w-full bg-gray-100 rounded-xl" />
          </div>
          <div className="h-5 w-36 bg-gray-200 rounded pt-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl" />
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-14 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-12 w-full bg-gray-200 rounded-full mt-6" />
        </div>
      </div>
    </div>
  );
}
