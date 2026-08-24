"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";
import {
  useCardIQProfile,
} from "@/components/ProfileProvider";
import {
  calculateReward,
  RewardRule,
} from "@/lib/rewards";

type Card = {
  id: string;
  name: string;
  bank: string;
  network: string;
  variant: string | null;
};

type SpendTransaction = {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  transaction_date: string;
  card_id: string | null;
};

type RewardSummary = {
  transaction: SpendTransaction;
  card: Card | null;
  eligible: boolean;
  rewardAmount: number;
  rewardCurrency: string | null;
  notes: string[];
};

export default function RewardsPage() {
  const router = useRouter();

  const {
    activeProfile,
    loadingProfiles,
  } = useCardIQProfile();

  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] =
    useState<SpendTransaction[]>([]);

  const [rules, setRules] =
    useState<RewardRule[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadRewards = async () => {
      if (loadingProfiles) {
        return;
      }

      if (!activeProfile?.id) {
        setCards([]);
        setTransactions([]);
        setRules([]);
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError("");

      const [
        cardsResult,
        transactionsResult,
        rulesResult,
      ] = await Promise.all([
        supabase
          .from("cards")
          .select(
            "id, name, bank, network, variant"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "profile_id",
            activeProfile.id
          ),

        supabase
          .from("spend_transactions")
          .select(
            "id, merchant, amount, category, transaction_date, card_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "profile_id",
            activeProfile.id
          )
          .order(
            "transaction_date",
            {
              ascending: false,
            }
          ),

        supabase
          .from("reward_rules")
          .select(
            "id, bank, card_name, variant, category, rule_type, reward_type, reward_value, reward_currency, cap_amount, cap_period, excluded, priority, valid_from, valid_to"
          ),
      ]);

      if (cardsResult.error) {
        console.error(cardsResult.error);
        setError(
          cardsResult.error.message ||
            "Unable to load your cards."
        );
      }

      if (transactionsResult.error) {
        console.error(
          transactionsResult.error
        );
        setError(
          transactionsResult.error.message ||
            "Unable to load your purchases."
        );
      }

      if (rulesResult.error) {
        console.error(
          rulesResult.error
        );
        setError(
          rulesResult.error.message ||
            "Unable to load reward rules."
        );
      }

      setCards(
        cardsResult.data ?? []
      );

      setTransactions(
        transactionsResult.data ?? []
      );

      setRules(
        (rulesResult.data ??
          []) as RewardRule[]
      );

      setLoading(false);
    };

    loadRewards();
  }, [
    activeProfile?.id,
    loadingProfiles,
    router,
  ]);

  const rewardSummaries =
    useMemo<RewardSummary[]>(() => {
      return transactions.map(
        (transaction) => {
          const card =
            cards.find(
              (item) =>
                item.id ===
                transaction.card_id
            ) ?? null;

          if (!card) {
            return {
              transaction,
              card: null,
              eligible: false,
              rewardAmount: 0,
              rewardCurrency: null,
              notes: [
                "The card used for this transaction is no longer available.",
              ],
            };
          }

          const result =
            calculateReward(
              {
                amount:
                  Number(
                    transaction.amount
                  ),
                category:
                  transaction.category,
                transactionDate:
                  transaction.transaction_date,
                card: {
                  bank: card.bank,
                  name: card.name,
                  variant:
                    card.variant,
                },
              },
              rules
            );

          return {
            transaction,
            card,
            eligible:
              result.eligible,
            rewardAmount:
              result.rewardAmount,
            rewardCurrency:
              result.rewardCurrency,
            notes:
              result.notes,
          };
        }
      );
    }, [
      transactions,
      cards,
      rules,
    ]);

  const totalRewardValue =
    useMemo(() => {
      return rewardSummaries.reduce(
        (total, summary) =>
          total +
          summary.rewardAmount,
        0
      );
    }, [rewardSummaries]);

  const formatCurrency = (
    value: number,
    currency: string
  ) => {
    try {
      return new Intl.NumberFormat(
        undefined,
        {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }
      ).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  };

  if (
    loadingProfiles ||
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading rewards...
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
              Select a profile before viewing rewards.
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

      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            {activeProfile.name} profile
          </p>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Rewards
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                See the reward value generated by your recorded spending.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Estimated reward value
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(
                  totalRewardValue,
                  activeProfile.currency_code
                )}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {rules.length === 0 ? (
          <section className="mb-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold">
              Reward rules are not configured yet
            </h2>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Your spending is being recorded correctly, but CardIQ has not
              yet been given verified reward rules for your cards. We have
              intentionally not assumed reward rates.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/spend")
              }
              className="mt-5 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              View tracked spending
            </button>
          </section>
        ) : transactions.length === 0 ? (
          <section className="mb-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold">
              No purchases yet
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Record some purchases to start calculating reward value.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/spend")
              }
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Track Spend
            </button>
          </section>
        ) : (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Reward breakdown
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Based on the reward rules currently configured for your cards.
              </p>
            </div>

            <div className="space-y-3">
              {rewardSummaries.map(
                (summary) => (
                  <div
                    key={
                      summary.transaction.id
                    }
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {
                            summary
                              .transaction
                              .merchant
                          }
                        </h3>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {
                            summary
                              .transaction
                              .category
                          }{" "}
                          ·{" "}
                          {summary.card
                            ?.name ??
                            "Unknown card"}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {
                            summary
                              .transaction
                              .transaction_date
                          }
                        </p>

                        {summary.notes.map(
                          (note) => (
                            <p
                              key={note}
                              className="mt-2 text-xs text-[var(--muted)]"
                            >
                              {note}
                            </p>
                          )
                        )}
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-xs text-[var(--muted)]">
                          Reward
                        </p>

                        <p className="mt-1 text-base font-semibold">
                          {summary.eligible
                            ? formatCurrency(
                                summary.rewardAmount,
                                summary.rewardCurrency ??
                                  activeProfile.currency_code
                              )
                            : "Not configured"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        )}

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
