export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <div className="h-5 w-16 bg-gray-800 rounded animate-pulse" />
        <div className="h-7 w-40 bg-gray-800 rounded animate-pulse" />
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          {[1, 2].map((col) => (
            <div key={col}>
              <div className="h-6 w-28 bg-gray-800 rounded animate-pulse mb-4" />
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-900 border border-gray-800 rounded-lg mb-2"
                >
                  <div className="h-4 w-36 bg-gray-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-10">
          <div className="h-6 w-32 bg-gray-800 rounded animate-pulse mb-4" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-3"
            >
              <div className="h-3 w-48 bg-gray-800 rounded animate-pulse mb-2" />
              <div className="h-5 w-64 bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
