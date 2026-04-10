import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <h1 className="text-5xl font-bold mb-4">Dev Diary</h1>
      <p className="text-gray-400 text-lg mb-10 max-w-lg text-center">
        Automatic context preservation for AI-assisted development.
        Never lose track of what you did, why, or what&apos;s next.
      </p>

      <div className="grid gap-4 max-w-md w-full mb-10 text-sm">
        <div className="flex items-start gap-3 text-gray-300">
          <span className="text-gray-500 mt-0.5">&#9679;</span>
          <span>
            <strong className="text-white">Auto-diary from git.</strong>{" "}
            Your AI assistant logs structured entries as you work — changes, decisions, issues, next steps.
          </span>
        </div>
        <div className="flex items-start gap-3 text-gray-300">
          <span className="text-gray-500 mt-0.5">&#9679;</span>
          <span>
            <strong className="text-white">Cloud sync.</strong>{" "}
            Entries sync to the platform so you can browse, search, and filter your dev history from any browser.
          </span>
        </div>
        <div className="flex items-start gap-3 text-gray-300">
          <span className="text-gray-500 mt-0.5">&#9679;</span>
          <span>
            <strong className="text-white">Rules for AI.</strong>{" "}
            Define coding standards and conventions that get loaded into your AI assistant&apos;s context automatically.
          </span>
        </div>
        <div className="flex items-start gap-3 text-gray-300">
          <span className="text-gray-500 mt-0.5">&#9679;</span>
          <span>
            <strong className="text-white">Wiki + notes per project.</strong>{" "}
            Organize knowledge alongside your diary — decisions, patterns, onboarding docs.
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/register"
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
        >
          Start Free Trial
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 border border-gray-600 rounded-lg hover:border-gray-400 transition"
        >
          Log In
        </Link>
      </div>

      <p className="text-gray-600 text-xs mt-6">
        3-month free trial. No credit card required.
      </p>
    </div>
  );
}
