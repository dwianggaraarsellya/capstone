export default function AdminProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-gray-100 rounded" />
        </div>
      </div>

      <div className="bg-white border border-[#DDE9DF] p-6 sm:p-8 rounded-2xl max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-3.5 w-48 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="h-11 bg-gray-100 rounded-xl" />
          <div className="h-11 bg-gray-100 rounded-xl" />
          <div className="h-11 bg-gray-100 rounded-xl" />
          <div className="h-11 w-36 bg-gray-200 rounded-full pt-1" />
        </div>
      </div>
    </div>
  );
}
