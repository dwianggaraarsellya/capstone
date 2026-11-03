export default function AdminReviewsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-gray-100 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#DDE9DF] p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div className="space-y-1">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 w-24 bg-gray-200 rounded-full" />
              <div className="h-8 w-16 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
