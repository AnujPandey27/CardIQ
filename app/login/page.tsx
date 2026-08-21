"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    // Supabase authentication will be connected here
    // in the next step.

   const supabase = createClient();

const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  setLoading(false);
  setError(error.message);
  return;
}

window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-12 text-slate-900 transition-colors duration-500 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center justify-center">
        <div className="w-full">

          {/* Logo */}
          <div className="mb-10 text-center">
            <a
              href="/"
              className="text-3xl font-bold tracking-tight"
            >
              CardIQ
            </a>

            <h1 className="mt-8 text-3xl font-bold tracking-tight">
              Welcome back
            </h1>

            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Log in to continue to your CardIQ dashboard.
            </p>
          </div>

          {/* Login card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email
                </label>

                <input
                  id="email"
  name="email"
  type="email"
  autoComplete="username"
  required
  value={email}
  onChange={(event) => setEmail(event.target.value)}
  placeholder="you@example.com"
  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-400 dark:focus:ring-slate-800"
/>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium"
                  >
                    Password
                  </label>

                  <a
                    href="#"
                    className="text-sm text-slate-500 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
                  >
                    Forgot password?
                  </a>
                </div>

                <input
  id="password"
  name="password"
  type="password"
  autoComplete="current-password"
  required
  value={password}
  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-400 dark:focus:ring-slate-800"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>

            </form>

            {/* Signup */}
            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="font-semibold text-slate-950 hover:underline dark:text-white"
              >
                Sign up
              </a>
            </div>

          </div>

          {/* Back */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              ← Back to CardIQ
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
