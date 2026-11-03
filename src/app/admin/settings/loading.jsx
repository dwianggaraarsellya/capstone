export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-3.5 w-64 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-full" />
      </div>

      <div className="bg-white border border-[#DDE9DF] p-6 sm:p-8 rounded-2xl space-y-6">
        <div className="flex gap-3 border-b border-gray-100 pb-4">
          <div className="h-8 w-28 bg-gray-200 rounded-xl" />
          <div className="h-8 w-28 bg-gray-100 rounded-xl" />
          <div className="h-8 w-28 bg-gray-100 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-11 bg-gray-100 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-11 bg-gray-100 rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
