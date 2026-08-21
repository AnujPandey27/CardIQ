"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? "");
      setName(user.user_metadata?.full_name ?? "");

      setLoading(false);
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-slate-900">
        <p className="text-sm text-slate-500">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <CardIQHeader />

      <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-10">

        {/* Header */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-slate-500">
            Account
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Profile & Settings
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Manage your personal information, preferences and CardIQ
            experience.
          </p>
        </section>

        {/* Personal Information */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Personal information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your basic account information.
            </p>
          </div>

          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>

              <input
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
              />

              <p className="mt-2 text-xs text-slate-400">
                Your email address is managed by your login account.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Save changes
            </button>

          </div>
        </section>

        {/* Regional Preferences */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Regional preferences
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These settings control how CardIQ displays values and rewards.
            </p>
          </div>

          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Country / region
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                India
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Your country is automatically determined and cannot be changed
                from this screen.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Display currency
              </label>

              <select
                defaultValue="INR"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="INR">₹ INR — Indian Rupee</option>
              </select>
            </div>

          </div>
        </section>

        {/* Reward Preferences */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Reward preferences
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose how CardIQ should estimate the value of your rewards.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Reward valuation
            </label>

            <select
              defaultValue="standard"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="standard">
                CardIQ standard valuation
              </option>

              <option value="conservative">
                Conservative valuation
              </option>

              <option value="custom">
                Custom valuation
              </option>
            </select>

            <p className="mt-2 text-xs text-slate-400">
              You will be able to customise reward valuations later.
            </p>
          </div>
        </section>

        {/* Security */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your CardIQ account security.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50"
          >
            Reset password
          </button>
        </section>

        {/* Danger Zone */}
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-600">
              Danger zone
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Permanently delete your CardIQ account and associated data.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Delete account
          </button>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <span>CardIQ</span>
            <span>Make every card spend count.</span>
          </div>
        </footer>

      </div>
    </main>
  );
}
