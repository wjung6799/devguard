import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateNoteAction, deleteNoteAction } from "@/lib/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/app/components/Markdown";

export default async function NoteDetail({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  await requireAuth();
  const { id, noteId } = await params;

  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });

  if (!note || note.projectId !== id) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href={`/projects/${id}`} className="text-gray-400 hover:text-white transition">
          &larr; Back to project
        </Link>
        <form action={deleteNoteAction}>
          <input type="hidden" name="id" value={note.id} />
          <button className="text-sm text-red-400 hover:text-red-300 transition">
            Delete Note
          </button>
        </form>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <form action={updateNoteAction} className="space-y-4">
          <input type="hidden" name="id" value={note.id} />
          <input
            name="title"
            type="text"
            defaultValue={note.title}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-600"
          />
          <textarea
            name="content"
            defaultValue={note.content}
            rows={20}
            placeholder="Write your note here..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 resize-y font-mono text-sm leading-relaxed"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Save
          </button>
        </form>

        {note.content && (
          <div className="mt-10 border-t border-gray-800 pt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Preview</h2>
            <Markdown content={note.content} />
          </div>
        )}
      </main>
    </div>
  );
}
