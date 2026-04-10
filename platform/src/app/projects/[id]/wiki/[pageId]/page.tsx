import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateWikiPageAction, deleteWikiPageAction } from "@/lib/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/app/components/Markdown";

export default async function WikiPageDetail({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  await requireAuth();
  const { id, pageId } = await params;

  const page = await prisma.wikiPage.findUnique({
    where: { id: pageId },
  });

  if (!page || page.projectId !== id) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href={`/projects/${id}`} className="text-gray-400 hover:text-white transition">
          &larr; Back to project
        </Link>
        <form action={deleteWikiPageAction}>
          <input type="hidden" name="id" value={page.id} />
          <button className="text-sm text-red-400 hover:text-red-300 transition">
            Delete Page
          </button>
        </form>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <form action={updateWikiPageAction} className="space-y-4">
          <input type="hidden" name="id" value={page.id} />
          <input
            name="title"
            type="text"
            defaultValue={page.title}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-600"
          />
          <textarea
            name="content"
            defaultValue={page.content}
            rows={20}
            placeholder="Write your wiki content here..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 resize-y font-mono text-sm leading-relaxed"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Save
          </button>
        </form>

        {page.content && (
          <div className="mt-10 border-t border-gray-800 pt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Preview</h2>
            <Markdown content={page.content} />
          </div>
        )}
      </main>
    </div>
  );
}
