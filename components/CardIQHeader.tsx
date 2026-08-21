"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CardIQHeader() {
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

        {/* Logo + Navigation */}
        <div className="flex items-center gap-10">

          <a
            href="/dashboard"
            className="text-xl font-bold tracking-tight"
          >
            CardIQ
          </a>

          <div className="hidden items-center gap-7 text-sm font-medium text-slate-500 md:flex">

            <a
              href="/dashboard"
              className="transition hover:text-slate-900"
            >
              Overview
            </a>

            <a
              href="/cards"
              className="transition hover:text-slate-900"
            >
              My Cards
            </a>

            <a
              href="/rewards"
              className="transition hover:text-slate-900"
            >
              Rewards
            </a>

            <a
              href="/discover"
              className="transition hover:text-slate-900"
            >
              Discover
            </a>

          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">

          {/* Add Card */}
          <a
            href="/cards/add"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Add Card
          </a>

          {/* Profile Menu */}
          <div className="relative">

            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <span>Profile</span>

              <span
                className={`text-xs transition-transform ${
                  profileMenuOpen ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">

                {/* Profile */}
                <a
                  href="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Profile
                </a>

                {/* Switch Profile */}
                <a
                  href="/profiles"
                  onClick={() => setProfileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Switch Profile
                </a>

                {/* Settings */}
                <a
                  href="/profile#settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Settings
                </a>

                <div className="my-1 border-t border-slate-100" />

                {/* Log out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>

              </div>
            )}

          </div>

        </div>

      </div>
    </nav>
  );
}
