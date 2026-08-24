"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";
import { useCardIQProfile } from "@/components/ProfileProvider";

type ProfileRecord = {
  id: string;
  name: string;
  country_code: string;
  currency_code: string;
  is_default: boolean | null;
  is_archived: boolean;
  created_at: string;
};

type RegionOption = {
  countryCode: string;
  currencyCode: string;
  name: string;
};

const SUPPORTED_REGIONS: RegionOption[] = [
  {
    countryCode: "IN",
    currencyCode: "INR",
    name: "India",
  },
  {
    countryCode: "SG",
    currencyCode: "SGD",
    name: "Singapore",
  },
  {
    countryCode: "AE",
    currencyCode: "AED",
    name: "UAE",
  },
  {
    countryCode: "GB",
    currencyCode: "GBP",
    name: "United Kingdom",
  },
  {
    countryCode: "IE",
    currencyCode: "EUR",
    name: "Ireland",
  },
  {
    countryCode: "NL",
    currencyCode: "EUR",
    name: "Netherlands",
  },
  {
    countryCode: "SE",
    currencyCode: "SEK",
    name: "Sweden",
  },
  {
    countryCode: "FR",
    currencyCode: "EUR",
    name: "France",
  },
  {
    countryCode: "DE",
    currencyCode: "EUR",
    name: "Germany",
  },
  {
    countryCode: "CH",
    currencyCode: "CHF",
    name: "Switzerland",
  },
  {
    countryCode: "US",
    currencyCode: "USD",
    name: "United States",
  },
  {
    countryCode: "AU",
    currencyCode: "AUD",
    name: "Australia",
  },
  {
    countryCode: "JP",
    currencyCode: "JPY",
    name: "Japan",
  },
  {
    countryCode: "HK",
    currencyCode: "HKD",
    name: "Hong Kong",
  },
  {
    countryCode: "KR",
    currencyCode: "KRW",
    name: "South Korea",
  },
  {
    countryCode: "OM",
    currencyCode: "OMR",
    name: "Oman",
  },
  {
    countryCode: "SA",
    currencyCode: "SAR",
    name: "Saudi Arabia",
  },
  {
    countryCode: "QA",
    currencyCode: "QAR",
    name: "Qatar",
  },
];

function detectRegion(): RegionOption {
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const language =
    typeof navigator !== "undefined"
      ? navigator.language
      : "";

  const timezoneMap: Record<string, string> = {
    "Asia/Kolkata": "IN",
    "Asia/Singapore": "SG",
    "Asia/Dubai": "AE",
    "Asia/Muscat": "OM",
    "Asia/Riyadh": "SA",
    "Asia/Qatar": "QA",
    "Europe/London": "GB",
    "Europe/Dublin": "IE",
    "Europe/Amsterdam": "NL",
    "Europe/Stockholm": "SE",
    "Europe/Paris": "FR",
    "Europe/Berlin": "DE",
    "Europe/Zurich": "CH",
    "America/New_York": "US",
    "America/Los_Angeles": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "Australia/Sydney": "AU",
    "Australia/Melbourne": "AU",
    "Asia/Tokyo": "JP",
    "Asia/Hong_Kong": "HK",
    "Asia/Seoul": "KR",
  };

  const timezoneCountry =
    timezoneMap[timezone];

  if (timezoneCountry) {
    const region = SUPPORTED_REGIONS.find(
      (item) =>
        item.countryCode === timezoneCountry
    );

    if (region) {
      return region;
    }
  }

  const localeCountry = language.includes("-")
    ? language.split("-")[1]?.toUpperCase()
    : "";

  const localeRegion =
    SUPPORTED_REGIONS.find(
      (item) =>
        item.countryCode === localeCountry
    );

  return (
    localeRegion ??
    SUPPORTED_REGIONS[0]
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

  const detectedRegion = useMemo(
    () => detectRegion(),
    []
  );

  const [selectedRegion, setSelectedRegion] =
    useState(
      detectedRegion.countryCode
    );

  const [archivedProfiles, setArchivedProfiles] =
    useState<ProfileRecord[]>([]);

  const [loadingArchived, setLoadingArchived] =
    useState(true);

  const [creatingProfile, setCreatingProfile] =
    useState(false);

  const [archivingProfileId, setArchivingProfileId] =
    useState<string | null>(null);

  const [restoringProfileId, setRestoringProfileId] =
    useState<string | null>(null);

  const [deletingProfileId, setDeletingProfileId] =
    useState<string | null>(null);

  const [createError, setCreateError] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  const [archiveError, setArchiveError] = useState("");
  const [archiveMessage, setArchiveMessage] = useState("");

  const [restoreError, setRestoreError] = useState("");
  const [restoreMessage, setRestoreMessage] = useState("");

  const [deleteError, setDeleteError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  const selectedRegionDetails =
    SUPPORTED_REGIONS.find(
      (region) =>
        region.countryCode === selectedRegion
    ) ?? detectedRegion;

  const selectedRegionActiveProfile =
    profiles.find(
      (profile) =>
        profile.country_code ===
        selectedRegionDetails.countryCode
    );

  const selectedRegionArchivedProfile =
    archivedProfiles.find(
      (profile) =>
        profile.country_code ===
        selectedRegionDetails.countryCode
    );

  const clearMessages = () => {
    setCreateError("");
    setCreateMessage("");
    setArchiveError("");
    setArchiveMessage("");
    setRestoreError("");
    setRestoreMessage("");
    setDeleteError("");
    setDeleteMessage("");
  };

  const loadArchivedProfiles =
    async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setLoadingArchived(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, country_code, currency_code, is_default, is_archived, created_at"
        )
        .eq("user_id", user.id)
        .eq("is_archived", true)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Archived profiles load error:",
          error
        );

        setRestoreError(
          error.message ||
            "Unable to load archived profiles."
        );

        setArchivedProfiles([]);
        setLoadingArchived(false);
        return;
      }

      setArchivedProfiles(data ?? []);
      setLoadingArchived(false);
    };

  useEffect(() => {
    if (!loadingProfiles) {
      loadArchivedProfiles();
    }
  }, [loadingProfiles]);

  const handleSwitchProfile = (
    profileId: string
  ) => {
    switchProfile(profileId);
    router.push("/dashboard");
  };

  const handleCreateProfile =
    async () => {
      clearMessages();
      setCreatingProfile(true);

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: existingProfile,
        error: existingProfileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, name, country_code, currency_code, is_archived"
        )
        .eq("user_id", user.id)
        .eq(
          "country_code",
          selectedRegionDetails.countryCode
        )
        .maybeSingle();

      if (existingProfileError) {
        console.error(existingProfileError);

        setCreateError(
          existingProfileError.message ||
            "Unable to check whether this profile already exists."
        );

        setCreatingProfile(false);
        return;
      }

      if (existingProfile) {
        if (existingProfile.is_archived) {
          setCreateError(
            `A ${existingProfile.name} profile already exists but is archived. Restore it instead of creating another profile for the same country.`
          );
        } else {
          switchProfile(existingProfile.id);

          setCreateMessage(
            `${existingProfile.name} is already available and has been made active.`
          );
        }

        setCreatingProfile(false);
        return;
      }

      const {
        data: newProfile,
        error,
      } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          name: selectedRegionDetails.name,
          country_code:
            selectedRegionDetails.countryCode,
          currency_code:
            selectedRegionDetails.currencyCode,
          is_default: false,
          is_archived: false,
        })
        .select(
          "id, name, country_code, currency_code, is_default, is_archived, created_at"
        )
        .single();

      if (error) {
        console.error(error);

        if (
          error.code === "23505" ||
          error.message
            ?.toLowerCase()
            .includes(
              "profiles_user_country_unique"
            )
        ) {
          setCreateError(
            "A profile for this country already exists on your account."
          );
        } else {
          setCreateError(
            error.message ||
              "Unable to create your new regional profile."
          );
        }

        setCreatingProfile(false);
        return;
      }

      await refreshProfiles();
      await loadArchivedProfiles();

      switchProfile(newProfile.id);

      setCreateMessage(
        `${newProfile.name} profile created successfully.`
      );

      setCreatingProfile(false);

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    };

  const handleArchiveProfile =
    async (
      profileId: string
    ) => {
      if (profileId === activeProfile?.id) {
        setArchiveError(
          "You cannot archive the profile you are currently using."
        );
        return;
      }

      const profile = profiles.find(
        (item) => item.id === profileId
      );

      if (!profile) {
        setArchiveError(
          "That profile could not be found."
        );
        return;
      }

      const confirmed = window.confirm(
        `Archive the "${profile.name}" profile?\n\nYour cards and historical data will be kept. The profile will be removed from the active profile list and can be restored later.`
      );

      if (!confirmed) {
        return;
      }

      clearMessages();
      setArchivingProfileId(profileId);

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_archived: true,
        })
        .eq("id", profileId)
        .eq("user_id", user.id)
        .eq("is_archived", false);

      if (error) {
        console.error(error);

        setArchiveError(
          error.message ||
            "Unable to archive this profile."
        );

        setArchivingProfileId(null);
        return;
      }

      await refreshProfiles();
      await loadArchivedProfiles();

      setArchiveMessage(
        `${profile.name} has been archived.`
      );

      setArchivingProfileId(null);
    };

  const handleRestoreProfile =
    async (
      profileId: string
    ) => {
      const profile =
        archivedProfiles.find(
          (item) =>
            item.id === profileId
        );

      if (!profile) {
        setRestoreError(
          "That archived profile could not be found."
        );
        return;
      }

      const confirmed = window.confirm(
        `Restore the "${profile.name}" profile?\n\nIt will become available again in Switch Profile.`
      );

      if (!confirmed) {
        return;
      }

      clearMessages();
      setRestoringProfileId(profileId);

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: restoredProfile,
        error,
      } = await supabase
        .from("profiles")
        .update({
          is_archived: false,
        })
        .eq("id", profileId)
        .eq("user_id", user.id)
        .eq("is_archived", true)
        .select(
          "id, name, country_code, currency_code, is_default, is_archived, created_at"
        )
        .single();

      if (error) {
        console.error(error);

        if (
          error.code === "23505" ||
          error.message
            ?.toLowerCase()
            .includes(
              "profiles_user_country_unique"
            )
        ) {
          setRestoreError(
            "This country already has another profile on your account. The archived profile cannot be restored."
          );
        } else {
          setRestoreError(
            error.message ||
              "Unable to restore this profile."
          );
        }

        setRestoringProfileId(null);
        return;
      }

      await refreshProfiles();
      await loadArchivedProfiles();

      setRestoreMessage(
        `${restoredProfile.name} has been restored.`
      );

      setRestoringProfileId(null);
    };

  const handleDeleteProfile =
    async (
      profile: ProfileRecord
    ) => {
      if (
        profile.id === activeProfile?.id
      ) {
        setDeleteError(
          "You cannot delete the profile you are currently using. Switch to another profile first."
        );
        return;
      }

      const confirmed = window.confirm(
        `Delete the "${profile.name}" profile permanently?\n\nThis will permanently delete the profile and all cards belonging to it. This action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      clearMessages();
      setDeletingProfileId(profile.id);

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } =
        await supabase.rpc(
          "delete_profile",
          {
            profile_uuid: profile.id,
          }
        );

      if (error) {
        console.error(error);

        setDeleteError(
          error.message ||
            "Unable to permanently delete this profile."
        );

        setDeletingProfileId(null);
        return;
      }

      await refreshProfiles();
      await loadArchivedProfiles();

      setDeleteMessage(
        `${profile.name} has been permanently deleted.`
      );

      setDeletingProfileId(null);
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

        {/* Active Profiles */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Active profiles
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Select the regional profile you want to use.
            </p>
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
              <p className="text-sm font-medium">
                No active profiles are available.
              </p>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Create a regional profile below.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => {
                const isActive =
                  profile.id ===
                  activeProfile?.id;

                return (
                  <div
                    key={profile.id}
                    className={`rounded-2xl border bg-[var(--card)] p-5 shadow-sm transition ${
                      isActive
                        ? "border-slate-900 dark:border-white"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleSwitchProfile(
                            profile.id
                          )
                        }
                        className="min-w-0 text-left"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">
                              {profile.name}
                            </h3>

                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {profile.country_code} ·{" "}
                              {profile.currency_code}
                            </p>
                          </div>

                          {isActive && (
                            <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                              Active
                            </span>
                          )}
                        </div>
                      </button>

                      {!isActive && (
                        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                          <button
                            type="button"
                            onClick={() =>
                              handleArchiveProfile(
                                profile.id
                              )
                            }
                            disabled={
                              archivingProfileId ===
                              profile.id
                            }
                            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            {archivingProfileId ===
                            profile.id
                              ? "Archiving..."
                              : "Archive"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteProfile(
                                profile
                              )
                            }
                            disabled={
                              deletingProfileId ===
                              profile.id
                            }
                            className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                          >
                            {deletingProfileId ===
                            profile.id
                              ? "Deleting..."
                              : "Delete permanently"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {archiveError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {archiveError}
          </div>
        )}

        {archiveMessage && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
            {archiveMessage}
          </div>
        )}

        {/* Archived Profiles */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Archived profiles
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Restore an archived profile or permanently delete it.
            </p>
          </div>

          {loadingArchived ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-sm">
              <p className="text-sm text-[var(--muted)]">
                Loading archived profiles...
              </p>
            </div>
          ) : archivedProfiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-sm">
              <p className="text-sm text-[var(--muted)]">
                No archived profiles.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedProfiles.map(
                (profile) => (
                  <div
                    key={profile.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {profile.name}
                        </h3>

                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {profile.country_code} ·{" "}
                          {profile.currency_code}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleRestoreProfile(
                              profile.id
                            )
                          }
                          disabled={
                            restoringProfileId ===
                            profile.id
                          }
                          className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
                        >
                          {restoringProfileId ===
                          profile.id
                            ? "Restoring..."
                            : "Restore"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteProfile(
                              profile
                            )
                          }
                          disabled={
                            deletingProfileId ===
                            profile.id
                          }
                          className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                        >
                          {deletingProfileId ===
                          profile.id
                            ? "Deleting..."
                            : "Delete permanently"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {restoreError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {restoreError}
          </div>
        )}

        {restoreMessage && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
            {restoreMessage}
          </div>
        )}

        {deleteError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {deleteError}
          </div>
        )}

        {deleteMessage && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
            {deleteMessage}
          </div>
        )}

        {/* Create Profile */}
        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-[var(--muted)]">
              Create another regional profile
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Add a supported regional profile
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Choose from CardIQ-supported regions. Country and currency
              are controlled by CardIQ and cannot be entered manually.
            </p>
          </div>

          <div>
            <label
              htmlFor="region"
              className="mb-2 block text-sm font-medium"
            >
              Region
            </label>

            <select
              id="region"
              value={selectedRegion}
              onChange={(event) =>
                setSelectedRegion(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
            >
              {SUPPORTED_REGIONS.map(
                (region) => (
                  <option
                    key={region.countryCode}
                    value={region.countryCode}
                  >
                    {region.name} ({region.countryCode} ·{" "}
                    {region.currencyCode})
                  </option>
                )
              )}
            </select>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card-muted)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Selected region
            </p>

            <p className="mt-2 text-lg font-semibold">
              {selectedRegionDetails.name}
            </p>

            <p className="mt-1 text-sm text-[var(--muted)]">
              {selectedRegionDetails.countryCode} ·{" "}
              {selectedRegionDetails.currencyCode}
            </p>
          </div>

          {selectedRegionActiveProfile && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              {selectedRegionActiveProfile.name} already exists and is
              available on your account.
            </div>
          )}

          {selectedRegionArchivedProfile && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              An archived {selectedRegionArchivedProfile.name} profile already
              exists for this region. Restore it instead of creating another
              one.
            </div>
          )}

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
            disabled={
              creatingProfile ||
              Boolean(
                selectedRegionActiveProfile ||
                selectedRegionArchivedProfile
              )
            }
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {creatingProfile
              ? "Creating profile..."
              : selectedRegionActiveProfile
                ? `Use ${selectedRegionActiveProfile.name} profile`
                : selectedRegionArchivedProfile
                  ? "Restore archived profile below"
                  : `Add ${selectedRegionDetails.name} profile`}
          </button>
        </section>

        {/* Information */}
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm leading-6 text-[var(--muted)]">
            CardIQ only allows supported regional profiles. This keeps
            country-specific card catalogues, rewards, currencies and
            recommendations separated correctly.
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
