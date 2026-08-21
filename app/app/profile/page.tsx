"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: name.trim(),
      },
    });

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    setSaveMessage("Your profile has been saved.");
    setSaving(false);
  };

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
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CardIQHeader />

      <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            Account
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Profile & Settings
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Manage your personal information, preferences and CardIQ
            experience.
          </p>
        </section>

        {/* Personal Information */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Personal information
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Your basic account information.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-2 block text-sm font-medium"
              >
                Name
              </label>

              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Your name"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="profile-email"
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-sm text-[var(--muted)]"
              />

              <p className="mt-2 text-xs text-[var(--muted)]">
                Your email address is managed by your login account.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>

              {saveMessage && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {saveMessage}
                </p>
              )}

              {saveError && (
                <p className="text-sm text-red-600 dark:text-red-300">
                  {saveError}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Regional Preferences */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Regional preferences
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              These settings control how CardIQ displays values and rewards.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Country / region
              </label>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-sm text-[var(--muted)]">
                India
              </div>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Your country is automatically determined and cannot be changed
                from this screen.
              </p>
            </div>

            <div>
              <label
                htmlFor="display-currency"
                className="mb-2 block text-sm font-medium"
              >
                Display currency
              </label>

              <select
                id="display-currency"
                defaultValue="INR"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              >
                <option value="INR">
                  ₹ INR — Indian Rupee
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* Reward Preferences */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Reward preferences
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Choose how CardIQ should estimate the value of your rewards.
            </p>
          </div>

          <div>
            <label
              htmlFor="reward-valuation"
              className="mb-2 block text-sm font-medium"
            >
              Reward valuation
            </label>

            <select
              id="reward-valuation"
              defaultValue="standard"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
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

            <p className="mt-2 text-xs text-[var(--muted)]">
              You will be able to customise reward valuations later.
            </p>
          </div>
        </section>

        {/* Security */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Security
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Manage your CardIQ account security.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Reset password
          </button>
        </section>

        {/* Danger Zone */}
        <section className="rounded-2xl border border-red-200 bg-[var(--card)] p-6 shadow-sm dark:border-red-900 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Danger zone
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Permanently delete your CardIQ account and associated data.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Delete account
          </button>
        </section>

        <footer className="mt-12 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <span>CardIQ</span>
            <span>Make every card spend count.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
