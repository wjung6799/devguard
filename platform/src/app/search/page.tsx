"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface EntryResult {
  id: string;
  summary: string;
  branch: string;
  date: string;
  projectId: string;
  projectName: string;
}

interface PageResult {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
}

interface NoteResult {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
}

interface RuleResult {
  id: string;
  title: string;
}

interface SearchResults {
  entries: EntryResult[];
  pages: PageResult[];
  notes: NoteResult[];
  rules: RuleResult[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults(null);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => setResults(data))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const totalResults = results
    ? results.entries.length + results.pages.length + results.notes.length + results.rules.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-white transition"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-xl font-bold">Search</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search entries, wiki pages, notes, rules..."
            autoFocus
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Search
          </button>
        </form>

        {loading && (
          <p className="text-gray-500">Searching...</p>
        )}

        {results && !loading && (
          <>
            <p className="text-gray-500 text-sm mb-6">
              {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
            </p>

            {results.entries.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Diary Entries ({results.entries.length})
                </h2>
                <div className="space-y-2">
                  {results.entries.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/projects/${entry.projectId}`}
                      className="block p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{entry.projectName}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                          {entry.branch}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-sm">{entry.summary}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.pages.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Wiki Pages ({results.pages.length})
                </h2>
                <div className="space-y-2">
                  {results.pages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/projects/${page.projectId}/wiki/${page.id}`}
                      className="block p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition"
                    >
                      <span className="text-xs text-gray-500 mr-2">{page.projectName}</span>
                      <span className="text-sm">{page.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.notes.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Notes ({results.notes.length})
                </h2>
                <div className="space-y-2">
                  {results.notes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/projects/${note.projectId}/notes/${note.id}`}
                      className="block p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition"
                    >
                      <span className="text-xs text-gray-500 mr-2">{note.projectName}</span>
                      <span className="text-sm">{note.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.rules.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Rules ({results.rules.length})
                </h2>
                <div className="space-y-2">
                  {results.rules.map((rule) => (
                    <Link
                      key={rule.id}
                      href="/rules"
                      className="block p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition"
                    >
                      <span className="text-sm">{rule.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {totalResults === 0 && (
              <p className="text-gray-500">No results found.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
