export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#DDE9DF] p-5 rounded-2xl space-y-3">
            <div className="h-3.5 w-24 bg-gray-200 rounded" />
            <div className="h-7 w-32 bg-gray-200 rounded-lg" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl space-y-4">
          <div className="h-5 w-44 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
        <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl space-y-4">
          <div className="h-5 w-44 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
