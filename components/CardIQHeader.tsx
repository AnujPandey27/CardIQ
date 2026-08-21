"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCardIQTheme } from "@/components/ThemeProvider";

type Theme = "system" | "light" | "dark";

export default function CardIQHeader() {
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);
  const [profileName, setProfileName] =
    useState("Profile");
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme } = useCardIQTheme();

  useEffect(() => {
    setMounted(true);

    const loadProfileName = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .order("is_default", {
          ascending: false,
        })
        .order("created_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (profile?.name) {
        setProfileName(profile.name);
      } else if (
        user.user_metadata?.full_name
      ) {
        setProfileName(
          user.user_metadata.full_name
        );
      }
    };

    loadProfileName();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
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

          {/* Add Card */}
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
                  (current) => !current
                )
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="max-w-36 truncate">
                {profileName}
              </span>

              <span
                className={`text-xs transition-transform ${
                  profileMenuOpen
                    ? "rotate-180"
                    : ""
                }`}
              >
                ▼
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">

                <Link
                  href="/profile"
                  onClick={() =>
                    setProfileMenuOpen(false)
                  }
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Profile
                </Link>

                <Link
                  href="/profiles"
                  onClick={() =>
                    setProfileMenuOpen(false)
                  }
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Switch Profile
                </Link>

                <Link
                  href="/profile"
                  onClick={() =>
                    setProfileMenuOpen(false)
                  }
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Settings
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
                          key={option.value}
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
                          {option.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Log out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
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
