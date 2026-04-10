import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-5xl font-bold mb-4">Dev Diary</h1>
      <p className="text-gray-400 text-lg mb-8 max-w-md text-center">
        Your dev wiki and notes, organized by project. 3-month free trial.
      </p>
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
    </div>
  );
}
