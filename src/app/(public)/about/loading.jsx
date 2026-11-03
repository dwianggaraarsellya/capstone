export default function AboutLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="h-4 w-28 bg-gray-200 rounded-full mx-auto" />
        <div className="h-8 w-3/4 bg-gray-200 rounded-lg mx-auto" />
        <div className="h-4 w-5/6 bg-gray-100 rounded mx-auto" />
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <div className="h-6 w-2/3 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-gray-100 rounded" />
            <div className="h-3.5 w-5/6 bg-gray-100 rounded" />
            <div className="h-3.5 w-4/5 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="aspect-[4/3] rounded-2xl bg-gray-200" />
      </div>

      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-gray-100 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-3.5 w-full bg-gray-100 rounded" />
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-3.5 w-full bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
