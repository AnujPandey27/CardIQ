"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  created_at: string;
};

export default function CardsPage() {
  const router = useRouter();

  const {
    activeProfile,
    loadingProfiles,
  } = useCardIQProfile();

  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [error, setError] = useState("");

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [deletingCardId, setDeletingCardId] =
    useState<string | null>(null);

  const [deleteError, setDeleteError] =
    useState("");

  useEffect(() => {
    const loadCards = async () => {
      if (loadingProfiles) {
        return;
      }

      if (!activeProfile?.id) {
        setCards([]);
        setError("No active profile is available.");
        setLoadingCards(false);
        return;
      }

      setLoadingCards(true);
      setError("");
      setDeleteError("");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: cardsError } =
        await supabase
          .from("cards")
          .select(
            "id, name, bank, network, variant, profile_id, created_at"
          )
          .eq("user_id", user.id)
          .eq(
            "profile_id",
            activeProfile.id
          )
          .order("created_at", {
            ascending: false,
          });

      if (cardsError) {
        console.error(cardsError);

        setError(
          cardsError.message ||
            "Unable to load your cards."
        );

        setCards([]);
        setLoadingCards(false);
        return;
      }

      setCards(data ?? []);
      setLoadingCards(false);
    };

    loadCards();
  }, [
    activeProfile?.id,
    loadingProfiles,
    router,
  ]);

  const handleDeleteCard = async (
    card: Card
  ) => {
    const confirmed = window.confirm(
      `Delete "${card.name}" from your ${activeProfile?.name ?? ""} profile?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingCardId(card.id);
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
        "No active profile is available."
      );
      setDeletingCardId(null);
      return;
    }

    const { error: deleteDbError } =
      await supabase
        .from("cards")
        .delete()
        .eq("id", card.id)
        .eq("user_id", user.id)
        .eq(
          "profile_id",
          activeProfile.id
        );

    if (deleteDbError) {
      console.error(deleteDbError);

      setDeleteError(
        deleteDbError.message ||
          "Unable to delete this card."
      );

      setDeletingCardId(null);
      return;
    }

    setCards((currentCards) =>
      currentCards.filter(
        (currentCard) =>
          currentCard.id !== card.id
      )
    );

    setOpenMenuId(null);
    setDeletingCardId(null);
  };

  if (loadingProfiles || loadingCards) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading your cards...
        </p>
      </main>
    );
  }

  if (!activeProfile) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <CardIQHeader />

        <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold">
              No active profile
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Select a profile before managing your cards.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/profiles")
              }
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

      <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <section className="mb-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--muted)]">
                {activeProfile.name} profile
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Cards
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Manage the cards linked to your{" "}
                {activeProfile.name} profile.
              </p>
            </div>

            <Link
              href="/cards/add"
              className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              + Add Card
            </Link>
          </div>
        </section>

        {/* Profile context */}
        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Current profile
              </p>

              <p className="mt-2 font-semibold">
                {activeProfile.name}
              </p>

              <p className="mt-1 text-sm text-[var(--muted)]">
                {activeProfile.country_code} ·{" "}
                {activeProfile.currency_code}
              </p>
            </div>

            <Link
              href="/profiles"
              className="shrink-0 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Switch Profile
            </Link>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Cards */}
        {cards.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-sm">
            <div className="mx-auto max-w-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                +
              </div>

              <h2 className="mt-5 text-lg font-semibold">
                No cards in this profile
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Add your first card to start building your{" "}
                {activeProfile.name} card portfolio.
              </p>

              <Link
                href="/cards/add"
                className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Add your first card
              </Link>
            </div>
          </section>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[var(--muted)]">
                {cards.length} card
                {cards.length === 1
                  ? ""
                  : "s"} in this profile
              </p>
            </div>

            <section className="space-y-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition hover:brightness-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white dark:bg-slate-700">
                      CARD
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold">
                        {card.name}
                      </h2>

                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {card.bank} ·{" "}
                        {card.network}
                      </p>

                      {card.variant && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {card.variant}
                        </p>
                      )}
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === card.id
                              ? null
                              : card.id
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-[var(--muted)] transition hover:bg-slate-100 hover:text-[var(--foreground)] dark:hover:bg-slate-800"
                        aria-label={`Options for ${card.name}`}
                      >
                        ⋮
                      </button>

                      {openMenuId === card.id && (
                        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
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
                              handleDeleteCard(card)
                            }
                            disabled={
                              deletingCardId ===
                              card.id
                            }
                            className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                          >
                            {deletingCardId ===
                            card.id
                              ? "Deleting..."
                              : "Delete card"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {deleteError && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-300">
                {deleteError}
              </p>
            )}
          </>
        )}

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
