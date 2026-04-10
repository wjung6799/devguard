import { requireAuth, isTrialActive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createWikiPageAction,
  createNoteAction,
  deleteProjectAction,
  deleteEntryAction,
} from "@/lib/actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Markdown from "@/app/components/Markdown";
import EntryFilters from "@/app/components/EntryFilters";
import Pagination from "@/app/components/Pagination";

const ENTRIES_PER_PAGE = 50;

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ branch?: string; from?: string; to?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const filters = await searchParams;

  if (!isTrialActive(session.user)) redirect("/dashboard");

  const project = await prisma.project.findUnique({
    where: { id, userId: session.userId },
    include: {
      pages: { orderBy: { updatedAt: "desc" } },
      notes: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!project) notFound();

  // Get distinct branches for filter dropdown
  const branchRows = await prisma.diaryEntry.findMany({
    where: { projectId: id },
    select: { branch: true },
    distinct: ["branch"],
    orderBy: { branch: "asc" },
  });
  const branches = branchRows.map((r) => r.branch);

  // Build entry query with filters
  const entryWhere: Record<string, unknown> = { projectId: id };
  if (filters.branch) entryWhere.branch = filters.branch;
  if (filters.from || filters.to) {
    entryWhere.date = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to + "T23:59:59") } : {}),
    };
  }

  // Get last synced time
  const lastEntry = await prisma.diaryEntry.findFirst({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const page = Math.max(1, parseInt(filters.page || "1", 10));
  const totalEntries = await prisma.diaryEntry.count({ where: entryWhere });
  const totalPages = Math.max(1, Math.ceil(totalEntries / ENTRIES_PER_PAGE));
  const entries = await prisma.diaryEntry.findMany({
    where: entryWhere,
    orderBy: { date: "desc" },
    skip: (page - 1) * ENTRIES_PER_PAGE,
    take: ENTRIES_PER_PAGE,
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
            &larr; Back
          </Link>
          <h1 className="text-xl font-bold">{project.name}</h1>
          {lastEntry && (
            <span className="text-xs text-gray-500">
              Last synced: {lastEntry.createdAt.toLocaleString()}
            </span>
          )}
        </div>
        <form action={deleteProjectAction}>
          <input type="hidden" name="id" value={project.id} />
          <button className="text-sm text-red-400 hover:text-red-300 transition">
            Delete Project
          </button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Wiki Pages */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Wiki Pages</h2>
            <form action={createWikiPageAction} className="flex gap-2 mb-4">
              <input type="hidden" name="projectId" value={project.id} />
              <input
                name="title"
                type="text"
                placeholder="New page title"
                required
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Add
              </button>
            </form>
            {project.pages.length === 0 ? (
              <p className="text-gray-500 text-sm">No wiki pages yet.</p>
            ) : (
              <ul className="space-y-2">
                {project.pages.map((page) => (
                  <li key={page.id}>
                    <Link
                      href={`/projects/${project.id}/wiki/${page.id}`}
                      className="block p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition"
                    >
                      <span className="text-sm font-medium">{page.title}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {page.updatedAt.toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notes */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <form action={createNoteAction} className="flex gap-2 mb-4">
              <input type="hidden" name="projectId" value={project.id} />
              <input
                name="title"
                type="text"
                placeholder="New note title"
                required
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Add
              </button>
            </form>
            {project.notes.length === 0 ? (
              <p className="text-gray-500 text-sm">No notes yet.</p>
            ) : (
              <ul className="space-y-2">
                {project.notes.map((note) => (
                  <li key={note.id}>
                    <Link
                      href={`/projects/${project.id}/notes/${note.id}`}
                      className="block p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition"
                    >
                      <span className="text-sm font-medium">{note.title}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {note.updatedAt.toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Diary Entries */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Diary Entries
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({totalEntries})
              </span>
            </h2>
          </div>

          <Suspense>
            <EntryFilters branches={branches} />
          </Suspense>

          {entries.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {totalEntries === 0
                ? "No diary entries yet. Entries will appear here when synced from the CLI."
                : "No entries match the current filters."}
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-500">
                          {entry.date.toLocaleDateString()}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400">
                          {entry.branch}
                        </span>
                        {entry.commit && (
                          <span className="text-xs font-mono text-gray-600">
                            {entry.commit.slice(0, 7)}
                          </span>
                        )}
                        <span className="text-xs text-gray-700">
                          {entry.source}
                        </span>
                      </div>
                      <form action={deleteEntryAction}>
                        <input type="hidden" name="id" value={entry.id} />
                        <input type="hidden" name="projectId" value={project.id} />
                        <button className="text-xs text-red-400/60 hover:text-red-300 transition">
                          Delete
                        </button>
                      </form>
                    </div>
                    <h3 className="font-medium">{entry.summary}</h3>
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-300 transition">
                        Show full entry
                      </summary>
                      <div className="mt-2">
                        <Markdown content={entry.content} />
                      </div>
                    </details>
                  </div>
                ))}
              </div>
              <Suspense>
                <Pagination currentPage={page} totalPages={totalPages} />
              </Suspense>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
