"use client";

import { useRouter } from "next/navigation";
import CardIQHeader from "@/components/CardIQHeader";
import {
  useCardIQProfile,
} from "@/components/ProfileProvider";

export default function ProfilesPage() {
  const router = useRouter();

  const {
    profiles,
    activeProfile,
    loadingProfiles,
    switchProfile,
  } = useCardIQProfile();

  const handleSwitchProfile = (
    profileId: string
  ) => {
    switchProfile(profileId);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CardIQHeader />

      <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-10">

        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            Account
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Switch Profile
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Choose which country or regional profile you want to use
            with CardIQ.
          </p>
        </section>

        {loadingProfiles ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <p className="text-sm text-[var(--muted)]">
              Loading profiles...
            </p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <p className="text-sm font-medium">
              No profiles are available.
            </p>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Your CardIQ account does not have a profile yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => {
              const isActive =
                profile.id ===
                activeProfile?.id;

              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() =>
                    handleSwitchProfile(
                      profile.id
                    )
                  }
                  className={`w-full rounded-2xl border bg-[var(--card)] p-5 text-left shadow-sm transition ${
                    isActive
                      ? "border-slate-900 dark:border-white"
                      : "border-[var(--border)] hover:brightness-95"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">
                        {profile.name}
                      </h2>

                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {profile.country_code} ·{" "}
                        {profile.currency_code}
                      </p>
                    </div>

                    {isActive && (
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Future profiles */}
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6">
          <p className="text-sm font-semibold">
            More regional profiles
          </p>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            CardIQ will automatically detect supported countries and
            regions as additional international card catalogues become
            available.
          </p>
        </div>

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
