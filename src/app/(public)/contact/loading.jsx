export default function ContactLoading() {
  return (
    <div className="bg-[#FCFCFC] min-h-screen text-[#111111] font-jost pb-16 text-left animate-pulse">
      {/* Banner Skeleton */}
      <section className="bg-[#1B4D3E]/10 py-12 sm:py-16 lg:py-24 px-5 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center space-y-4">
          <div className="h-4 w-32 bg-gray-200 rounded-full" />
          <div className="h-8 sm:h-10 w-72 sm:w-96 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 sm:w-80 bg-gray-100 rounded-lg" />
        </div>
      </section>

      {/* Main Grid Content Skeleton */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mt-10 sm:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-gray-200 rounded-lg" />
              <div className="h-4 w-72 bg-gray-100 rounded-md" />
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 p-4 sm:p-5 bg-white border border-[#DDE9DF] rounded-2xl">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 bg-gray-200 rounded-xl shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3.5 w-48 bg-gray-100 rounded" />
                    <div className="h-3 w-36 bg-gray-100/70 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7 bg-white border border-[#DDE9DF] p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="h-6 w-44 bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-11 bg-gray-100 rounded-xl" />
                <div className="h-11 bg-gray-100 rounded-xl" />
              </div>
              <div className="h-11 bg-gray-100 rounded-xl" />
              <div className="h-32 bg-gray-100 rounded-xl" />
              <div className="h-12 w-40 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
