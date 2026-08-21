"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";

type Card = {
  id: number;
  name: string;
  bank: string;
  network: string;
  variant: string;
  reward: string;
  color: string;
};

const cards: Card[] = [
  {
    id: 1,
    name: "HDFC Infinia",
    bank: "HDFC Bank",
    network: "Visa",
    variant: "Infinia Metal",
    reward: "3.3%+",
    color: "bg-slate-900",
  },
  {
    id: 2,
    name: "Axis Atlas",
    bank: "Axis Bank",
    network: "Visa",
    variant: "Atlas",
    reward: "2%+",
    color: "bg-blue-700",
  },
  {
    id: 3,
    name: "Amex MRCC",
    bank: "American Express",
    network: "Amex",
    variant: "Membership Rewards",
    reward: "1%+",
    color: "bg-sky-600",
  },
];

const quickActions = [
  {
    title: "Best Card",
    description: "Find the best card for a purchase",
    icon: "✦",
  },
  {
    title: "Add Card",
    description: "Add a card to your portfolio",
    icon: "+",
  },
  {
    title: "Track Spend",
    description: "Record a purchase or payment",
    icon: "↗",
  },
  {
    title: "Explore",
    description: "Discover cards and benefits",
    icon: "⌕",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-slate-900">
        <p className="text-sm text-slate-500">Loading CardIQ...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      {/* Navigation */}
return (
  <main className="min-h-screen bg-[#f7f8fa] text-slate-900">

    <CardIQHeader />

    {/* Main */}
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-10">
            <div className="text-xl font-bold tracking-tight">CardIQ</div>

            <div className="hidden items-center gap-7 text-sm font-medium text-slate-500 md:flex">
              {["Overview", "My Cards", "Rewards", "Discover"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`transition ${
                    activeTab === tab
                      ? "text-slate-900"
                      : "hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            + Add Card
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        {/* Welcome */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-slate-500">
            Your credit card companion
          </p>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Make every card spend count.
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                Manage your cards, find the right card for every purchase,
                discover better opportunities, and track the rewards you earn.
              </p>
            </div>

            <button className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:block">
              View insights →
            </button>
          </div>
        </section>

        {/* Best Card */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                CardIQ Recommendation
              </div>

              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Which card should you use?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                Tell CardIQ what you are buying and we&apos;ll identify the
                card that can give you the best available value.
              </p>
            </div>

            <button className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Find my best card →
            </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick actions</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-700">
                  {action.icon}
                </div>

                <h3 className="font-semibold">{action.title}</h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {action.description}
                </p>

                <span className="mt-4 block text-xs font-semibold text-slate-400 transition group-hover:text-slate-700">
                  Open →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Portfolio + Rewards */}
        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* My Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">My Cards</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your card portfolio
                </p>
              </div>

              <button className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                View all →
              </button>
            </div>

            <div className="space-y-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div
                    className={`flex h-12 w-16 shrink-0 items-center justify-center rounded-lg ${card.color} text-xs font-bold text-white`}
                  >
                    CARD
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {card.name}
                    </h3>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {card.bank} · {card.network}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold">{card.reward}</p>
                    <p className="mt-1 text-xs text-slate-400">value</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Rewards snapshot</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your portfolio at a glance
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Estimated value earned</p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                ₹0
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Start tracking purchases to build your rewards history.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500">Purchases</p>
                <p className="mt-1 text-lg font-semibold">0</p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500">Rewards</p>
                <p className="mt-1 text-lg font-semibold">₹0</p>
              </div>
            </div>

            <button className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold transition hover:bg-slate-50">
              Track a purchase
            </button>
          </div>
        </section>

        {/* Discover */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Explore CardIQ
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Discover more ways to get value from your cards.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Compare cards, explore rewards, discover premium benefits,
                travel opportunities, shopping offers and more.
              </p>
            </div>

            <button className="shrink-0 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold transition hover:bg-slate-50">
              Explore CardIQ →
            </button>
          </div>
        </section>

        {/* Footer */}
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
