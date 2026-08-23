"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";
import {
  useCardIQProfile,
} from "@/components/ProfileProvider";

type DetectedRegion = {
  countryCode: string;
  currencyCode: string;
  suggestedName: string;
};

function detectRegion(): DetectedRegion {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const language =
    typeof navigator !== "undefined"
      ? navigator.language
      : "";

  /*
   * Primary detection uses the browser timezone.
   * Locale is used as a fallback for regions where timezone
   * alone is not sufficient.
   */
  const timezoneMap: Record<
    string,
    DetectedRegion
  > = {
    "Asia/Kolkata": {
      countryCode: "IN",
      currencyCode: "INR",
      suggestedName: "India",
    },

    "Asia/Singapore": {
      countryCode: "SG",
      currencyCode: "SGD",
      suggestedName: "Singapore",
    },

    "Asia/Dubai": {
      countryCode: "AE",
      currencyCode: "AED",
      suggestedName: "UAE",
    },

    "Asia/Muscat": {
      countryCode: "OM",
      currencyCode: "OMR",
      suggestedName: "Oman",
    },

    "Asia/Riyadh": {
      countryCode: "SA",
      currencyCode: "SAR",
      suggestedName: "Saudi Arabia",
    },

    "Asia/Qatar": {
      countryCode: "QA",
      currencyCode: "QAR",
      suggestedName: "Qatar",
    },

    "Europe/London": {
      countryCode: "GB",
      currencyCode: "GBP",
      suggestedName: "United Kingdom",
    },

    "Europe/Dublin": {
      countryCode: "IE",
      currencyCode: "EUR",
      suggestedName: "Ireland",
    },

    "Europe/Amsterdam": {
      countryCode: "NL",
      currencyCode: "EUR",
      suggestedName: "Netherlands",
    },

    "Europe/Stockholm": {
      countryCode: "SE",
      currencyCode: "SEK",
      suggestedName: "Sweden",
    },

    "Europe/Paris": {
      countryCode: "FR",
      currencyCode: "EUR",
      suggestedName: "France",
    },

    "Europe/Berlin": {
      countryCode: "DE",
      currencyCode: "EUR",
      suggestedName: "Germany",
    },

    "Europe/Zurich": {
      countryCode: "CH",
      currencyCode: "CHF",
      suggestedName: "Switzerland",
    },

    "America/New_York": {
      countryCode: "US",
      currencyCode: "USD",
      suggestedName: "United States",
    },

    "America/Los_Angeles": {
      countryCode: "US",
      currencyCode: "USD",
      suggestedName: "United States",
    },

    "America/Chicago": {
      countryCode: "US",
      currencyCode: "USD",
      suggestedName: "United States",
    },

    "America/Denver": {
      countryCode: "US",
      currencyCode: "USD",
      suggestedName: "United States",
    },

    "Australia/Sydney": {
      countryCode: "AU",
      currencyCode: "AUD",
      suggestedName: "Australia",
    },

    "Australia/Melbourne": {
      countryCode: "AU",
      currencyCode: "AUD",
      suggestedName: "Australia",
    },

    "Asia/Tokyo": {
      countryCode: "JP",
      currencyCode: "JPY",
      suggestedName: "Japan",
    },

    "Asia/Hong_Kong": {
      countryCode: "HK",
      currencyCode: "HKD",
      suggestedName: "Hong Kong",
    },

    "Asia/Seoul": {
      countryCode: "KR",
      currencyCode: "KRW",
      suggestedName: "South Korea",
    },
  };

  if (timezoneMap[timezone]) {
    return timezoneMap[timezone];
  }

  /*
   * Locale fallback.
   *
   * Examples:
   * en-IN → IN
   * en-SG → SG
   * en-GB → GB
   */
  const localeCountry = language.includes("-")
    ? language.split("-")[1]?.toUpperCase()
    : "";

  const localeMap: Record<
    string,
    DetectedRegion
  > = {
    IN: {
      countryCode: "IN",
      currencyCode: "INR",
      suggestedName: "India",
    },

    SG: {
      countryCode: "SG",
      currencyCode: "SGD",
      suggestedName: "Singapore",
    },

    AE: {
      countryCode: "AE",
      currencyCode: "AED",
      suggestedName: "UAE",
    },

    GB: {
      countryCode: "GB",
      currencyCode: "GBP",
      suggestedName: "United Kingdom",
    },

    IE: {
      countryCode: "IE",
      currencyCode: "EUR",
      suggestedName: "Ireland",
    },

    US: {
      countryCode: "US",
      currencyCode: "USD",
      suggestedName: "United States",
    },

    AU: {
      countryCode: "AU",
      currencyCode: "AUD",
      suggestedName: "Australia",
    },

    JP: {
      countryCode: "JP",
      currencyCode: "JPY",
      suggestedName: "Japan",
    },

    HK: {
      countryCode: "HK",
      currencyCode: "HKD",
      suggestedName: "Hong Kong",
    },

    KR: {
      countryCode: "KR",
      currencyCode: "KRW",
      suggestedName: "South Korea",
    },
  };

  return (
    localeMap[localeCountry] ?? {
      countryCode: "IN",
      currencyCode: "INR",
      suggestedName: "India",
    }
  );
}

export default function ProfilesPage() {
  const router = useRouter();

  const {
    profiles,
    activeProfile,
    loadingProfiles,
    switchProfile,
    refreshProfiles,
  } = useCardIQProfile();

  const [creatingProfile, setCreatingProfile] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [createMessage, setCreateMessage] =
    useState("");

  const detectedRegion = useMemo(
    () => detectRegion(),
    []
  );

  const profileAlreadyExists =
    profiles.some(
      (profile) =>
        profile.country_code ===
        detectedRegion.countryCode
    );

  const handleSwitchProfile = (
    profileId: string
  ) => {
    switchProfile(profileId);
    router.push("/dashboard");
  };

  const handleCreateProfile = async () => {
    setCreatingProfile(true);
    setCreateError("");
    setCreateMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    /*
     * Prevent multiple profiles for the same country.
     */
    const existingProfile = profiles.find(
      (profile) =>
        profile.country_code ===
        detectedRegion.countryCode
    );

    if (existingProfile) {
      switchProfile(existingProfile.id);

      setCreateMessage(
        `${existingProfile.name} is already available. It has been made your active profile.`
      );

      setCreatingProfile(false);
      return;
    }

    const { data: newProfile, error } =
      await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          name: detectedRegion.suggestedName,
          country_code:
            detectedRegion.countryCode,
          currency_code:
            detectedRegion.currencyCode,
          is_default: false,
        })
        .select(
          "id, name, country_code, currency_code, is_default, created_at"
        )
        .single();

    if (error) {
      console.error(error);
      setCreateError(
        error.message ||
          "Unable to create your new regional profile."
      );
      setCreatingProfile(false);
      return;
    }

    await refreshProfiles();

    switchProfile(newProfile.id);

    setCreateMessage(
      `${newProfile.name} profile created successfully.`
    );

    setCreatingProfile(false);

    setTimeout(() => {
      router.push("/dashboard");
    }, 700);
  };

  if (loadingProfiles) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading profiles...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CardIQHeader />

      <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            Account
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Switch Profile
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Manage the regional profile you want CardIQ to use for your
            cards, rewards and preferences.
          </p>
        </section>

        {/* Existing Profiles */}
        <section className="space-y-3">
          {profiles.map((profile) => {
            const isActive =
              profile.id === activeProfile?.id;

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() =>
                  handleSwitchProfile(profile.id)
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
        </section>

        {/* Add Profile */}
        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-[var(--muted)]">
              Create another regional profile
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Add a profile for your current region
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              CardIQ will automatically determine the country and currency
              from your current device region. You cannot manually select
              the country.
            </p>
          </div>

          {/* Detected region */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-muted)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Detected region
            </p>

            <p className="mt-2 text-lg font-semibold">
              {detectedRegion.suggestedName}
            </p>

            <p className="mt-1 text-sm text-[var(--muted)]">
              {detectedRegion.countryCode} ·{" "}
              {detectedRegion.currencyCode}
            </p>
          </div>

          {createError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {createError}
            </div>
          )}

          {createMessage && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              {createMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateProfile}
            disabled={creatingProfile}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {creatingProfile
              ? "Creating profile..."
              : profileAlreadyExists
                ? `Use ${detectedRegion.suggestedName} profile`
                : `Add ${detectedRegion.suggestedName} profile`}
          </button>
        </section>

        {/* Future detection note */}
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Country selection is intentionally unavailable. CardIQ will
            use regional detection to keep country-specific card catalogues,
            rewards and currencies separate between profiles.
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
