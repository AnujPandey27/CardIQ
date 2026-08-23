"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";
import { useCardIQProfile } from "@/components/ProfileProvider";

export default function ProfilePage() {
  const router = useRouter();

  const {
    activeProfile,
    loadingProfiles,
    refreshProfiles,
  } = useCardIQProfile();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!loadingProfiles && activeProfile) {
      setName(activeProfile.name);
    }
  }, [activeProfile, loadingProfiles]);

  const handleSaveChanges = async () => {
    if (!activeProfile) {
      setSaveError("No active profile is available.");
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setSaveError("Please enter a profile name.");
      return;
    }

    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        name: trimmedName,
      })
      .eq("id", activeProfile.id);

    if (error) {
      console.error(error);
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    await refreshProfiles();

    setName(trimmedName);
    setSaveMessage("Profile settings have been saved.");
    setSaving(false);
  };

  if (loadingProfiles) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading profile...
        </p>
      </main>
    );
  }

  if (!activeProfile) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <CardIQHeader />

        <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold">
              No active profile
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Select a profile before managing profile settings.
            </p>

            <button
              type="button"
              onClick={() => router.push("/profiles")}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Switch Profile
            </button>
          </div>
        </div>
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
            Profile
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Profile settings
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Manage the settings for your currently active regional profile.
          </p>
        </section>

        {/* Active profile */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Active profile
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {activeProfile.name}
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              {activeProfile.country_code} ·{" "}
              {activeProfile.currency_code}
            </p>
          </div>

          <div className="space-y-5">
            {/* Profile name */}
            <div>
              <label
                htmlFor="profile-name"
                className="mb-2 block text-sm font-medium"
              >
                Profile name
              </label>

              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. India"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              />

              <p className="mt-2 text-xs text-[var(--muted)]">
                This name identifies the profile in the CardIQ profile switcher.
              </p>
            </div>

            {/* Country */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Country / region
              </label>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-sm text-[var(--muted)]">
                {activeProfile.country_code}
              </div>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Country is determined by CardIQ and cannot be changed here.
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Display currency
              </label>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-sm font-medium">
                {activeProfile.currency_code}
              </div>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Currency is tied to the profile's regional configuration.
              </p>
            </div>

            {/* Save */}
            <div className="flex flex-col items-start gap-3 pt-2">
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

        {/* Reward Preferences */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Reward preferences
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              These preferences apply only to the active profile.
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
              Custom reward valuation storage will be added when reward
              preferences are connected to the profile settings table.
            </p>
          </div>
        </section>

        {/* Switch profile */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">
                Other profiles
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Switch to another regional profile associated with your account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/profiles")}
              className="shrink-0 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Switch Profile
            </button>
          </div>
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
