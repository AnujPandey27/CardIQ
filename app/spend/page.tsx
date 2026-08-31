"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";
import { useCardIQProfile } from "@/components/ProfileProvider";
import {
  calculateRewardsForTransactions,
  RewardHistoryTransaction,
  RewardRule,
} from "@/lib/rewards";

type Card = {
  id: string;
  name: string;
  bank: string;
  network: string;
  variant: string | null;
  card_last_four: string | null;
};

type CardAccountSettings = {
  card_id: string;
  is_lifetime_free: boolean;
  anniversary_month: number | null;
  anniversary_year: number | null;
  annual_fee_waiver_threshold: number | null;
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

  mcc: number | null;
  mcc_description: string | null;
  classification_method: string | null;
  payment_route: string | null;

  transaction_type: string | null;
  source_type: string | null;
  source_transaction_id: string | null;

  emi_status: string | null;

  reward_adjustment_amount: number | null;
  fee_waiver_adjustment_amount: number | null;
  original_transaction_id: string | null;
};

type SelectedCardOption =
  | "all"
  | string;

type PeriodOption =
  | "this_month"
  | "last_month"
  | "anniversary";

type CategorySummary = {
  category: string;
  amount: number;
};

type RewardBucketSummary = {
  bucket: string;
  earned: number;
  cap: number | null;
  periodKey: string | null;
};

type CardSummary = {
  card: Card;

  monthSpend: number;
  transactionCount: number;

  categories: CategorySummary[];

  rewardBuckets: RewardBucketSummary[];

  rewardTotal: number;

  anniversarySpend: number;

  waiverThreshold:
    | number
    | null;

  waiverRemaining:
    | number
    | null;

  waiverProgress:
    | number
    | null;

  isLifetimeFree: boolean;
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
  "Insurance",
  "Education",
  "Medical",
  "Taxes",
  "Government",
  "Rent",
  "Other",
];

const PAYMENT_ROUTES = [
  "Merchant website",
  "Merchant app",
  "Paytm",
  "PhonePe",
  "Google Pay",
  "Amazon Pay",
  "Bank app",
  "UPI",
  "POS / physical store",
  "Other",
];

const TRANSACTION_TYPES = [
  {
    value: "purchase",
    label: "Purchase",
  },
  {
    value: "refund",
    label: "Refund",
  },
  {
    value: "reversal",
    label: "Reversal",
  },
] as const;

const EMI_OPTIONS = [
  {
    value: "regular",
    label: "Regular",
  },
  {
    value: "emi",
    label: "EMI",
  },
  {
    value: "no_cost_emi",
    label: "No-Cost EMI",
  },
] as const;

function startOfMonth(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function endOfMonth(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

function getDateValue(
  value: string
): Date {
  return new Date(
    `${value}T00:00:00`
  );
}

function inRange(
  date: Date,
  start: Date,
  end: Date
): boolean {
  return (
    date.getTime() >=
      start.getTime() &&
    date.getTime() <=
      end.getTime()
  );
}

function getAnniversaryPeriod(
  settings: CardAccountSettings,
  referenceDate: Date
): {
  start: Date;
  end: Date;
} | null {
  if (
    !settings.anniversary_month ||
    !settings.anniversary_year
  ) {
    return null;
  }

  const anniversaryMonth =
    settings.anniversary_month;

  let year =
    referenceDate.getFullYear();

  if (
    referenceDate.getMonth() + 1 <
    anniversaryMonth
  ) {
    year -= 1;
  }

  /*
   * Do not begin before the card's recorded issue year.
   */
  year = Math.max(
    year,
    settings.anniversary_year
  );

  const start =
    new Date(
      year,
      anniversaryMonth - 1,
      1
    );

  const end =
    new Date(
      year + 1,
      anniversaryMonth - 1,
      0,
      23,
      59,
      59,
      999
    );

  return {
    start,
    end,
  };
}

function getSelectedMonthRange(
  period: PeriodOption,
  referenceDate: Date
): {
  start: Date;
  end: Date;
} {
  if (
    period ===
    "last_month"
  ) {
    const lastMonth =
      new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - 1,
        1
      );

    return {
      start:
        startOfMonth(
          lastMonth
        ),
      end:
        endOfMonth(
          lastMonth
        ),
    };
  }

  return {
    start:
      startOfMonth(
        referenceDate
      ),
    end:
      endOfMonth(
        referenceDate
      ),
  };
}

function getNetSpend(
  transactions: SpendTransaction[]
): number {
  return transactions.reduce(
    (
      total,
      transaction
    ) => {
      const amount =
        Math.abs(
          Number(
            transaction.amount
          )
        );

      const type =
        transaction.transaction_type ??
        "purchase";

      if (
        type ===
          "refund" ||
        type ===
          "reversal"
      ) {
        return (
          total - amount
        );
      }

      if (
        type ===
          "fee" ||
        type ===
          "payment" ||
        type ===
          "cash_withdrawal"
      ) {
        return total;
      }

      return (
        total + amount
      );
    },
    0
  );
}

function getNetFeeWaiverSpend(
  transactions: SpendTransaction[]
): number {
  return transactions.reduce(
    (
      total,
      transaction
    ) => {
      const explicitAdjustment =
        transaction.fee_waiver_adjustment_amount;

      if (
        explicitAdjustment !==
          null &&
        explicitAdjustment !==
          undefined
      ) {
        return (
          total +
          Number(
            explicitAdjustment
          )
        );
      }

      const amount =
        Math.abs(
          Number(
            transaction.amount
          )
        );

      const type =
        transaction.transaction_type ??
        "purchase";

      if (
        type ===
          "refund" ||
        type ===
          "reversal"
      ) {
        return (
          total - amount
        );
      }

      if (
        type ===
          "purchase" ||
        type ===
          "other"
      ) {
        return (
          total + amount
        );
      }

      return total;
    },
    0
  );
}

function formatMonthLabel(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatDateLabel(
  value: string
): string {
  const date =
    getDateValue(
      value
    );

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function buildCsvRows(
  content: string
): string[][] {
  const rows: string[][] =
    [];

  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (
    let index = 0;
    index < content.length;
    index += 1
  ) {
    const character =
      content[index];

    if (
      character === '"'
    ) {
      if (
        quoted &&
        content[index + 1] ===
          '"'
      ) {
        current += '"';
        index += 1;
      } else {
        quoted =
          !quoted;
      }

      continue;
    }

    if (
      character === "," &&
      !quoted
    ) {
      row.push(
        current.trim()
      );
      current = "";
      continue;
    }

    if (
      (character === "\n" ||
        character === "\r") &&
      !quoted
    ) {
      if (
        character === "\r" &&
        content[index + 1] ===
          "\n"
      ) {
        index += 1;
      }

      if (
        current ||
        row.length
      ) {
        row.push(
          current.trim()
        );
        current = "";
        rows.push(row);
        row = [];
      }

      continue;
    }

    current +=
      character;
  }

  if (
    current ||
    row.length
  ) {
    row.push(
      current.trim()
    );

    rows.push(row);
  }

  return rows;
}

function normalizeHeader(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );
}

function findColumn(
  headers: string[],
  candidates: string[]
): number {
  const normalized =
    headers.map(
      normalizeHeader
    );

  for (
    const candidate of candidates
  ) {
    const index =
      normalized.indexOf(
        normalizeHeader(
          candidate
        )
      );

    if (index >= 0) {
      return index;
    }
  }

  return -1;
}

function parseAmount(
  value: string
): number | null {
  if (!value) {
    return null;
  }

  const cleaned =
    value
      .replace(/,/g, "")
      .replace(
        /[₹$€£¥\s]/g,
        ""
      )
      .replace(
        /[()]/g,
        ""
      )
      .trim();

  const number =
    Number(cleaned);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function parseDate(
  value: string
): string | null {
  const input =
    value.trim();

  if (!input) {
    return null;
  }

  const iso =
    input.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
    );

  if (iso) {
    return `${iso[1]}-${String(
      Number(
        iso[2]
      )
    ).padStart(
      2,
      "0"
    )}-${String(
      Number(
        iso[3]
      )
    ).padStart(
      2,
      "0"
    )}`;
  }

  const dmy =
    input.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
    );

  if (dmy) {
    return `${dmy[3]}-${String(
      Number(
        dmy[2]
      )
    ).padStart(
      2,
      "0"
    )}-${String(
      Number(
        dmy[1]
      )
    ).padStart(
      2,
      "0"
    )}`;
  }

  const parsed =
    new Date(
      input
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1
  ).padStart(
    2,
    "0"
  )}-${String(
    parsed.getDate()
  ).padStart(
    2,
    "0"
  )}`;
}

export default function SpendPage() {
  const router =
    useRouter();

  const {
    activeProfile,
    loadingProfiles,
  } =
    useCardIQProfile();

  const [cards, setCards] =
    useState<Card[]>([]);

  const [
    transactions,
    setTransactions,
  ] =
    useState<
      SpendTransaction[]
    >([]);

  const [settings, setSettings] =
    useState<
      Record<
        string,
        CardAccountSettings
      >
    >({});

  const [rewardRules, setRewardRules] =
    useState<
      RewardRule[]
    >([]);

  const [
    selectedCards,
    setSelectedCards,
  ] = useState<
    SelectedCardOption[]
  >(["all"]);

  const [
    period,
    setPeriod,
  ] =
    useState<PeriodOption>(
      "this_month"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  /*
   * Manual entry state.
   */
  const [showAddForm, setShowAddForm] =
    useState(false);

  const [merchant, setMerchant] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [cardId, setCardId] =
    useState("");

  const [category, setCategory] =
    useState("Shopping");

  const [
    transactionDate,
    setTransactionDate,
  ] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [mcc, setMcc] =
    useState("");

  const [
    paymentRoute,
    setPaymentRoute,
  ] =
    useState("");

  const [
    transactionType,
    setTransactionType,
  ] = useState<
    (typeof TRANSACTION_TYPES)[number]["value"]
  >("purchase");

  const [
    emiStatus,
    setEmiStatus,
  ] = useState<
    (typeof EMI_OPTIONS)[number]["value"]
  >("regular");

  const [
    editingTransactionId,
    setEditingTransactionId,
  ] =
    useState<
      string | null
    >(null);

  const [
    savingTransaction,
    setSavingTransaction,
  ] =
    useState(false);

  /*
   * Import state.
   */
  const [
    showImport,
    setShowImport,
  ] =
    useState(false);

  const [
    importCardId,
    setImportCardId,
  ] =
    useState("");

  const [
    importRows,
    setImportRows,
  ] =
    useState<
      Array<{
        date: string;
        merchant: string;
        amount: number;
        category: string;
        mcc: number | null;
        emiStatus:
          | "regular"
          | "emi"
          | "no_cost_emi";
        transactionType:
          | "purchase"
          | "refund"
          | "reversal";
        reference:
          | string
          | null;
        duplicate: boolean;
        selected: boolean;
      }>
    >([]);

  const importInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    importing,
    setImporting,
  ] = useState(false);

  const referenceDate =
    useMemo(
      () => new Date(),
      []
    );

  const selectedCardIds =
    useMemo(() => {
      if (
        selectedCards.includes(
          "all"
        )
      ) {
        return cards.map(
          (card) =>
            card.id
        );
      }

      return selectedCards.filter(
        (
          value
        ): value is string =>
          value !==
          "all"
      );
    }, [
      cards,
      selectedCards,
    ]);

  const selectedCardObjects =
    useMemo(
      () =>
        cards.filter(
          (card) =>
            selectedCardIds.includes(
              card.id
            )
        ),
      [
        cards,
        selectedCardIds,
      ]
    );

  const selectedTransactions =
    useMemo(
      () =>
        transactions.filter(
          (
            transaction
          ) =>
            transaction.card_id !==
              null &&
            selectedCardIds.includes(
              transaction.card_id
            )
        ),
      [
        transactions,
        selectedCardIds,
      ]
    );

  const visibleTransactions =
    useMemo(() => {
      const range =
        getSelectedMonthRange(
          period,
          referenceDate
        );

      return selectedTransactions.filter(
        (
          transaction
        ) => {
          const date =
            getDateValue(
              transaction.transaction_date
            );

          return inRange(
            date,
            range.start,
            range.end
          );
        }
      );
    }, [
      selectedTransactions,
      period,
      referenceDate,
    ]);

  const totalSpend =
    useMemo(
      () =>
        getNetSpend(
          visibleTransactions
        ),
      [visibleTransactions]
    );

  const categorySummary =
    useMemo(() => {
      const map =
        new Map<
          string,
          number
        >();

      for (
        const transaction of
          visibleTransactions
      ) {
        const type =
          transaction.transaction_type ??
          "purchase";

        const amount =
          Math.abs(
            Number(
              transaction.amount
            )
          );

        if (
          type ===
            "fee" ||
          type ===
            "payment" ||
          type ===
            "cash_withdrawal"
        ) {
          continue;
        }

        const signedAmount =
          type ===
              "refund" ||
            type ===
              "reversal"
            ? -amount
            : amount;

        const existing =
          map.get(
            transaction.category
          ) ?? 0;

        map.set(
          transaction.category,
          existing +
            signedAmount
        );
      }

      return [
        ...map.entries(),
      ]
        .map(
          ([
            category,
            amount,
          ]) => ({
            category,
            amount,
          })
        )
        .sort(
          (a, b) =>
            b.amount -
            a.amount
        );
    }, [visibleTransactions]);

  const cardSummaries =
    useMemo(() => {
      const summaryMap =
        new Map<
          string,
          CardSummary
        >();

      for (
        const card of
          selectedCardObjects
      ) {
        const cardTransactions =
          transactions.filter(
            (
              transaction
            ) =>
              transaction.card_id ===
              card.id
          );

        const monthRange =
          getSelectedMonthRange(
            period,
            referenceDate
          );

        const monthTransactions =
          cardTransactions.filter(
            (
              transaction
            ) => {
              const date =
                getDateValue(
                  transaction.transaction_date
                );

              return inRange(
                date,
                monthRange.start,
                monthRange.end
              );
            }
          );

        const cardRewardTransactions: RewardHistoryTransaction[] =
          cardTransactions.map(
            (
              transaction
            ) => ({
              id:
                transaction.id,

              amount:
                Math.abs(
                  Number(
                    transaction.amount
                  )
                ),

              category:
                transaction.category,

              merchant:
                transaction.merchant,

              transactionDate:
                transaction.transaction_date,

              mcc:
                transaction.mcc,

              paymentRoute:
                transaction.payment_route,

              emiStatus:
                transaction.emi_status as
                  | "regular"
                  | "emi"
                  | "no_cost_emi"
                  | undefined,

              transactionType:
                transaction.transaction_type as
                  | "purchase"
                  | "refund"
                  | "reversal"
                  | "fee"
                  | "payment"
                  | "cash_withdrawal"
                  | "other"
                  | undefined,

              rewardAdjustmentAmount:
                transaction.reward_adjustment_amount,

              card: {
                bank:
                  card.bank,

                name:
                  card.name,

                variant:
                  card.variant,
              },
            })
          );

        const rewardResults =
          calculateRewardsForTransactions(
            cardRewardTransactions,
            rewardRules
          );

        const rewardByTransaction =
          new Map(
            rewardResults.map(
              (
                result
              ) => [
                result.transactionId,
                result,
              ]
            )
          );

        const monthlyRewardResults =
          monthTransactions
            .map(
              (
                transaction
              ) =>
                rewardByTransaction.get(
                  transaction.id
                )
            )
            .filter(
              Boolean
            );

        const rewardTotal =
          monthlyRewardResults.reduce(
            (
              total,
              result
            ) =>
              total +
              Number(
                result?.rewardAmount ??
                  0
              ),
            0
          );

        const bucketMap =
          new Map<
            string,
            RewardBucketSummary
          >();

        for (
          const result of
            monthlyRewardResults
        ) {
          if (
            !result?.rewardBucket
          ) {
            continue;
          }

          const key =
            result.periodKey ??
            result.rewardBucket;

          const current =
            bucketMap.get(
              key
            );

          const matchingRule =
            rewardRules.find(
              (
                rule
              ) =>
                rule.id ===
                result.rewardRuleId
            );

          bucketMap.set(
            key,
            {
              bucket:
                result.rewardBucket,

              earned:
                (
                  current?.earned ??
                  0
                ) +
                Number(
                  result.rewardAmount
                ),

              cap:
                matchingRule?.cap_amount ??
                current?.cap ??
                null,

              periodKey:
                result.periodKey,
            }
          );
        }

        const categories =
          new Map<
            string,
            number
          >();

        for (
          const transaction of
            monthTransactions
        ) {
          const type =
            transaction.transaction_type ??
            "purchase";

          if (
            type ===
              "fee" ||
            type ===
              "payment" ||
            type ===
              "cash_withdrawal"
          ) {
            continue;
          }

          const amount =
            Math.abs(
              Number(
                transaction.amount
              )
            );

          const signedAmount =
            type ===
                "refund" ||
              type ===
                "reversal"
              ? -amount
              : amount;

          categories.set(
            transaction.category,
            (
              categories.get(
                transaction.category
              ) ?? 0
            ) +
              signedAmount
          );
        }

        const anniversarySetting =
          settings[
            card.id
          ];

        const anniversaryPeriod =
          anniversarySetting
            ? getAnniversaryPeriod(
                anniversarySetting,
                referenceDate
              )
            : null;

        const anniversaryTransactions =
          anniversaryPeriod
            ? cardTransactions.filter(
                (
                  transaction
                ) => {
                  const date =
                    getDateValue(
                      transaction.transaction_date
                    );

                  return inRange(
                    date,
                    anniversaryPeriod.start,
                    anniversaryPeriod.end
                  );
                }
              )
            : [];

        const anniversarySpend =
          getNetFeeWaiverSpend(
            anniversaryTransactions
          );

        const threshold =
          anniversarySetting?.annual_fee_waiver_threshold ??
          null;

        const remaining =
          threshold !== null
            ? Math.max(
                0,
                threshold -
                  anniversarySpend
              )
            : null;

        const progress =
          threshold !== null &&
          threshold >
            0
            ? Math.min(
                100,
                (
                  anniversarySpend /
                  threshold
                ) *
                  100
              )
            : null;

        summaryMap.set(
          card.id,
          {
            card,

            monthSpend:
              getNetSpend(
                monthTransactions
              ),

            transactionCount:
              monthTransactions.length,

            categories:
              [
                ...categories.entries(),
              ]
                .map(
                  ([
                    category,
                    amount,
                  ]) => ({
                    category,
                    amount,
                  })
                )
                .sort(
                  (a, b) =>
                    b.amount -
                    a.amount
                ),

            rewardBuckets:
              [
                ...bucketMap.values(),
              ],

            rewardTotal,

            anniversarySpend,

            waiverThreshold:
              threshold,

            waiverRemaining:
              remaining,

            waiverProgress:
              progress,

            isLifetimeFree:
              Boolean(
                anniversarySetting?.is_lifetime_free
              ),
          }
        );
      }

      return [
        ...summaryMap.values(),
      ];
    }, [
      selectedCardObjects,
      transactions,
      rewardRules,
      settings,
      period,
      referenceDate,
    ]);

  useEffect(() => {
    const loadData =
      async () => {
        if (
          loadingProfiles
        ) {
          return;
        }

        if (
          !activeProfile?.id
        ) {
          setLoading(
            false
          );
          return;
        }

        setLoading(
          true
        );

        const supabase =
          createClient();

        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          router.push(
            "/login"
          );
          return;
        }

        const [
          cardsResult,
          transactionsResult,
          settingsResult,
          rulesResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "cards"
              )
              .select(
                "id, name, bank, network, variant, card_last_four"
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
                "created_at",
                {
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "spend_transactions"
              )
              .select(
                "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id, emi_status, reward_adjustment_amount, fee_waiver_adjustment_amount, original_transaction_id"
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
                  ascending:
                    false,
                }
              )
              .limit(
                500
              ),

            supabase
              .from(
                "card_account_settings"
              )
              .select(
                "card_id, is_lifetime_free, anniversary_month, anniversary_year, annual_fee_waiver_threshold"
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
              .from(
                "reward_rules"
              )
              .select(
                "*"
              )
              .order(
                "priority",
                {
                  ascending:
                    false,
                }
              ),
          ]);

        if (
          cardsResult.error
        ) {
          setError(
            cardsResult.error.message
          );
        } else {
          setCards(
            (cardsResult.data ??
              []) as Card[]
          );
        }

        if (
          transactionsResult.error
        ) {
          setError(
            transactionsResult.error.message
          );
        } else {
          setTransactions(
            (transactionsResult.data ??
              []) as SpendTransaction[]
          );
        }

        if (
          settingsResult.error
        ) {
          /*
           * Settings may not exist for older cards.
           * That is not fatal.
           */
          console.error(
            "Card settings load error:",
            settingsResult.error
          );
        } else {
          const map: Record<
            string,
            CardAccountSettings
          > = {};

          for (
            const setting of
              settingsResult.data ??
              []
          ) {
            map[
              setting.card_id
            ] =
              setting as CardAccountSettings;
          }

          setSettings(
            map
          );
        }

        if (
          rulesResult.error
        ) {
          setError(
            rulesResult.error.message
          );
        } else {
          setRewardRules(
            (rulesResult.data ??
              []) as RewardRule[]
          );
        }

        setLoading(
          false
        );
      };

    loadData();
  }, [
    activeProfile?.id,
    loadingProfiles,
    router,
  ]);

  useEffect(() => {
    if (
      cards.length > 0 &&
      importCardId === ""
    ) {
      setImportCardId(
        cards[0].id
      );
    }

    if (
      cards.length > 0 &&
      cardId === ""
    ) {
      setCardId(
        cards[0].id
      );
    }
  }, [
    cards,
    importCardId,
    cardId,
  ]);

  const toggleCard =
    (
      id: string
    ) => {
      setSelectedCards(
        (
          current
        ) => {
          if (
            id ===
            "all"
          ) {
            return ["all"];
          }

          const withoutAll =
            current.filter(
              (
                value
              ) =>
                value !==
                "all"
            );

          if (
            withoutAll.includes(
              id
            )
          ) {
            const next =
              withoutAll.filter(
                (
                  value
                ) =>
                  value !==
                  id
              );

            return next.length
              ? next
              : ["all"];
          }

          return [
            ...withoutAll,
            id,
          ];
        }
      );
    };

  const resetManualForm =
    () => {
      setMerchant("");
      setAmount("");
      setCategory(
        "Shopping"
      );
      setCardId(
        cards[0]?.id ??
          ""
      );
      setTransactionDate(
        new Date()
          .toISOString()
          .slice(
            0,
            10
          )
      );
      setMcc("");
      setPaymentRoute("");
      setTransactionType(
        "purchase"
      );
      setEmiStatus(
        "regular"
      );
      setEditingTransactionId(
        null
      );
    };

  const handleManualSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setError("");
      setSuccessMessage("");

      if (
        !activeProfile?.id
      ) {
        setError(
          "No active profile is available."
        );
        return;
      }

      const trimmedMerchant =
        merchant.trim();

      const numericAmount =
        Number(amount);

      if (
        !trimmedMerchant
      ) {
        setError(
          "Please enter the merchant."
        );
        return;
      }

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <=
          0
      ) {
        setError(
          "Please enter a valid amount."
        );
        return;
      }

      if (
        !cardId
      ) {
        setError(
          "Please select a card."
        );
        return;
      }

      const supabase =
        createClient();

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push(
          "/login"
        );
        return;
      }

      setSavingTransaction(
        true
      );

      try {
        const payload = {
          user_id:
            user.id,

          profile_id:
            activeProfile.id,

          card_id:
            cardId,

          merchant:
            trimmedMerchant,

          merchant_raw:
            trimmedMerchant,

          amount:
            numericAmount,

          original_transaction_amount:
            numericAmount,

          currency_code:
            activeProfile.currency_code,

          category,

          mcc:
            mcc
              ? Number(
                  mcc
                )
              : null,

          payment_route:
            paymentRoute ||
            null,

          transaction_type:
            transactionType,

          emi_status:
            emiStatus,

          classification_method:
            mcc
              ? "mcc"
              : "manual",

          source_type:
            "manual",

          transaction_date:
            transactionDate,
        };

        if (
          editingTransactionId
        ) {
          const {
            data,
            error:
              updateError,
          } =
            await supabase
              .from(
                "spend_transactions"
              )
              .update(
                payload
              )
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
                "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id, emi_status, reward_adjustment_amount, fee_waiver_adjustment_amount, original_transaction_id"
              )
              .single();

          if (
            updateError
          ) {
            throw updateError;
          }

          setTransactions(
            (
              current
            ) =>
              current.map(
                (
                  transaction
                ) =>
                  transaction.id ===
                  data.id
                    ? (data as SpendTransaction)
                    : transaction
              )
          );

          setSuccessMessage(
            "Transaction updated."
          );
        } else {
          const {
            data,
            error:
              insertError,
          } =
            await supabase
              .from(
                "spend_transactions"
              )
              .insert(
                payload
              )
              .select(
                "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id, emi_status, reward_adjustment_amount, fee_waiver_adjustment_amount, original_transaction_id"
              )
              .single();

          if (
            insertError
          ) {
            throw insertError;
          }

          setTransactions(
            (
              current
            ) => [
              data as SpendTransaction,
              ...current,
            ]
          );

          setSuccessMessage(
            "Transaction recorded."
          );
        }

        resetManualForm();
        setShowAddForm(
          false
        );
      } catch (err) {
        console.error(
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to save the transaction."
        );
      } finally {
        setSavingTransaction(
          false
        );
      }
    };

  const handleImportFile =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      setError("");
      setSuccessMessage("");

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.name
          .toLowerCase()
          .endsWith(".csv")
      ) {
        setError(
          "CSV import is currently available. PDF and Excel will use the secure document-processing layer."
        );

        event.target.value =
          "";

        return;
      }

      if (
        !importCardId
      ) {
        setError(
          "Select the statement card first."
        );

        event.target.value =
          "";

        return;
      }

      try {
        const content =
          await file.text();

        const rows =
          buildCsvRows(
            content
          );

        if (
          rows.length <
          2
        ) {
          throw new Error(
            "The statement does not contain enough rows."
          );
        }

        const headers =
          rows[0];

        const merchantIndex =
          findColumn(
            headers,
            [
              "merchant",
              "merchant name",
              "description",
              "transaction description",
              "narration",
              "particulars",
            ]
          );

        const amountIndex =
          findColumn(
            headers,
            [
              "amount",
              "transaction amount",
              "debit",
              "spend",
            ]
          );

        const dateIndex =
          findColumn(
            headers,
            [
              "date",
              "transaction date",
              "txn date",
              "posted date",
            ]
          );

        const categoryIndex =
          findColumn(
            headers,
            [
              "category",
            ]
          );

        const mccIndex =
          findColumn(
            headers,
            [
              "mcc",
              "merchant category code",
            ]
          );

        const referenceIndex =
          findColumn(
            headers,
            [
              "reference",
              "reference number",
              "transaction id",
              "transaction reference",
              "rrn",
              "txn id",
            ]
          );

        const typeIndex =
          findColumn(
            headers,
            [
              "transaction type",
              "type",
            ]
          );

        const emiIndex =
          findColumn(
            headers,
            [
              "emi status",
              "emi type",
              "emi",
              "installment type",
            ]
          );

        if (
          merchantIndex <
          0 ||
          amountIndex <
          0 ||
          dateIndex <
          0
        ) {
          throw new Error(
            "CardIQ could not identify merchant, amount and date columns in this statement."
          );
        }

        const existing =
          transactions.filter(
            (
              transaction
            ) =>
              transaction.card_id ===
              importCardId
          );

        const mapped =
          rows
            .slice(1)
            .filter(
              (
                row
              ) =>
                row.some(
                  (
                    value
                  ) =>
                    value.trim()
                )
            )
            .map(
              (
                row
              ) => {
                const merchant =
                  row[
                    merchantIndex
                  ]?.trim() ??
                  "";

                const amount =
                  Math.abs(
                    Number(
                      parseAmount(
                        row[
                          amountIndex
                        ] ??
                          ""
                      ) ??
                        0
                    )
                  );

                const date =
                  parseDate(
                    row[
                      dateIndex
                    ] ??
                      ""
                  ) ??
                  "";

                const rawCategory =
                  categoryIndex >=
                  0
                    ? row[
                        categoryIndex
                      ]?.trim()
                    : "";

                const inferredCategory =
                  rawCategory ||
                  (
                    merchant
                      .toLowerCase()
                      .includes(
                        "swiggy"
                      ) ||
                    merchant
                      .toLowerCase()
                      .includes(
                        "zomato"
                      ) ||
                    merchant
                      .toLowerCase()
                      .includes(
                        "eazydiner"
                      )
                      ? "Dining"
                      : merchant
                          .toLowerCase()
                          .includes(
                            "amazon"
                          ) ||
                        merchant
                          .toLowerCase()
                          .includes(
                            "flipkart"
                          ) ||
                        merchant
                          .toLowerCase()
                          .includes(
                            "myntra"
                          )
                        ? "Shopping"
                        : "Other"
                  );

                const parsedMcc =
                  mccIndex >=
                  0
                    ? Number(
                        row[
                          mccIndex
                        ]
                      )
                    : null;

                const normalizedMcc =
                  Number.isInteger(
                    parsedMcc
                  )
                    ? parsedMcc
                    : null;

                const rawType =
                  typeIndex >=
                  0
                    ? (
                        row[
                          typeIndex
                        ] ??
                        ""
                      ).toLowerCase()
                    : "";

                const normalizedType =
                  rawType.includes(
                    "refund"
                  )
                    ? "refund"
                    : rawType.includes(
                          "reversal"
                        )
                      ? "reversal"
                      : "purchase";

                const reference =
                  referenceIndex >=
                  0
                    ? row[
                        referenceIndex
                      ]?.trim() ||
                      null
                    : null;

                const normalizedEmi =
                  emiIndex >=
                  0
                    ? (
                        row[
                          emiIndex
                        ] ??
                        ""
                      )
                        .toLowerCase()
                        .includes(
                          "no cost"
                        )
                      ? "no_cost_emi"
                      : (
                            row[
                              emiIndex
                            ] ??
                            ""
                          )
                            .toLowerCase()
                            .includes(
                              "emi"
                            )
                        ? "emi"
                        : "regular"
                    : "regular";

                const duplicate =
                  existing.some(
                    (
                      transaction
                    ) => {
                      const sameReference =
                        reference &&
                        transaction.source_transaction_id ===
                          reference;

                      if (
                        sameReference
                      ) {
                        return true;
                      }

                      return (
                        transaction.merchant
                          .trim()
                          .toLowerCase() ===
                          merchant
                            .trim()
                            .toLowerCase() &&
                        Math.abs(
                          Number(
                            transaction.amount
                          )
                        ) ===
                          amount &&
                        transaction.transaction_date ===
                          date
                      );
                    }
                  );

                return {
                  date,
                  merchant,
                  amount,
                  category:
                    inferredCategory,
                  mcc:
                    normalizedMcc,
                  emiStatus:
                    normalizedEmi as
                      | "regular"
                      | "emi"
                      | "no_cost_emi",
                  transactionType:
                    normalizedType as
                      | "purchase"
                      | "refund"
                      | "reversal",
                  reference,
                  duplicate,
                  selected:
                    !duplicate,
                };
              }
            )
            .filter(
              (
                row
              ) =>
                row.merchant &&
                row.amount >
                  0 &&
                row.date
            );

        setImportRows(
          mapped
        );

        setSuccessMessage(
          `${mapped.length} transactions found. Review before importing.`
        );
      } catch (err) {
        console.error(
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to process the statement."
        );
      } finally {
        event.target.value =
          "";
      }
    };

  const toggleImportRow =
    (
      index: number
    ) => {
      setImportRows(
        (
          current
        ) =>
          current.map(
            (
              row,
              rowIndex
            ) =>
              rowIndex ===
              index
                ? {
                    ...row,
                    selected:
                      row.duplicate
                        ? false
                        : !row.selected,
                  }
                : row
          )
      );
    };

  const importSelected =
    importRows.filter(
      (
        row
      ) =>
        row.selected &&
        !row.duplicate
    );

  const handleImport =
    async () => {
      if (
        !activeProfile?.id ||
        !importCardId
      ) {
        return;
      }

      if (
        importSelected.length ===
        0
      ) {
        setError(
          "Select at least one transaction to import."
        );
        return;
      }

      setImporting(
        true
      );

      setError("");
      setSuccessMessage("");

      try {
        const supabase =
          createClient();

        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          router.push(
            "/login"
          );
          return;
        }

        const payload =
          importSelected.map(
            (
              row
            ) => ({
              user_id:
                user.id,

              profile_id:
                activeProfile.id,

              card_id:
                importCardId,

              merchant:
                row.merchant,

              merchant_raw:
                row.merchant,

              amount:
                row.amount,

              original_transaction_amount:
                row.amount,

              currency_code:
                activeProfile.currency_code,

              category:
                row.category,

              mcc:
                row.mcc,

              classification_method:
                row.mcc
                  ? "mcc"
                  : "statement",

              transaction_type:
                row.transactionType,

              emi_status:
                row.emiStatus,

              source_type:
                "statement_csv",

              source_transaction_id:
                row.reference,

              transaction_date:
                row.date,
            })
          );

        const {
          data,
          error:
            insertError,
        } =
          await supabase
            .from(
              "spend_transactions"
            )
            .insert(
              payload
            )
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id, emi_status, reward_adjustment_amount, fee_waiver_adjustment_amount, original_transaction_id"
            );

        if (
          insertError
        ) {
          throw insertError;
        }

        setTransactions(
          (
            current
          ) => [
            ...((data ??
              []) as SpendTransaction[]),
            ...current,
          ]
        );

        setImportRows(
          (
            current
          ) =>
            current.filter(
              (
                row
              ) =>
                !importSelected.includes(
                  row
                )
            )
        );

        setSuccessMessage(
          `${data?.length ?? 0} transactions imported.`
        );
      } catch (err) {
        console.error(
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to import transactions."
        );
      } finally {
        setImporting(
          false
        );
      }
    };

  const formatAmount = (
    value: number
  ) => {
    try {
      return new Intl.NumberFormat(
        "en-IN",
        {
          style:
            "currency",
          currency:
            activeProfile?.currency_code ??
            "INR",
          maximumFractionDigits: 2,
        }
      ).format(value);
    } catch {
      return `${
        activeProfile?.currency_code ??
        "INR"
      } ${value.toFixed(
        2
      )}`;
    }
  };

  if (
    loadingProfiles ||
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading spend intelligence...
        </p>
      </main>
    );
  }

  if (
    !activeProfile
  ) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <CardIQHeader />

        <div className="mx-auto max-w-4xl px-5 py-10">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <h1 className="text-xl font-semibold">
              No active profile
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Select a profile before tracking spend.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/profiles"
                )
              }
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
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

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        {/* Hero */}
        <section className="mb-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--muted)]">
                {activeProfile.name} profile
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Track Spend
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
                See how your spending is using each card&apos;s rewards,
                accelerated categories and annual fee-waiver thresholds.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowImport(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Import statement
              </button>

              <button
                type="button"
                onClick={() => {
                  resetManualForm();
                  setShowAddForm(
                    true
                  );
                }}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                + Add transaction
              </button>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Cards
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    toggleCard(
                      "all"
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedCards.includes(
                      "all"
                    )
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "border border-[var(--border)] hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  All cards
                </button>

                {cards.map(
                  (
                    card
                  ) => (
                    <button
                      key={
                        card.id
                      }
                      type="button"
                      onClick={() =>
                        toggleCard(
                          card.id
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selectedCards.includes(
                          card.id
                        ) &&
                        !selectedCards.includes(
                          "all"
                        )
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                          : "border border-[var(--border)] hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {
                        card.name
                      }
                      {card.card_last_four
                        ? ` ···· ${card.card_last_four}`
                        : ""}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Period
              </span>

              <select
                value={
                  period
                }
                onChange={(
                  event
                ) =>
                  setPeriod(
                    event.target
                      .value as PeriodOption
                  )
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
              >
                <option value="this_month">
                  This month
                </option>

                <option value="last_month">
                  Last month
                </option>

                <option value="anniversary">
                  Anniversary year
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* KPI */}
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {period ===
              "this_month"
                ? formatMonthLabel(
                    referenceDate
                  )
                : period ===
                    "last_month"
                  ? "Last month"
                  : "Selected cards"}
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatAmount(
                totalSpend
              )}
            </p>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Net tracked spend
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Transactions
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                visibleTransactions.length
              }
            </p>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Across{" "}
              {
                selectedCardObjects.length
              }{" "}
              selected card
              {
                selectedCardObjects.length ===
                1
                  ? ""
                  : "s"
              }
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Categories
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                categorySummary.length
              }
            </p>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Active spending categories
            </p>
          </div>
        </section>

        {/* Category spend */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Spend by category
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              See where your selected cards are being used.
            </p>
          </div>

          {categorySummary.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
              <p className="text-sm text-[var(--muted)]">
                No spend recorded for this period.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categorySummary.map(
                (
                  item
                ) => {
                  const percentage =
                    totalSpend >
                    0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (
                              item.amount /
                              totalSpend
                            ) *
                              100
                          )
                        )
                      : 0;

                  return (
                    <div
                      key={
                        item.category
                      }
                      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">
                          {
                            item.category
                          }
                        </p>

                        <p className="text-sm font-semibold">
                          {formatAmount(
                            item.amount
                          )}
                        </p>
                      </div>

                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-slate-900 dark:bg-white"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* Card intelligence */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Your cards
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Reward and annual-threshold progress is kept separate for every
              card.
            </p>
          </div>

          <div className="space-y-4">
            {cardSummaries.map(
              (
                summary
              ) => {
                const {
                  card,
                } = summary;

                return (
                  <div
                    key={
                      card.id
                    }
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {
                              card.name
                            }
                          </h3>

                          {card.card_last_four && (
                            <span className="text-sm text-[var(--muted)]">
                              ····{" "}
                              {
                                card.card_last_four
                              }
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {
                            card.bank
                          }{" "}
                          ·{" "}
                          {
                            card.variant ??
                            card.network
                          }
                        </p>

                        <p className="mt-3 text-2xl font-bold">
                          {formatAmount(
                            summary.monthSpend
                          )}
                        </p>

                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {period ===
                          "this_month"
                            ? "This month's spend"
                            : period ===
                                "last_month"
                              ? "Last month's spend"
                              : "Spend in selected period"}{" "}
                          ·{" "}
                          {
                            summary.transactionCount
                          }{" "}
                          transaction
                          {
                            summary.transactionCount ===
                            1
                              ? ""
                              : "s"
                          }
                        </p>
                      </div>

                      <div className="w-full max-w-xl">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            Accelerated rewards
                          </p>

                          <p className="text-sm font-bold">
                            {formatAmount(
                              summary.rewardTotal
                            )}
                          </p>
                        </div>

                        {summary.rewardBuckets.length ===
                        0 ? (
                          <div className="rounded-xl bg-[var(--card-muted)] p-4 text-sm text-[var(--muted)]">
                            No accelerated reward bucket has been triggered for
                            this period.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {summary.rewardBuckets.map(
                              (
                                bucket
                              ) => {
                                const progress =
                                  bucket.cap &&
                                  bucket.cap >
                                    0
                                    ? Math.min(
                                        100,
                                        (
                                          bucket.earned /
                                          bucket.cap
                                        ) *
                                          100
                                      )
                                    : null;

                                const remaining =
                                  bucket.cap !==
                                    null &&
                                  bucket.cap >
                                    0
                                    ? Math.max(
                                        0,
                                        bucket.cap -
                                          bucket.earned
                                      )
                                    : null;

                                return (
                                  <div
                                    key={
                                      `${card.id}-${bucket.periodKey ?? bucket.bucket}`
                                    }
                                    className="rounded-xl bg-[var(--card-muted)] p-4"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold">
                                        {
                                          bucket.bucket
                                        }
                                      </p>

                                      <p className="text-sm font-semibold">
                                        {formatAmount(
                                          bucket.earned
                                        )}
                                      </p>
                                    </div>

                                    {progress !==
                                      null && (
                                      <>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                          <div
                                            className="h-full rounded-full bg-slate-900 dark:bg-white"
                                            style={{
                                              width: `${progress}%`,
                                            }}
                                          />
                                        </div>

                                        <div className="mt-2 flex justify-between gap-3 text-xs text-[var(--muted)]">
                                          <span>
                                            {formatAmount(
                                              bucket.earned
                                            )}{" "}
                                            of{" "}
                                            {formatAmount(
                                              bucket.cap ??
                                                0
                                            )}
                                          </span>

                                          <span>
                                            {remaining !==
                                            null
                                              ? remaining >
                                                0
                                                ? `${formatAmount(
                                                    remaining
                                                  )} remaining`
                                                : "Monthly cap reached"
                                              : ""}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[var(--border)] pt-6">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <p className="mb-3 text-sm font-semibold">
                            Card spend categories
                          </p>

                          {summary.categories.length ===
                          0 ? (
                            <p className="text-sm text-[var(--muted)]">
                              No category spend in this period.
                            </p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {summary.categories
                                .slice(
                                  0,
                                  6
                                )
                                .map(
                                  (
                                    item
                                  ) => (
                                    <div
                                      key={
                                        item.category
                                      }
                                      className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2.5"
                                    >
                                      <span className="text-sm text-[var(--muted)]">
                                        {
                                          item.category
                                        }
                                      </span>

                                      <span className="text-sm font-semibold">
                                        {formatAmount(
                                          item.amount
                                        )}
                                      </span>
                                    </div>
                                  )
                                )}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                Annual fee waiver
                              </p>

                              <p className="mt-1 text-xs text-[var(--muted)]">
                                Based on the card&apos;s anniversary period.
                              </p>
                            </div>

                            {summary.isLifetimeFree && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Lifetime Free
                              </span>
                            )}
                          </div>

                          {summary.isLifetimeFree ? (
                            <div className="mt-4 rounded-xl bg-[var(--card-muted)] p-4">
                              <p className="text-sm font-semibold">
                                Renewal fee not applicable
                              </p>

                              <p className="mt-1 text-xs text-[var(--muted)]">
                                This card is marked Lifetime Free.
                              </p>
                            </div>
                          ) : summary.waiverThreshold !==
                            null ? (
                            <div className="mt-4 rounded-xl bg-[var(--card-muted)] p-4">
                              <div className="flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-2xl font-bold">
                                    {formatAmount(
                                      summary.anniversarySpend
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-[var(--muted)]">
                                    of{" "}
                                    {formatAmount(
                                      summary.waiverThreshold
                                    )}{" "}
                                    required
                                  </p>
                                </div>

                                <p className="text-sm font-semibold">
                                  {summary.waiverRemaining !==
                                  null
                                    ? summary.waiverRemaining >
                                      0
                                      ? `${formatAmount(
                                          summary.waiverRemaining
                                        )} remaining`
                                      : "Threshold reached"
                                    : ""}
                                </p>
                              </div>

                              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                  className="h-full rounded-full bg-slate-900 dark:bg-white"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      summary.waiverProgress ??
                                        0
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 rounded-xl bg-[var(--card-muted)] p-4 text-sm text-[var(--muted)]">
                              No annual fee-waiver threshold is configured for
                              this card.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}

            {cardSummaries.length ===
              0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
                <p className="text-sm text-[var(--muted)]">
                  Select at least one card to view its spend.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Import */}
        {showImport && (
          <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Import statement
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Upload a CSV, review the transactions and import only what you
                  need.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowImport(
                    false
                  )
                }
                className="text-sm font-semibold text-[var(--muted)]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label
                  htmlFor="import-card"
                  className="mb-2 block text-sm font-semibold"
                >
                  Statement card
                </label>

                <select
                  id="import-card"
                  value={
                    importCardId
                  }
                  onChange={(
                    event
                  ) =>
                    setImportCardId(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                >
                  {cards.map(
                    (
                      card
                    ) => (
                      <option
                        key={
                          card.id
                        }
                        value={
                          card.id
                        }
                      >
                        {
                          card.name
                        }
                        {card.card_last_four
                          ? ` ···· ${card.card_last_four}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <input
                ref={
                  importInputRef
                }
                type="file"
                accept=".csv,text/csv"
                onChange={
                  handleImportFile
                }
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  importInputRef.current?.click()
                }
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                Choose CSV
              </button>
            </div>

            {importRows.length >
              0 && (
              <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                      <th className="px-4 py-3">
                        Import
                      </th>

                      <th className="px-4 py-3">
                        Date
                      </th>

                      <th className="px-4 py-3">
                        Merchant
                      </th>

                      <th className="px-4 py-3">
                        Category
                      </th>

                      <th className="px-4 py-3">
                        Type
                      </th>

                      <th className="px-4 py-3 text-right">
                        Amount
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {importRows.map(
                      (
                        row,
                        index
                      ) => (
                        <tr
                          key={
                            `${row.date}-${row.merchant}-${index}`
                          }
                          className="border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={
                                row.selected
                              }
                              disabled={
                                row.duplicate
                              }
                              onChange={() =>
                                toggleImportRow(
                                  index
                                )
                              }
                              className="h-4 w-4 rounded"
                            />
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {
                              row.date
                            }
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-medium">
                              {
                                row.merchant
                              }
                            </p>

                            {row.mcc && (
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                MCC{" "}
                                {
                                  row.mcc
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {
                              row.category
                            }
                          </td>

                          <td className="px-4 py-3">
                            <p>
                              {
                                row.transactionType
                              }
                            </p>

                            {row.emiStatus !==
                              "regular" && (
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {row.emiStatus ===
                                "no_cost_emi"
                                  ? "No-Cost EMI"
                                  : "EMI"}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">
                            {formatAmount(
                              row.amount
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {row.duplicate ? (
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                Already recorded
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--muted)]">
                    {
                      importSelected.length
                    }{" "}
                    selected ·{" "}
                    {
                      importRows.filter(
                        (
                          row
                        ) =>
                          row.duplicate
                      ).length
                    }{" "}
                    already recorded
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleImport
                    }
                    disabled={
                      importing ||
                      importSelected.length ===
                        0
                    }
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
                  >
                    {importing
                      ? "Importing..."
                      : `Import ${importSelected.length} transaction${
                          importSelected.length ===
                          1
                            ? ""
                            : "s"
                        }`}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Add transaction */}
        {showAddForm && (
          <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Add transaction
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Add the essentials first. EMI and classification details
                  become part of the reward calculation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(
                    false
                  );
                  resetManualForm();
                }}
                className="text-sm font-semibold text-[var(--muted)]"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={
                handleManualSubmit
              }
              className="mt-6 space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Merchant
                  </label>

                  <input
                    value={
                      merchant
                    }
                    onChange={(
                      event
                    ) =>
                      setMerchant(
                        event.target
                          .value
                      )
                    }
                    placeholder="e.g. Amazon"
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      amount
                    }
                    onChange={(
                      event
                    ) =>
                      setAmount(
                        event.target
                          .value
                      )
                    }
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Card
                  </label>

                  <select
                    value={
                      cardId
                    }
                    onChange={(
                      event
                    ) =>
                      setCardId(
                        event.target
                          .value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                  >
                    {cards.map(
                      (
                        card
                      ) => (
                        <option
                          key={
                            card.id
                          }
                          value={
                            card.id
                          }
                        >
                          {
                            card.name
                          }
                          {card.card_last_four
                            ? ` ···· ${card.card_last_four}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Date
                  </label>

                  <input
                    type="date"
                    value={
                      transactionDate
                    }
                    onChange={(
                      event
                    ) =>
                      setTransactionDate(
                        event.target
                          .value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Category
                  </label>

                  <select
                    value={
                      category
                    }
                    onChange={(
                      event
                    ) =>
                      setCategory(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                  >
                    {CATEGORIES.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Transaction type
                  </label>

                  <select
                    value={
                      transactionType
                    }
                    onChange={(
                      event
                    ) =>
                      setTransactionType(
                        event.target
                          .value as (typeof TRANSACTION_TYPES)[number]["value"]
                      )
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                  >
                    {TRANSACTION_TYPES.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    EMI
                  </label>

                  <select
                    value={
                      emiStatus
                    }
                    onChange={(
                      event
                    ) =>
                      setEmiStatus(
                        event.target
                          .value as (typeof EMI_OPTIONS)[number]["value"]
                      )
                    }
                    disabled={
                      transactionType !==
                      "purchase"
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm disabled:opacity-50"
                  >
                    {EMI_OPTIONS.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Payment route
                  </label>

                  <select
                    value={
                      paymentRoute
                    }
                    onChange={(
                      event
                    ) =>
                      setPaymentRoute(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                  >
                    <option value="">
                      Select route
                    </option>

                    {PAYMENT_ROUTES.map(
                      (
                        route
                      ) => (
                        <option
                          key={
                            route
                          }
                          value={
                            route
                          }
                        >
                          {route}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    MCC
                    <span className="ml-2 font-normal text-[var(--muted)]">
                      Optional
                    </span>
                  </label>

                  <input
                    inputMode="numeric"
                    maxLength={4}
                    value={
                      mcc
                    }
                    onChange={(
                      event
                    ) =>
                      setMcc(
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            4
                          )
                      )
                    }
                    placeholder="5812"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
                  />
                </div>
              </div>

              {(transactionType ===
                "refund" ||
                transactionType ===
                  "reversal") && (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  The refund/reversal will reduce net spend. The Rewards engine
                  will use the linked original transaction when calculating the
                  reward adjustment.
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {
                    error
                  }
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(
                      false
                    );
                    resetManualForm();
                  }}
                  className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingTransaction
                  }
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
                >
                  {savingTransaction
                    ? "Saving..."
                    : "Save transaction"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Recent activity */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Recent activity
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Transactions across your selected cards.
            </p>
          </div>

          {selectedTransactions.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-sm text-[var(--muted)]">
                No transactions recorded yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTransactions
                .slice(
                  0,
                  25
                )
                .map(
                  (
                    transaction
                  ) => {
                    const card =
                      cards.find(
                        (
                          item
                        ) =>
                          item.id ===
                          transaction.card_id
                      );

                    return (
                      <div
                        key={
                          transaction.id
                        }
                        className="flex flex-col gap-2 rounded-xl border border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {
                                transaction.merchant
                              }
                            </p>

                            {transaction.emi_status &&
                              transaction.emi_status !==
                                "regular" && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {transaction.emi_status ===
                                  "no_cost_emi"
                                    ? "No-Cost EMI"
                                    : "EMI"}
                                </span>
                              )}
                          </div>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {
                              transaction.category
                            }{" "}
                            ·{" "}
                            {
                              card?.name
                            }
                            {card?.card_last_four
                              ? ` ···· ${card.card_last_four}`
                              : ""}
                            {" · "}
                            {
                              formatDateLabel(
                                transaction.transaction_date
                              )
                            }
                          </p>

                          {transaction.mcc && (
                            <p className="mt-1 text-[11px] text-[var(--muted)]">
                              MCC{" "}
                              {
                                transaction.mcc
                              }
                              {transaction.payment_route
                                ? ` · ${transaction.payment_route}`
                                : ""}
                            </p>
                          )}
                        </div>

                        <p
                          className={`shrink-0 text-sm font-semibold ${
                            transaction.transaction_type ===
                              "refund" ||
                            transaction.transaction_type ===
                              "reversal"
                              ? "text-amber-700 dark:text-amber-300"
                              : ""
                          }`}
                        >
                          {transaction.transaction_type ===
                              "refund" ||
                          transaction.transaction_type ===
                              "reversal"
                            ? "−"
                            : ""}
                          {formatAmount(
                            Math.abs(
                              Number(
                                transaction.amount
                              )
                            )
                          )}
                        </p>
                      </div>
                    );
                  }
                )}
            </div>
          )}
        </section>

        {/* Messages */}
        {(error ||
          successMessage) && (
          <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-lg dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            ) : (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 shadow-lg dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
                {
                  successMessage
                }
              </div>
            )}
          </div>
        )}

        <footer className="mt-12 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <span>CardIQ</span>
            <span>
              Make every card spend count.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
