"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:border-gray-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-300 hover:border-gray-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
