import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApiKeyAction, deleteApiKeyAction } from "@/lib/actions";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await requireAuth();

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-white transition"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <section>
          <h2 className="text-lg font-semibold mb-2">API Keys</h2>
          <p className="text-gray-400 text-sm mb-6">
            API keys authenticate the CLI and MCP server with your account.
            Keys created by <code className="text-gray-300 bg-gray-800 px-1 rounded">devguard init</code> are
            labeled &ldquo;cli&rdquo;.
          </p>

          <form action={createApiKeyAction} className="flex gap-3 mb-8">
            <input
              name="name"
              type="text"
              placeholder="Key name (e.g., 'laptop', 'ci')"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Create Key
            </button>
          </form>

          {apiKeys.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No API keys yet. Create one or run <code className="text-gray-300 bg-gray-800 px-1 rounded">devguard init</code> to
              get started.
            </p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4"
                >
                  <div>
                    <span className="font-medium">{key.name}</span>
                    <span className="text-gray-500 text-sm ml-3 font-mono">
                      {key.key.slice(0, 7)}...{key.key.slice(-4)}
                    </span>
                    <span className="text-gray-600 text-xs ml-3">
                      Created {key.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <form action={deleteApiKeyAction}>
                    <input type="hidden" name="id" value={key.id} />
                    <button className="text-sm text-red-400 hover:text-red-300 transition">
                      Revoke
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
