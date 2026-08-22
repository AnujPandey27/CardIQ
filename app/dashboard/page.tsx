"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";
import { useCardIQProfile } from "@/components/ProfileProvider";

type Card = {
  id: string;
  name: string;
  bank: string;
  network: string;
  variant: string | null;
  profile_id: string;
};

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
  const router = useRouter();

  const {
    activeProfile,
    loadingProfiles,
  } = useCardIQProfile();

  const [cards, setCards] = useState<Card[]>([]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);
  const [cardError, setCardError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] =
    useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteCard = async (cardId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card from your portfolio?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingCardId(cardId);
    setDeleteError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!activeProfile?.id) {
      setDeleteError(
        "Your current profile could not be identified."
      );
      setDeletingCardId(null);
      return;
    }

    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("id", cardId)
      .eq("user_id", user.id)
      .eq("profile_id", activeProfile.id);

    if (error) {
      console.error(error);
      setDeleteError("Unable to delete this card.");
      setDeletingCardId(null);
      return;
    }

    setCards((currentCards) =>
      currentCards.filter((card) => card.id !== cardId)
    );

    setOpenMenuId(null);
    setDeletingCardId(null);
  };

  useEffect(() => {
    const loadDashboard = async () => {
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

    loadDashboard();
  }, []);

  useEffect(() => {
    const loadCards = async () => {
      if (loadingProfiles) {
        return;
      }

      if (!activeProfile?.id) {
        setCards([]);
        setCardError("No active profile is available.");
        setLoadingCards(false);
        return;
      }

      setLoadingCards(true);
      setCardError("");
      setDeleteError("");

      const supabase = createClient();

      const { data, error } = await supabase
        .from("cards")
        .select(
          "id, name, bank, network, variant, profile_id"
        )
        .eq("profile_id", activeProfile.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Cards load error:", error);

        setCards([]);
        setCardError(
          error.message || "Unable to load your cards."
        );
        setLoadingCards(false);
        return;
      }

      setCards(data ?? []);
      setLoadingCards(false);
    };

    loadCards();
  }, [activeProfile?.id, loadingProfiles]);

  if (checkingAuth || loadingProfiles) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading CardIQ...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CardIQHeader />

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        {/* Welcome */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            {activeProfile?.name
              ? `${activeProfile.name} profile`
              : "Your credit card companion"}
          </p>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Make every card spend count.
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Manage your cards, find the right card for every purchase,
                discover better opportunities, and track the rewards you earn.
              </p>
            </div>

            <button
              type="button"
              className="hidden rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:brightness-95 md:block"
            >
              View insights →
            </button>
          </div>
        </section>

        {/* Best Card */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm dark:bg-slate-800 sm:p-8">
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

            <button
              type="button"
              className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Find my best card →
            </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Quick actions
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                onClick={() => {
                  if (action.title === "Add Card") {
                    router.push("/cards/add");
                  }
                }}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:brightness-95"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {action.icon}
                </div>

                <h3 className="font-semibold">
                  {action.title}
                </h3>

                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                  {action.description}
                </p>

                <span className="mt-4 block text-xs font-semibold text-slate-400 transition group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200">
                  Open →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Portfolio + Rewards */}
        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* My Cards */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  My Cards
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  {activeProfile?.name
                    ? `Cards in ${activeProfile.name}`
                    : "Your card portfolio"}
                </p>
              </div>

              <span className="text-sm font-semibold text-[var(--muted)]">
                {cards.length > 0
                  ? `${cards.length} card${
                      cards.length === 1 ? "" : "s"
                    }`
                  : ""}
              </span>
            </div>

            {loadingCards ? (
              <div className="rounded-xl border border-[var(--border)] p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  Loading your cards...
                </p>
              </div>
            ) : cardError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm text-red-600 dark:text-red-300">
                  {cardError}
                </p>
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
                <p className="text-sm font-medium">
                  You haven&apos;t added any cards to this profile yet.
                </p>

                <p className="mt-2 text-xs text-[var(--muted)]">
                  Add your first card to start building your CardIQ portfolio.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/cards/add")
                  }
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Add your first card
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="relative flex items-center gap-4 rounded-xl border border-[var(--border)] p-4 transition hover:brightness-95"
                    >
                      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-slate-700">
                        CARD
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">
                          {card.name}
                        </h3>

                        <p className="mt-1 truncate text-xs text-[var(--muted)]">
                          {card.bank} · {card.network}
                        </p>

                        {card.variant && (
                          <p className="mt-1 truncate text-xs text-[var(--muted)]">
                            {card.variant}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === card.id
                                ? null
                                : card.id
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[var(--muted)] transition hover:bg-slate-100 hover:text-[var(--foreground)] dark:hover:bg-slate-800"
                          aria-label={`Options for ${card.name}`}
                        >
                          ⋮
                        </button>

                        {openMenuId === card.id && (
                          <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                router.push(
                                  `/cards/add?edit=${card.id}`
                                );
                              }}
                              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Edit card
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteCard(card.id)
                              }
                              disabled={
                                deletingCardId === card.id
                              }
                              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                            >
                              {deletingCardId === card.id
                                ? "Deleting..."
                                : "Delete card"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {deleteError && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-300">
                    {deleteError}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Rewards */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Rewards snapshot
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Your portfolio at a glance
              </p>
            </div>

            <div className="rounded-xl bg-[var(--card-muted)] p-5">
              <p className="text-sm text-[var(--muted)]">
                Estimated value earned
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                ₹0
              </p>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Start tracking purchases to build your rewards history.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">
                  Purchases
                </p>

                <p className="mt-1 text-lg font-semibold">
                  0
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">
                  Rewards
                </p>

                <p className="mt-1 text-lg font-semibold">
                  ₹0
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-5 w-full rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Track a purchase
            </button>
          </div>
        </section>

        {/* Discover */}
        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">
                Explore CardIQ
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Discover more ways to get value from your cards.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Compare cards, explore rewards, discover premium benefits,
                travel opportunities, shopping offers and more.
              </p>
            </div>

            <button
              type="button"
              className="shrink-0 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Explore CardIQ →
            </button>
          </div>
        </section>

        {/* Footer */}
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
