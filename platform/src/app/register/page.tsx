"use client";

import { registerAction } from "@/lib/actions";
import Link from "next/link";
import { useActionState } from "react";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Start Free Trial</h1>
        <p className="text-gray-400 text-sm mb-6">
          3 months free. No credit card required.
        </p>
        <form action={formAction} className="space-y-4">
          <input
            name="name"
            type="text"
            placeholder="Name"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          {state?.error && (
            <p className="text-red-400 text-sm">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            {pending ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-gray-500 text-sm mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
