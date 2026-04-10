"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function EntryFilters({ branches }: { branches: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentBranch = searchParams.get("branch") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push("?");
  }, [router]);

  const hasFilters = currentBranch || currentFrom || currentTo;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        value={currentBranch}
        onChange={(e) => updateFilter("branch", e.target.value)}
        className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-gray-500"
      >
        <option value="">All branches</option>
        {branches.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={currentFrom}
        onChange={(e) => updateFilter("from", e.target.value)}
        placeholder="From"
        className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-gray-500"
      />
      <input
        type="date"
        value={currentTo}
        onChange={(e) => updateFilter("to", e.target.value)}
        placeholder="To"
        className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-gray-500"
      />
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-gray-500 hover:text-gray-300 transition"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
