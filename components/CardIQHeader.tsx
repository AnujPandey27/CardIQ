"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CardIQHeader() {
  const [loggingOut, setLoggingOut] = useState(false);

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

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>

          <a
            href="/cards/add"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Add Card
          </a>

        </div>

      </div>
    </nav>
  );
}
