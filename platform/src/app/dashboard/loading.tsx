export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="h-7 w-24 bg-gray-800 rounded animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-5 w-16 bg-gray-800 rounded animate-pulse" />
          <div className="h-5 w-32 bg-gray-800 rounded animate-pulse" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="h-8 w-32 bg-gray-800 rounded animate-pulse mb-8" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 bg-gray-900 border border-gray-800 rounded-lg"
            >
              <div className="h-6 w-48 bg-gray-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-800/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
