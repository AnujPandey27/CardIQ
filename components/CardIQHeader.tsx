"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  useCardIQTheme,
} from "@/components/ThemeProvider";
import {
  useCardIQProfile,
} from "@/components/ProfileProvider";
import {
  CURRENCY_OPTIONS,
  DISPLAY_CURRENCY_EVENT,
  getCurrencyOption,
  getStoredDisplayCurrency,
  setStoredDisplayCurrency,
  type DisplayCurrency,
} from "@/lib/currency";

type Theme =
  | "system"
  | "light"
  | "dark";

function countryCodeToFlag(
  countryCode: string
): string {
  const normalized =
    countryCode.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized)) {
    return "🌐";
  }

  return normalized
    .split("")
    .map(
      (char) =>
        String.fromCodePoint(
          127397 + char.charCodeAt(0)
        )
    )
    .join("");
}

export default function CardIQHeader() {
  const [loggingOut, setLoggingOut] =
    useState(false);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  const [displayCurrency, setDisplayCurrency] =
    useState<DisplayCurrency>("INR");

  const { theme, setTheme } =
    useCardIQTheme();

  const {
    activeProfile,
    loadingProfiles,
  } = useCardIQProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeProfile) {
      return;
    }

    const fallbackCurrency =
      CURRENCY_OPTIONS.some(
        (option) =>
          option.code ===
          activeProfile.currency_code
      )
        ? (activeProfile.currency_code as DisplayCurrency)
        : "INR";

    setDisplayCurrency(
      getStoredDisplayCurrency(
        fallbackCurrency
      )
    );

    const handleCurrencyChange =
      (event: Event) => {
        const customEvent =
          event as CustomEvent<DisplayCurrency>;

        if (
          CURRENCY_OPTIONS.some(
            (option) =>
              option.code ===
              customEvent.detail
          )
        ) {
          setDisplayCurrency(
            customEvent.detail
          );
        }
      };

    window.addEventListener(
      DISPLAY_CURRENCY_EVENT,
      handleCurrencyChange
    );

    return () => {
      window.removeEventListener(
        DISPLAY_CURRENCY_EVENT,
        handleCurrencyChange
      );
    };
  }, [activeProfile]);

  const handleCurrencyChange = (
    currency: DisplayCurrency
  ) => {
    setDisplayCurrency(currency);
    setStoredDisplayCurrency(currency);
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    const supabase =
      createClient();

    await supabase.auth.signOut();

    window.location.href =
      "/login";
  };

  const themeOptions: {
    value: Theme;
    label: string;
  }[] = [
    {
      value: "system",
      label: "System",
    },
    {
      value: "light",
      label: "Light",
    },
    {
      value: "dark",
      label: "Dark",
    },
  ];

  const profileName =
    loadingProfiles
      ? "Profile"
      : activeProfile?.name ??
        "Profile";

  const profileCountry =
    activeProfile?.country_code ??
    "";

  const profileCurrency =
    activeProfile?.currency_code ??
    "INR";

  const profileCurrencyOption =
    getCurrencyOption(
      profileCurrency
    );

  const selectedDisplayCurrency =
    getCurrencyOption(
      displayCurrency
    );

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-10">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight"
          >
            CardIQ
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-slate-500 dark:text-slate-400 md:flex">
            <Link
              href="/dashboard"
              className="transition hover:text-slate-900 dark:hover:text-white"
            >
              Overview
            </Link>

            <Link
              href="/cards"
              className="transition hover:text-slate-900 dark:hover:text-white"
            >
              My Cards
            </Link>

            <Link
              href="/rewards"
              className="transition hover:text-slate-900 dark:hover:text-white"
            >
              Rewards
            </Link>

            <Link
              href="/discover"
              className="transition hover:text-slate-900 dark:hover:text-white"
            >
              Discover
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/cards/add"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            + Add Card
          </Link>

          {/* Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setProfileMenuOpen(
                  (current) =>
                    !current
                )
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-expanded={
                profileMenuOpen
              }
              aria-haspopup="menu"
            >
              <span className="text-base">
                {mounted
                  ? countryCodeToFlag(
                      profileCountry
                    )
                  : "🌐"}
              </span>

              <span className="max-w-36 truncate">
                {profileName}
              </span>

              <span className="text-slate-400">
                ·
              </span>

              <span className="font-semibold">
                {profileCurrencyOption.symbol}
              </span>

              <span className="text-xs text-slate-400">
                {profileCurrency}
              </span>

              <span
                className={`ml-1 text-xs transition-transform ${
                  profileMenuOpen
                    ? "rotate-180"
                    : ""
                }`}
              >
                ▼
              </span>
            </button>

            {profileMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                role="menu"
              >
                {/* Profile settings */}
                <Link
                  href="/profile"
                  onClick={() =>
                    setProfileMenuOpen(
                      false
                    )
                  }
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Profile settings
                </Link>

                {/* Switch Profile */}
                <Link
                  href="/profiles"
                  onClick={() =>
                    setProfileMenuOpen(
                      false
                    )
                  }
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Switch Profile
                </Link>

                {/* Account settings */}
                <Link
                  href="/account"
                  onClick={() =>
                    setProfileMenuOpen(
                      false
                    )
                  }
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Account settings
                </Link>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Appearance */}
                <div className="px-4 py-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Appearance
                  </p>

                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    {themeOptions.map(
                      (option) => (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() =>
                            setTheme(
                              option.value
                            )
                          }
                          className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                            mounted &&
                            theme ===
                              option.value
                              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          }`}
                        >
                          {
                            option.label
                          }
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Display currency */}
                <div className="px-4 py-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Display currency
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Profile currency:{" "}
                        {profileCurrency}
                      </p>
                    </div>

                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {
                        selectedDisplayCurrency.symbol
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    {CURRENCY_OPTIONS.map(
                      (option) => (
                        <button
                          key={
                            option.code
                          }
                          type="button"
                          onClick={() =>
                            handleCurrencyChange(
                              option.code
                            )
                          }
                          title={
                            option.name
                          }
                          className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                            displayCurrency ===
                            option.code
                              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          }`}
                        >
                          {
                            option.code
                          }
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Log out */}
                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loggingOut
                  }
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                >
                  {loggingOut
                    ? "Logging out..."
                    : "Log out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
