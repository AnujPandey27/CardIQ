"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type SpendTransaction = {
  id: string;
  merchant: string;
  amount: number;
  currency_code: string;
  category: string;
  transaction_date: string;
  notes: string | null;
  card_id: string | null;
};

const CATEGORIES = [
  "Travel",
  "Dining",
  "Groceries",
  "Shopping",
  "Fuel",
  "Utilities",
  "Bills",
  "Entertainment",
  "Online",
  "Other",
];

export default function SpendPage() {
  const router = useRouter();

  const {
    activeProfile,
    loadingProfiles,
  } = useCardIQProfile();

  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<
    SpendTransaction[]
  >([]);

  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingTransactions, setLoadingTransactions] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] =
    useState<string | null>(null);

  const [editingTransactionId, setEditingTransactionId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [cardId, setCardId] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === cardId),
    [cards, cardId]
  );

  const totalSpend = useMemo(
    () =>
      transactions.reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      ),
    [transactions]
  );

  useEffect(() => {
    const loadData = async () => {
      if (loadingProfiles) {
        return;
      }

      if (!activeProfile?.id) {
        setCards([]);
        setTransactions([]);
        setLoadingCards(false);
        setLoadingTransactions(false);
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

      setLoadingCards(true);
      setLoadingTransactions(true);
      setError("");

      const [cardsResult, transactionsResult] =
        await Promise.all([
          supabase
            .from("cards")
            .select(
              "id, name, bank, network, variant"
            )
            .eq("user_id", user.id)
            .eq(
              "profile_id",
              activeProfile.id
            )
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("spend_transactions")
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id"
            )
            .eq("user_id", user.id)
            .eq(
              "profile_id",
              activeProfile.id
            )
            .order("transaction_date", {
              ascending: false,
            })
            .order("created_at", {
              ascending: false,
            })
            .limit(50),
        ]);

      if (cardsResult.error) {
        console.error(cardsResult.error);

        setError(
          cardsResult.error.message ||
            "Unable to load your cards."
        );
      } else {
        const loadedCards = cardsResult.data ?? [];

        setCards(loadedCards);

        if (
          loadedCards.length > 0 &&
          !cardId
        ) {
          setCardId(loadedCards[0].id);
        }
      }

      if (transactionsResult.error) {
        console.error(
          transactionsResult.error
        );

        setError(
          transactionsResult.error.message ||
            "Unable to load your purchases."
        );

        setTransactions([]);
      } else {
        setTransactions(
          transactionsResult.data ?? []
        );
      }

      setLoadingCards(false);
      setLoadingTransactions(false);
    };

    loadData();
  }, [
    activeProfile?.id,
    loadingProfiles,
    router,
  ]);

  const resetForm = () => {
    setMerchant("");
    setAmount("");
    setCategory("Shopping");

    if (cards.length > 0) {
      setCardId(cards[0].id);
    } else {
      setCardId("");
    }

    setTransactionDate(
      new Date().toISOString().slice(0, 10)
    );
    setNotes("");
    setEditingTransactionId(null);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!activeProfile?.id) {
      setError(
        "No active profile is available."
      );
      return;
    }

    const trimmedMerchant = merchant.trim();
    const numericAmount = Number(amount);

    if (!trimmedMerchant) {
      setError(
        "Please enter the merchant name."
      );
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid purchase amount."
      );
      return;
    }

    if (!category) {
      setError(
        "Please select a category."
      );
      return;
    }

    if (!transactionDate) {
      setError(
        "Please select a transaction date."
      );
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (editingTransactionId) {
        const { data, error } =
          await supabase
            .from("spend_transactions")
            .update({
              card_id:
                selectedCard?.id ?? null,
              merchant:
                trimmedMerchant,
              amount:
                numericAmount,
              currency_code:
                activeProfile.currency_code,
              category,
              transaction_date:
                transactionDate,
              notes:
                notes.trim() || null,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              editingTransactionId
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "profile_id",
              activeProfile.id
            )
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id"
            )
            .single();

        if (error) {
          throw error;
        }

        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === data.id
              ? data
              : transaction
          )
        );

        setSuccessMessage(
          "Purchase updated successfully."
        );
      } else {
        const { data, error } =
          await supabase
            .from("spend_transactions")
            .insert({
              user_id: user.id,
              profile_id:
                activeProfile.id,
              card_id:
                selectedCard?.id ?? null,
              merchant:
                trimmedMerchant,
              amount:
                numericAmount,
              currency_code:
                activeProfile.currency_code,
              category,
              transaction_date:
                transactionDate,
              notes:
                notes.trim() || null,
            })
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id"
            )
            .single();

        if (error) {
          throw error;
        }

        setTransactions((current) => [
          data,
          ...current,
        ]);

        setSuccessMessage(
          "Purchase recorded successfully."
        );
      }

      resetForm();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : editingTransactionId
            ? "Unable to update this purchase."
            : "Unable to record this purchase."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditTransaction = (
    transaction: SpendTransaction
  ) => {
    setMerchant(transaction.merchant);
    setAmount(
      Number(transaction.amount).toFixed(2)
    );
    setCategory(transaction.category);

    setCardId(
      transaction.card_id ?? ""
    );

    setTransactionDate(
      transaction.transaction_date
    );

    setNotes(transaction.notes ?? "");

    setEditingTransactionId(
      transaction.id
    );

    setError("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteTransaction =
    async (
      transaction: SpendTransaction
    ) => {
      const confirmed = window.confirm(
        `Delete the "${transaction.merchant}" purchase permanently?\n\nThis action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      setDeletingTransactionId(
        transaction.id
      );
      setError("");
      setSuccessMessage("");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (!activeProfile?.id) {
        setError(
          "No active profile is available."
        );
        setDeletingTransactionId(null);
        return;
      }

      const { error: deleteError } =
        await supabase
          .from("spend_transactions")
          .delete()
          .eq(
            "id",
            transaction.id
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "profile_id",
            activeProfile.id
          );

      if (deleteError) {
        console.error(deleteError);

        setError(
          deleteError.message ||
            "Unable to delete this purchase."
        );

        setDeletingTransactionId(null);
        return;
      }

      setTransactions((current) =>
        current.filter(
          (item) =>
            item.id !==
            transaction.id
        )
      );

      if (
        editingTransactionId ===
        transaction.id
      ) {
        resetForm();
      }

      setSuccessMessage(
        "Purchase deleted successfully."
      );

      setDeletingTransactionId(null);
    };

  const formatAmount = (
    value: number
  ) => {
    try {
      return new Intl.NumberFormat(
        undefined,
        {
          style: "currency",
          currency:
            activeProfile?.currency_code ??
            "INR",
          maximumFractionDigits: 2,
        }
      ).format(value);
    } catch {
      return `${
        activeProfile?.currency_code ?? ""
      } ${value.toFixed(2)}`;
    }
  };

  const getCardName = (
    transaction: SpendTransaction
  ) => {
    if (!transaction.card_id) {
      return "No card";
    }

    const card = cards.find(
      (item) =>
        item.id ===
        transaction.card_id
    );

    return card?.name ?? "Card";
  };

  if (
    loadingProfiles ||
    loadingCards ||
    loadingTransactions
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading spend tracking...
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
              Select a profile before tracking spending.
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
        {/* Header */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            {activeProfile.name} profile
          </p>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Track Spend
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                Record purchases against your cards and build a clear
                spending history for this profile.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Profile spend tracked
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatAmount(totalSpend)}
              </p>
            </div>
          </div>
        </section>

        {/* Add / Edit Purchase */}
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              {editingTransactionId
                ? "Edit purchase"
                : "Record a purchase"}
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              {editingTransactionId
                ? "Update the selected purchase and save your changes."
                : `This purchase will be recorded in your ${activeProfile.name} profile.`}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {/* Merchant */}
              <div>
                <label
                  htmlFor="merchant"
                  className="mb-2 block text-sm font-semibold"
                >
                  Merchant
                </label>

                <input
                  id="merchant"
                  type="text"
                  value={merchant}
                  onChange={(event) =>
                    setMerchant(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Amazon"
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-semibold"
                >
                  Amount ({activeProfile.currency_code})
                </label>

                <input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
              </div>

              {/* Card */}
              <div>
                <label
                  htmlFor="card"
                  className="mb-2 block text-sm font-semibold"
                >
                  Card used
                </label>

                <select
                  id="card"
                  value={cardId}
                  onChange={(event) =>
                    setCardId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                >
                  <option value="">
                    No card / cash
                  </option>

                  {cards.map((card) => (
                    <option
                      key={card.id}
                      value={card.id}
                    >
                      {card.name}
                    </option>
                  ))}
                </select>

                {cards.length === 0 && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    You don't have any cards in this profile yet.
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold"
                >
                  Category
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                >
                  {CATEGORIES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="transaction-date"
                  className="mb-2 block text-sm font-semibold"
                >
                  Purchase date
                </label>

                <input
                  id="transaction-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) =>
                    setTransactionDate(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-semibold"
                >
                  Notes
                  <span className="ml-2 font-normal text-[var(--muted)]">
                    Optional
                  </span>
                </label>

                <input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder="Optional note"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                {successMessage}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
              {editingTransactionId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
                >
                  Cancel edit
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {saving
                  ? editingTransactionId
                    ? "Saving changes..."
                    : "Saving purchase..."
                  : editingTransactionId
                    ? "Save changes"
                    : "Record purchase"}
              </button>
            </div>
          </form>
        </section>

        {/* Recent Purchases */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Recent purchases
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Your latest purchases in the{" "}
              {activeProfile.name} profile.
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-sm font-medium">
                No purchases recorded yet.
              </p>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Record your first purchase above to start building your
                spending history.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(
                (transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {transaction.merchant}
                        </h3>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {transaction.category} ·{" "}
                          {getCardName(
                            transaction
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {transaction.transaction_date}
                        </p>

                        {transaction.notes && (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            {transaction.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="shrink-0 text-base font-semibold">
                          {formatAmount(
                            Number(
                              transaction.amount
                            )
                          )}
                        </p>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingTransactionId(
                                (
                                  current
                                ) =>
                                  current ===
                                  transaction.id
                                    ? null
                                    : transaction.id
                                )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[var(--muted)] transition hover:bg-slate-100 hover:text-[var(--foreground)] dark:hover:bg-slate-800"
                            aria-label={`Options for ${transaction.merchant}`}
                          >
                            ⋮
                          </button>

                          {editingTransactionId ===
                            transaction.id && (
                            <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditTransaction(
                                    transaction
                                  )
                                }
                                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Edit purchase
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteTransaction(
                                    transaction
                                  )
                                }
                                disabled={
                                  deletingTransactionId ===
                                  transaction.id
                                }
                                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
                              >
                                {deletingTransactionId ===
                                transaction.id
                                  ? "Deleting..."
                                  : "Delete purchase"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

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
