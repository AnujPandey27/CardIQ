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

type Card = {
  id: string;
  name: string;
  bank: string;
  network: string;
  variant: string | null;
  card_last_four: string | null;
  connection_type: string | null;
  connection_status: string | null;
  last_synced_at: string | null;
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

  merchant_raw?: string | null;
  mcc?: number | null;
  mcc_description?: string | null;
  classification_method?: string | null;
  payment_route?: string | null;
  transaction_type?: string | null;
  source_type?: string | null;
  source_transaction_id?: string | null;

  emi_status?: string | null;
  emi_principal?: number | null;
  emi_interest_rate?: number | null;
  emi_interest?: number | null;
  emi_processing_fee?: number | null;
  emi_tax?: number | null;
  gst_on_processing_fee?: number | null;
  gst_on_interest?: number | null;
  emi_other_fees?: number | null;
  emi_number?: number | null;
  total_emis?: number | null;
  emi_total_payable?: number | null;
  emi_start_date?: string | null;
  emi_end_date?: string | null;
  original_transaction_amount?: number | null;
  total_transaction_cost?: number | null;

  reward_adjustment_amount?: number | null;
  fee_waiver_adjustment_amount?: number | null;
  original_transaction_id?: string | null;
  transaction_fingerprint?: string | null;
};

type ImportRow = {
  rowNumber: number;

  merchant: string;
  merchantRaw: string;

  amount: number;
  originalTransactionAmount: number;

  transactionDate: string;

  category: string;

  cardId: string;

  sourceTransactionId: string | null;

  transactionType:
    | "purchase"
    | "refund"
    | "reversal"
    | "fee"
    | "payment"
    | "cash_withdrawal"
    | "other";

  paymentRoute: string | null;

  mcc: number | null;

  mccDescription: string | null;

  classificationMethod: string;

  emiStatus:
    | "regular"
    | "emi"
    | "no_cost_emi";

  emiPrincipal: number | null;
  emiInterestRate: number | null;
  emiInterest: number | null;
  emiProcessingFee: number | null;
  gstOnProcessingFee: number | null;
  gstOnInterest: number | null;
  emiOtherFees: number | null;
  emiNumber: number | null;
  totalEmis: number | null;
  emiTotalPayable: number | null;
  emiStartDate: string | null;
  emiEndDate: string | null;
  totalTransactionCost: number | null;

  rawValues: string[];

  duplicate: boolean;
  selected: boolean;
  error: string | null;
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

const EMI_STATUSES = [
  {
    value: "regular",
    label: "Regular purchase",
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
  {
    value: "fee",
    label: "Fee",
  },
  {
    value: "payment",
    label: "Card payment",
  },
  {
    value: "cash_withdrawal",
    label: "Cash withdrawal",
  },
  {
    value: "other",
    label: "Other",
  },
] as const;

const CONNECTION_LABELS: Record<
  string,
  string
> = {
  manual: "Manual",
  statement: "Statement",
  account_aggregator: "Connected",
  api: "Connected",
};

function normalizeHeader(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function normalizeMerchant(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      ""
    );
}

function parseCsvLine(
  line: string
): string[] {
  const values: string[] = [];

  let current = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character = line[index];

    if (character === '"') {
      if (
        insideQuotes &&
        line[index + 1] === '"'
      ) {
        current += '"';
        index += 1;
      } else {
        insideQuotes =
          !insideQuotes;
      }

      continue;
    }

    if (
      character === "," &&
      !insideQuotes
    ) {
      values.push(
        current.trim()
      );
      current = "";
      continue;
    }

    current += character;
  }

  values.push(
    current.trim()
  );

  return values;
}

function parseCsv(
  content: string
): string[][] {
  const cleaned = content
    .replace(/^\uFEFF/, "")
    .replace(
      /\r\n/g,
      "\n"
    )
    .replace(
      /\r/g,
      "\n"
    );

  const rows: string[][] = [];

  let current = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < cleaned.length;
    index += 1
  ) {
    const character =
      cleaned[index];

    if (character === '"') {
      if (
        insideQuotes &&
        cleaned[index + 1] === '"'
      ) {
        current += '""';
        index += 1;
      } else {
        insideQuotes =
          !insideQuotes;
        current += character;
      }

      continue;
    }

    if (
      character === "\n" &&
      !insideQuotes
    ) {
      if (current.trim()) {
        rows.push(
          parseCsvLine(
            current
          )
        );
      }

      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    rows.push(
      parseCsvLine(current)
    );
  }

  return rows;
}

function findColumnIndex(
  headers: string[],
  candidates: string[]
): number {
  const normalizedHeaders =
    headers.map(
      normalizeHeader
    );

  for (const candidate of candidates) {
    const normalizedCandidate =
      normalizeHeader(
        candidate
      );

    const exactIndex =
      normalizedHeaders.indexOf(
        normalizedCandidate
      );

    if (exactIndex >= 0) {
      return exactIndex;
    }
  }

  return -1;
}

function parseAmount(
  raw: string
): number | null {
  if (!raw) {
    return null;
  }

  const value = raw.trim();

  if (!value) {
    return null;
  }

  const isParenthesizedNegative =
    value.startsWith("(") &&
    value.endsWith(")");

  const cleaned = value
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

  if (!cleaned) {
    return null;
  }

  const numeric =
    Number(cleaned);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return null;
  }

  return isParenthesizedNegative
    ? -Math.abs(numeric)
    : numeric;
}

function parseOptionalNumber(
  raw: string
): number | null {
  if (!raw?.trim()) {
    return null;
  }

  return parseAmount(raw);
}

function parseInteger(
  raw: string
): number | null {
  if (!raw?.trim()) {
    return null;
  }

  const numeric =
    Number(
      raw.replace(
        /[^\d.-]/g,
        ""
      )
    );

  if (
    !Number.isInteger(
      numeric
    )
  ) {
    return null;
  }

  return numeric;
}

function parseDate(
  raw: string
): string | null {
  const value =
    raw.trim();

  if (!value) {
    return null;
  }

  const isoMatch =
    value.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
    );

  if (isoMatch) {
    const year =
      Number(
        isoMatch[1]
      );

    const month =
      Number(
        isoMatch[2]
      );

    const day =
      Number(
        isoMatch[3]
      );

    if (
      year >= 1900 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-${String(
        day
      ).padStart(
        2,
        "0"
      )}`;
    }
  }

  const dmyMatch =
    value.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
    );

  if (dmyMatch) {
    const day =
      Number(
        dmyMatch[1]
      );

    const month =
      Number(
        dmyMatch[2]
      );

    const year =
      Number(
        dmyMatch[3]
      );

    if (
      year >= 1900 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-${String(
        day
      ).padStart(
        2,
        "0"
      )}`;
    }
  }

  const parsed =
    new Date(value);

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

function parseBoolean(
  value: string
): boolean {
  return /^(yes|true|y|1)$/i.test(
    value.trim()
  );
}

function normalizeEmiStatus(
  value: string
):
  | "regular"
  | "emi"
  | "no_cost_emi" {
  const normalized =
    normalizeHeader(
      value
    );

  if (
    normalized.includes(
      "nocostemi"
    ) ||
    normalized.includes(
      "nocost"
    )
  ) {
    return "no_cost_emi";
  }

  if (
    normalized === "emi" ||
    normalized.includes(
      "installment"
    ) ||
    normalized.includes(
      "instalment"
    )
  ) {
    return "emi";
  }

  return "regular";
}

function normalizeTransactionType(
  value: string
):
  | "purchase"
  | "refund"
  | "reversal"
  | "fee"
  | "payment"
  | "cash_withdrawal"
  | "other" {
  const normalized =
    normalizeHeader(
      value
    );

  if (
    normalized.includes(
      "refund"
    )
  ) {
    return "refund";
  }

  if (
    normalized.includes(
      "reversal"
    )
  ) {
    return "reversal";
  }

  if (
    normalized.includes(
      "fee"
    ) ||
    normalized.includes(
      "charge"
    )
  ) {
    return "fee";
  }

  if (
    normalized.includes(
      "payment"
    ) ||
    normalized.includes(
      "repayment"
    )
  ) {
    return "payment";
  }

  if (
    normalized.includes(
      "cash"
    ) ||
    normalized.includes(
      "atm"
    )
  ) {
    return "cash_withdrawal";
  }

  return "purchase";
}

function inferCategory(
  merchant: string
): {
  category: string;
  classificationMethod: string;
} {
  const value =
    merchant.toLowerCase();

  if (
    /swiggy|zomato|eazydiner|restaurant|cafe|dining|food/.test(
      value
    )
  ) {
    return {
      category: "Dining",
      classificationMethod:
        "merchant",
    };
  }

  if (
    /amazon|flipkart|myntra|ajio|shopping|retail/.test(
      value
    )
  ) {
    return {
      category: "Shopping",
      classificationMethod:
        "merchant",
    };
  }

  if (
    /uber|ola|rapido|fuel|petrol|diesel|hpcl|bpcl|iocl/.test(
      value
    )
  ) {
    return {
      category: "Fuel",
      classificationMethod:
        "merchant",
    };
  }

  if (
    /airtel|jio|vi |vodafone|electricity|bescom|water|gas|broadband|internet/.test(
      value
    )
  ) {
    return {
      category:
        "Utilities",
      classificationMethod:
        "merchant",
    };
  }

  if (
    /netflix|prime video|spotify|disney|bookmyshow|sony liv|hotstar/.test(
      value
    )
  ) {
    return {
      category:
        "Entertainment",
      classificationMethod:
        "merchant",
    };
  }

  if (
    /makemytrip|mmt|cleartrip|booking.com|air india|indigo|vistara|hotel|flight|airlines/.test(
      value
    )
  ) {
    return {
      category: "Travel",
      classificationMethod:
        "merchant",
    };
  }

  if (
    /insurance|lic |policy/.test(
      value
    )
  ) {
    return {
      category:
        "Insurance",
      classificationMethod:
        "merchant",
    };
  }

  return {
    category: "Other",
    classificationMethod:
      "default",
  };
}

function formatConnectionStatus(
  card: Card
): string {
  const connectionType =
    card.connection_type ??
    "manual";

  const connectionStatus =
    card.connection_status ??
    "manual";

  if (
    connectionType ===
      "account_aggregator" &&
    connectionStatus ===
      "connected"
  ) {
    return "Connected";
  }

  if (
    connectionType ===
    "statement"
  ) {
    return "Statement";
  }

  if (
    connectionStatus ===
    "disconnected"
  ) {
    return "Disconnected";
  }

  if (
    connectionStatus ===
    "error"
  ) {
    return "Error";
  }

  return (
    CONNECTION_LABELS[
      connectionType
    ] ?? "Manual"
  );
}

function buildFingerprintInput(
  values: {
    cardId: string | null;
    transactionDate: string;
    amount: number;
    merchant: string;
    transactionType: string;
  }
): string {
  return [
    values.cardId ?? "none",
    values.transactionDate,
    Math.abs(
      values.amount
    ).toFixed(2),
    normalizeMerchant(
      values.merchant
    ),
    values.transactionType,
  ].join("|");
}

async function createTransactionFingerprint(
  values: {
    cardId: string | null;
    transactionDate: string;
    amount: number;
    merchant: string;
    transactionType: string;
  }
): Promise<string> {
  const input =
    buildFingerprintInput(
      values
    );

  if (
    typeof window !==
    "undefined" &&
    window.crypto?.subtle
  ) {
    const encoded =
      new TextEncoder().encode(
        input
      );

    const digest =
      await window.crypto.subtle.digest(
        "SHA-256",
        encoded
      );

    return Array.from(
      new Uint8Array(
        digest
      )
    )
      .map(
        (byte) =>
          byte
            .toString(16)
            .padStart(
              2,
              "0"
            )
      )
      .join("");
  }

  return input;
}

function isPotentialDuplicate(
  existing: SpendTransaction,
  candidate: {
    cardId: string | null;
    merchant: string;
    amount: number;
    transactionDate: string;
    transactionType: string;
  }
): boolean {
  if (
    existing.card_id !==
    candidate.cardId
  ) {
    return false;
  }

  if (
    existing.transaction_type !==
    candidate.transactionType
  ) {
    return false;
  }

  const existingAmount =
    Math.abs(
      Number(
        existing.amount
      )
    );

  const candidateAmount =
    Math.abs(
      Number(
        candidate.amount
      )
    );

  if (
    Math.abs(
      existingAmount -
        candidateAmount
    ) > 0.01
  ) {
    return false;
  }

  const existingDate =
    new Date(
      existing.transaction_date
    );

  const candidateDate =
    new Date(
      candidate.transactionDate
    );

  const dayDifference =
    Math.abs(
      existingDate.getTime() -
        candidateDate.getTime()
    ) /
    (1000 * 60 * 60 * 24);

  if (
    dayDifference > 2
  ) {
    return false;
  }

  const existingMerchant =
    normalizeMerchant(
      existing.merchant
    );

  const candidateMerchant =
    normalizeMerchant(
      candidate.merchant
    );

  if (
    existingMerchant ===
    candidateMerchant
  ) {
    return true;
  }

  if (
    existingMerchant.length >=
      5 &&
    candidateMerchant.length >=
      5
  ) {
    return (
      existingMerchant.includes(
        candidateMerchant
      ) ||
      candidateMerchant.includes(
        existingMerchant
      )
    );
  }

  return false;
}

export default function SpendPage() {
  const router =
    useRouter();

  const {
    activeProfile,
    loadingProfiles,
  } =
    useCardIQProfile();

  const [
    cards,
    setCards,
  ] = useState<Card[]>([]);

  const [
    transactions,
    setTransactions,
  ] = useState<
    SpendTransaction[]
  >([]);

  const [
    loadingCards,
    setLoadingCards,
  ] = useState(true);

  const [
    loadingTransactions,
    setLoadingTransactions,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingTransactionId,
    setDeletingTransactionId,
  ] = useState<
    string | null
  >(null);

  const [
    editingTransactionId,
    setEditingTransactionId,
  ] = useState<
    string | null
  >(null);

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    merchant,
    setMerchant,
  ] = useState("");

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("Shopping");

  const [
    cardId,
    setCardId,
  ] = useState("");

  const [
    transactionDate,
    setTransactionDate,
  ] = useState(
    new Date()
      .toISOString()
      .slice(
        0,
        10
      )
  );

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    mcc,
    setMcc,
  ] = useState("");

  const [
    mccDescription,
    setMccDescription,
  ] = useState("");

  const [
    paymentRoute,
    setPaymentRoute,
  ] = useState("");

  const [
    transactionType,
    setTransactionType,
  ] = useState<
    (typeof TRANSACTION_TYPES)[number]["value"]
  >("purchase");

  const [
    originalTransactionId,
    setOriginalTransactionId,
  ] = useState("");

  const [
    emiStatus,
    setEmiStatus,
  ] = useState<
    (typeof EMI_STATUSES)[number]["value"]
  >("regular");

  const [
    emiPrincipal,
    setEmiPrincipal,
  ] = useState("");

  const [
    emiInterestRate,
    setEmiInterestRate,
  ] = useState("");

  const [
    emiInterest,
    setEmiInterest,
  ] = useState("");

  const [
    emiProcessingFee,
    setEmiProcessingFee,
  ] = useState("");

  const [
    gstOnProcessingFee,
    setGstOnProcessingFee,
  ] = useState("");

  const [
    gstOnInterest,
    setGstOnInterest,
  ] = useState("");

  const [
    emiOtherFees,
    setEmiOtherFees,
  ] = useState("");

  const [
    emiNumber,
    setEmiNumber,
  ] = useState("");

  const [
    totalEmis,
    setTotalEmis,
  ] = useState("");

  const [
    emiTotalPayable,
    setEmiTotalPayable,
  ] = useState("");

  const [
    emiStartDate,
    setEmiStartDate,
  ] = useState("");

  const [
    emiEndDate,
    setEmiEndDate,
  ] = useState("");

  /*
   * Import state
   */
  const [
    selectedImportCardId,
    setSelectedImportCardId,
  ] = useState("");

  const [
    importRows,
    setImportRows,
  ] = useState<
    ImportRow[]
  >([]);

  const [
    importFileName,
    setImportFileName,
  ] = useState("");

  const [
    importingStatement,
    setImportingStatement,
  ] = useState(false);

  const [
    importBatchId,
    setImportBatchId,
  ] = useState<
    string | null
  >(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const profile =
    activeProfile;

  const selectedCard =
    useMemo(
      () =>
        cards.find(
          (card) =>
            card.id ===
            cardId
        ),
      [cards, cardId]
    );

  const selectedImportCard =
    useMemo(
      () =>
        cards.find(
          (card) =>
            card.id ===
            selectedImportCardId
        ),
      [
        cards,
        selectedImportCardId,
      ]
    );

  const originalTransactionOptions =
    useMemo(
      () =>
        transactions.filter(
          (transaction) =>
            transaction.transaction_type ===
              "purchase" ||
            transaction.transaction_type ===
              "emi"
        ),
      [transactions]
    );

  const totalSpend =
    useMemo(
      () =>
        transactions.reduce(
          (
            total,
            transaction
          ) => {
            const value =
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
                total - value
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
              total + value
            );
          },
          0
        ),
      [transactions]
    );

  const importSelectedCount =
    useMemo(
      () =>
        importRows.filter(
          (row) =>
            row.selected &&
            !row.duplicate &&
            !row.error
        ).length,
      [importRows]
    );

  const importDuplicateCount =
    useMemo(
      () =>
        importRows.filter(
          (row) =>
            row.duplicate
        ).length,
      [importRows]
    );

  useEffect(() => {
    const loadData =
      async () => {
        if (
          loadingProfiles
        ) {
          return;
        }

        if (
          !profile?.id
        ) {
          setCards([]);
          setTransactions(
            []
          );
          setLoadingCards(
            false
          );
          setLoadingTransactions(
            false
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

        setLoadingCards(
          true
        );

        setLoadingTransactions(
          true
        );

        setError("");

        const [
          cardsResult,
          transactionsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "cards"
              )
              .select(
                "id, name, bank, network, variant, card_last_four, connection_type, connection_status, last_synced_at"
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "profile_id",
                profile.id
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
                "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, merchant_raw, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id, emi_status, emi_principal, emi_interest_rate, emi_interest, emi_processing_fee, emi_tax, gst_on_processing_fee, gst_on_interest, emi_other_fees, emi_number, total_emis, emi_total_payable, emi_start_date, emi_end_date, original_transaction_amount, total_transaction_cost, reward_adjustment_amount, fee_waiver_adjustment_amount, original_transaction_id, transaction_fingerprint"
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "profile_id",
                profile.id
              )
              .order(
                "transaction_date",
                {
                  ascending:
                    false,
                }
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              )
              .limit(
                100
              ),
          ]);

        if (
          cardsResult.error
        ) {
          console.error(
            cardsResult.error
          );

          setError(
            cardsResult.error.message ||
              "Unable to load your cards."
          );
        } else {
          const loadedCards =
            (cardsResult.data ??
              []) as Card[];

          setCards(
            loadedCards
          );

          if (
            loadedCards.length >
              0 &&
            !cardId
          ) {
            setCardId(
              loadedCards[0]
                .id
            );
          }

          if (
            loadedCards.length >
              0 &&
            !selectedImportCardId
          ) {
            setSelectedImportCardId(
              loadedCards[0]
                .id
            );
          }
        }

        if (
          transactionsResult.error
        ) {
          console.error(
            transactionsResult.error
          );

          setError(
            transactionsResult
              .error
              .message ||
              "Unable to load your purchases."
          );

          setTransactions(
            []
          );
        } else {
          setTransactions(
            (transactionsResult.data ??
              []) as SpendTransaction[]
          );
        }

        setLoadingCards(
          false
        );

        setLoadingTransactions(
          false
        );
      };

    loadData();
  }, [
    profile?.id,
    loadingProfiles,
    router,
  ]);

  const resetForm =
    () => {
      setMerchant("");
      setAmount("");
      setCategory(
        "Shopping"
      );

      if (
        cards.length > 0
      ) {
        setCardId(
          cards[0].id
        );
      } else {
        setCardId("");
      }

      setTransactionDate(
        new Date()
          .toISOString()
          .slice(
            0,
            10
          )
      );

      setNotes("");
      setMcc("");
      setMccDescription("");
      setPaymentRoute("");
      setTransactionType(
        "purchase"
      );
      setOriginalTransactionId(
        ""
      );

      setEmiStatus(
        "regular"
      );
      setEmiPrincipal("");
      setEmiInterestRate("");
      setEmiInterest("");
      setEmiProcessingFee("");
      setGstOnProcessingFee("");
      setGstOnInterest("");
      setEmiOtherFees("");
      setEmiNumber("");
      setTotalEmis("");
      setEmiTotalPayable("");
      setEmiStartDate("");
      setEmiEndDate("");

      setEditingTransactionId(
        null
      );
      setOpenMenuId(null);
    };

  const resetEmiFields =
    () => {
      setEmiPrincipal("");
      setEmiInterestRate("");
      setEmiInterest("");
      setEmiProcessingFee("");
      setGstOnProcessingFee("");
      setGstOnInterest("");
      setEmiOtherFees("");
      setEmiNumber("");
      setTotalEmis("");
      setEmiTotalPayable("");
      setEmiStartDate("");
      setEmiEndDate("");
    };

  const handleTransactionTypeChange =
    (
      value: string
    ) => {
      setTransactionType(
        value as (typeof TRANSACTION_TYPES)[number]["value"]
      );

      if (
        value !==
          "refund" &&
        value !==
          "reversal"
      ) {
        setOriginalTransactionId(
          ""
        );
      }
    };

  const handleSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setError("");
      setSuccessMessage("");

      if (!profile?.id) {
        setError(
          "No active profile is available."
        );
        return;
      }

      const trimmedMerchant =
        merchant.trim();

      const numericAmount =
        Number(amount);

      const numericMcc =
        mcc.trim()
          ? Number(mcc)
          : null;

      if (!trimmedMerchant) {
        setError(
          "Please enter the merchant name."
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
          "Please enter a valid transaction amount."
        );
        return;
      }

      if (
        numericMcc !==
          null &&
        (!Number.isInteger(
          numericMcc
        ) ||
          numericMcc <
            1 ||
          numericMcc >
            9999)
      ) {
        setError(
          "MCC must be a valid numeric code."
        );
        return;
      }

      if (!category) {
        setError(
          "Please select a category."
        );
        return;
      }

      if (
        !transactionDate
      ) {
        setError(
          "Please select a transaction date."
        );
        return;
      }

      if (
        (transactionType ===
          "refund" ||
          transactionType ===
            "reversal") &&
        !originalTransactionId
      ) {
        setError(
          "Please select the original transaction for this refund or reversal."
        );
        return;
      }

      if (
        emiStatus !==
          "regular" &&
        transactionType !==
          "purchase"
      ) {
        setError(
          "EMI details can only be attached to a purchase."
        );
        return;
      }

      const numericEmiPrincipal =
        emiPrincipal.trim()
          ? Number(
              emiPrincipal
            )
          : null;

      const numericInterestRate =
        emiInterestRate.trim()
          ? Number(
              emiInterestRate
            )
          : null;

      const numericInterest =
        emiInterest.trim()
          ? Number(
              emiInterest
            )
          : null;

      const numericProcessingFee =
        emiProcessingFee.trim()
          ? Number(
              emiProcessingFee
            )
          : null;

      const numericGstProcessingFee =
        gstOnProcessingFee.trim()
          ? Number(
              gstOnProcessingFee
            )
          : null;

      const numericGstInterest =
        gstOnInterest.trim()
          ? Number(
              gstOnInterest
            )
          : null;

      const numericOtherFees =
        emiOtherFees.trim()
          ? Number(
              emiOtherFees
            )
          : null;

      const numericEmiNumber =
        emiNumber.trim()
          ? Number(
              emiNumber
            )
          : null;

      const numericTotalEmis =
        totalEmis.trim()
          ? Number(
              totalEmis
            )
          : null;

      const numericTotalPayable =
        emiTotalPayable.trim()
          ? Number(
              emiTotalPayable
            )
          : null;

      const numericTotalCost =
        emiStatus ===
          "regular"
          ? numericAmount
          : numericTotalPayable ??
            (
              numericEmiPrincipal ??
              numericAmount
            ) +
              (
                numericInterest ??
                0
              ) +
              (
                numericProcessingFee ??
                0
              ) +
              (
                numericGstProcessingFee ??
                0
              ) +
              (
                numericGstInterest ??
                0
              ) +
              (
                numericOtherFees ??
                0
              );

      const emiNumericValues = [
        numericEmiPrincipal,
        numericInterestRate,
        numericInterest,
        numericProcessingFee,
        numericGstProcessingFee,
        numericGstInterest,
        numericOtherFees,
        numericEmiNumber,
        numericTotalEmis,
        numericTotalPayable,
      ];

      if (
        emiStatus !==
          "regular" &&
        emiNumericValues.some(
          (
            value
          ) =>
            value !==
              null &&
            (!Number.isFinite(
              value
            ) ||
              value < 0)
        )
      ) {
        setError(
          "Please enter valid EMI amounts and values."
        );
        return;
      }

      if (
        numericInterestRate !==
          null &&
        numericInterestRate >
          100
      ) {
        setError(
          "Interest rate cannot exceed 100%."
        );
        return;
      }

      if (
        numericEmiNumber !==
          null &&
        (!Number.isInteger(
          numericEmiNumber
        ) ||
          numericEmiNumber <
            1)
      ) {
        setError(
          "EMI number must be a positive whole number."
        );
        return;
      }

      if (
        numericTotalEmis !==
          null &&
        (!Number.isInteger(
          numericTotalEmis
        ) ||
          numericTotalEmis <
            1)
      ) {
        setError(
          "Total EMIs must be a positive whole number."
        );
        return;
      }

      if (
        numericEmiNumber !==
          null &&
        numericTotalEmis !==
          null &&
        numericEmiNumber >
          numericTotalEmis
      ) {
        setError(
          "EMI number cannot be greater than total EMIs."
        );
        return;
      }

      setSaving(true);

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

        const fingerprint =
          await createTransactionFingerprint({
            cardId:
              selectedCard?.id ??
              null,
            transactionDate,
            amount:
              numericAmount,
            merchant:
              trimmedMerchant,
            transactionType,
          });

        /*
         * Exact fingerprint check.
         */
        const {
          data: fingerprintMatches,
          error:
            fingerprintError,
        } =
          await supabase
            .from(
              "spend_transactions"
            )
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, transaction_type"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "profile_id",
              profile.id
            )
            .eq(
              "transaction_fingerprint",
              fingerprint
            )
            .limit(5);

        if (
          fingerprintError
        ) {
          throw fingerprintError;
        }

        if (
          !editingTransactionId &&
          fingerprintMatches &&
          fingerprintMatches.length >
            0
        ) {
          setError(
            `Possible duplicate detected: ${fingerprintMatches[0].merchant} for ${formatCurrencyValue(
              Number(
                fingerprintMatches[0]
                  .amount
              )
            )} on ${
              fingerprintMatches[0]
                .transaction_date
            }.`
          );

          setSaving(false);
          return;
        }

        /*
         * Broader duplicate check.
         */
        const candidate =
          {
            cardId:
              selectedCard?.id ??
              null,
            merchant:
              trimmedMerchant,
            amount:
              numericAmount,
            transactionDate,
            transactionType,
          };

        const {
          data:
            nearbyMatches,
          error:
            nearbyError,
        } =
          await supabase
            .from(
              "spend_transactions"
            )
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, transaction_type"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "profile_id",
              profile.id
            )
            .eq(
              "card_id",
              selectedCard?.id ??
                ""
            )
            .eq(
              "transaction_type",
              transactionType
            )
            .gte(
              "transaction_date",
              getDateOffset(
                transactionDate,
                -2
              )
            )
            .lte(
              "transaction_date",
              getDateOffset(
                transactionDate,
                2
              )
            )
            .limit(50);

        if (
          nearbyError
        ) {
          throw nearbyError;
        }

        const potentialDuplicate =
          !editingTransactionId
            ? (
                (
                  nearbyMatches ??
                  []
                ) as SpendTransaction[]
              ).find(
                (
                  existing
                ) =>
                  isPotentialDuplicate(
                    existing,
                    candidate
                  )
              )
            : undefined;

        if (
          potentialDuplicate
        ) {
          const proceed =
            window.confirm(
              `Possible duplicate found.\n\n${potentialDuplicate.merchant}\n${formatCurrencyValue(
                Number(
                  potentialDuplicate.amount
                )
              )}\n${potentialDuplicate.transaction_date}\n\nDo you want to add this transaction anyway?`
            );

          if (!proceed) {
            setSaving(
              false
            );
            return;
          }
        }

        const transactionPayload =
          {
            user_id:
              user.id,
            profile_id:
              profile.id,
            card_id:
              selectedCard?.id ??
              null,

            merchant:
              trimmedMerchant,
            merchant_raw:
              trimmedMerchant,

            amount:
              numericAmount,

            original_transaction_amount:
              numericAmount,

            currency_code:
              profile.currency_code,

            category,

            mcc:
              numericMcc,

            mcc_description:
              mccDescription.trim() ||
              null,

            classification_method:
              numericMcc !==
              null
                ? "mcc"
                : "manual",

            payment_route:
              paymentRoute ||
              null,

            transaction_type:
              transactionType,

            original_transaction_id:
              originalTransactionId ||
              null,

            emi_status:
              emiStatus,

            emi_principal:
              emiStatus !==
                "regular"
                ? numericEmiPrincipal
                : null,

            emi_interest_rate:
              emiStatus !==
                "regular"
                ? numericInterestRate
                : null,

            emi_interest:
              emiStatus !==
                "regular"
                ? numericInterest
                : null,

            emi_processing_fee:
              emiStatus !==
                "regular"
                ? numericProcessingFee
                : null,

            gst_on_processing_fee:
              emiStatus !==
                "regular"
                ? numericGstProcessingFee
                : null,

            gst_on_interest:
              emiStatus !==
                "regular"
                ? numericGstInterest
                : null,

            emi_other_fees:
              emiStatus !==
                "regular"
                ? numericOtherFees
                : null,

            emi_number:
              emiStatus !==
                "regular"
                ? numericEmiNumber
                : null,

            total_emis:
              emiStatus !==
                "regular"
                ? numericTotalEmis
                : null,

            emi_total_payable:
              emiStatus !==
                "regular"
                ? numericTotalPayable
                : null,

            emi_start_date:
              emiStatus !==
                "regular"
                ? emiStartDate ||
                  null
                : null,

            emi_end_date:
              emiStatus !==
                "regular"
                ? emiEndDate ||
                  null
                : null,

            total_transaction_cost:
              numericTotalCost,

            transaction_fingerprint:
              fingerprint,

            notes:
              notes.trim() ||
              null,

            source_type:
              "manual",
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
                transactionPayload
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
                profile.id
              )
              .select(
                "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, merchant_raw, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id, emi_status, emi_principal, emi_interest_rate, emi_interest, emi_processing_fee, emi_tax, gst_on_processing_fee, gst_on_interest, emi_other_fees, emi_number, total_emis, emi_total_payable, emi_start_date, emi_end_date, original_transaction_amount, total_transaction_cost, reward_adjustment_amount, fee_waiver_adjustment_amount, original_transaction_id, transaction_fingerprint"
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
            "Transaction updated successfully."
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
                transactionPayload
              )
              .select(
                "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, merchant_raw, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id, emi_status, emi_principal, emi_interest_rate, emi_interest, emi_processing_fee, emi_tax, gst_on_processing_fee, gst_on_interest, emi_other_fees, emi_number, total_emis, emi_total_payable, emi_start_date, emi_end_date, original_transaction_amount, total_transaction_cost, reward_adjustment_amount, fee_waiver_adjustment_amount, original_transaction_id, transaction_fingerprint"
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
            "Transaction recorded successfully."
          );
        }

        resetForm();
      } catch (err) {
        console.error(
          "Spend transaction save error:",
          err
        );

        const message =
          err &&
          typeof err ===
            "object" &&
          "message" in err
            ? String(
                (
                  err as {
                    message: unknown;
                  }
                ).message
              )
            : null;

        setError(
          message ||
            (editingTransactionId
              ? "Unable to update this transaction."
              : "Unable to record this transaction.")
        );
      } finally {
        setSaving(false);
      }
    };

  const handleEditTransaction =
    (
      transaction: SpendTransaction
    ) => {
      setMerchant(
        transaction.merchant
      );

      setAmount(
        Number(
          transaction.amount
        ).toFixed(2)
      );

      setCategory(
        transaction.category
      );

      setCardId(
        transaction.card_id ??
          ""
      );

      setTransactionDate(
        transaction.transaction_date
      );

      setNotes(
        transaction.notes ??
          ""
      );

      setMcc(
        transaction.mcc !=
          null
          ? String(
              transaction.mcc
            )
          : ""
      );

      setMccDescription(
        transaction.mcc_description ??
          ""
      );

      setPaymentRoute(
        transaction.payment_route ??
          ""
      );

      setTransactionType(
        (transaction.transaction_type ??
          "purchase") as (typeof TRANSACTION_TYPES)[number]["value"]
      );

      setOriginalTransactionId(
        transaction.original_transaction_id ??
          ""
      );

      setEmiStatus(
        (transaction.emi_status ??
          "regular") as (typeof EMI_STATUSES)[number]["value"]
      );

      setEmiPrincipal(
        transaction.emi_principal !=
          null
          ? String(
              transaction.emi_principal
            )
          : ""
      );

      setEmiInterestRate(
        transaction.emi_interest_rate !=
          null
          ? String(
              transaction.emi_interest_rate
            )
          : ""
      );

      setEmiInterest(
        transaction.emi_interest !=
          null
          ? String(
              transaction.emi_interest
            )
          : ""
      );

      setEmiProcessingFee(
        transaction.emi_processing_fee !=
          null
          ? String(
              transaction.emi_processing_fee
            )
          : ""
      );

      setGstOnProcessingFee(
        transaction.gst_on_processing_fee !=
          null
          ? String(
              transaction.gst_on_processing_fee
            )
          : ""
      );

      setGstOnInterest(
        transaction.gst_on_interest !=
          null
          ? String(
              transaction.gst_on_interest
            )
          : ""
      );

      setEmiOtherFees(
        transaction.emi_other_fees !=
          null
          ? String(
              transaction.emi_other_fees
            )
          : ""
      );

      setEmiNumber(
        transaction.emi_number !=
          null
          ? String(
              transaction.emi_number
            )
          : ""
      );

      setTotalEmis(
        transaction.total_emis !=
          null
          ? String(
              transaction.total_emis
            )
          : ""
      );

      setEmiTotalPayable(
        transaction.emi_total_payable !=
          null
          ? String(
              transaction.emi_total_payable
            )
          : ""
      );

      setEmiStartDate(
        transaction.emi_start_date ??
          ""
      );

      setEmiEndDate(
        transaction.emi_end_date ??
          ""
      );

      setEditingTransactionId(
        transaction.id
      );

      setOpenMenuId(null);

      setError("");
      setSuccessMessage("");

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  const handleDeleteTransaction =
    async (
      transaction: SpendTransaction
    ) => {
      const confirmed =
        window.confirm(
          `Delete the "${transaction.merchant}" transaction permanently?\n\nThis action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      setDeletingTransactionId(
        transaction.id
      );

      setOpenMenuId(null);
      setError("");
      setSuccessMessage("");

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

      const currentProfile =
        activeProfile;

      if (
        !currentProfile?.id
      ) {
        setError(
          "No active profile is available."
        );

        setDeletingTransactionId(
          null
        );

        return;
      }

      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            "spend_transactions"
          )
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
            currentProfile.id
          );

      if (
        deleteError
      ) {
        console.error(
          deleteError
        );

        setError(
          deleteError.message ||
            "Unable to delete this transaction."
        );

        setDeletingTransactionId(
          null
        );

        return;
      }

      setTransactions(
        (current) =>
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
        "Transaction deleted successfully."
      );

      setDeletingTransactionId(
        null
      );
    };

  const handleStatementFile =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      setError("");
      setSuccessMessage("");
      setImportRows([]);
      setImportBatchId(
        null
      );

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      const currentProfile =
        activeProfile;

      if (
        !currentProfile?.id
      ) {
        setError(
          "No active profile is available."
        );

        event.target.value =
          "";

        return;
      }

      if (
        !selectedImportCardId
      ) {
        setError(
          "Please select the card represented by this statement first."
        );

        event.target.value =
          "";

        return;
      }

      if (
        !file.name
          .toLowerCase()
          .endsWith(
            ".csv"
          )
      ) {
        setError(
          "CSV statement import is available at this stage. PDF and Excel imports will be added through the secure document-processing layer."
        );

        event.target.value =
          "";

        return;
      }

      setImportFileName(
        file.name
      );

      try {
        const content =
          await file.text();

        const rows =
          parseCsv(content);

        if (
          rows.length <
          2
        ) {
          throw new Error(
            "The CSV statement does not contain enough rows to import."
          );
        }

        const headers =
          rows[0];

        const merchantIndex =
          findColumnIndex(
            headers,
            [
              "merchant",
              "merchant name",
              "description",
              "transaction description",
              "narration",
              "details",
              "particulars",
            ]
          );

        const amountIndex =
          findColumnIndex(
            headers,
            [
              "amount",
              "transaction amount",
              "debit",
              "spend",
              "purchase amount",
            ]
          );

        const dateIndex =
          findColumnIndex(
            headers,
            [
              "date",
              "transaction date",
              "txn date",
              "transactiondate",
              "posted date",
              "value date",
            ]
          );

        const categoryIndex =
          findColumnIndex(
            headers,
            [
              "category",
              "merchant category",
            ]
          );

        const mccIndex =
          findColumnIndex(
            headers,
            [
              "mcc",
              "merchant category code",
            ]
          );

        const mccDescriptionIndex =
          findColumnIndex(
            headers,
            [
              "mcc description",
              "merchant category description",
            ]
          );

        const referenceIndex =
          findColumnIndex(
            headers,
            [
              "transaction id",
              "transactionid",
              "reference",
              "reference number",
              "transaction reference",
              "rrn",
              "txn id",
            ]
          );

        const originalReferenceIndex =
          findColumnIndex(
            headers,
            [
              "original transaction id",
              "original transaction reference",
              "original reference",
            ]
          );

        const typeIndex =
          findColumnIndex(
            headers,
            [
              "transaction type",
              "type",
              "debit credit",
            ]
          );

        const paymentRouteIndex =
          findColumnIndex(
            headers,
            [
              "payment route",
              "payment method",
              "channel",
            ]
          );

        const emiStatusIndex =
          findColumnIndex(
            headers,
            [
              "emi status",
              "emi type",
              "emi",
              "installment type",
            ]
          );

        const principalIndex =
          findColumnIndex(
            headers,
            [
              "principal",
              "principal amount",
              "emi principal",
            ]
          );

        const interestRateIndex =
          findColumnIndex(
            headers,
            [
              "interest rate",
              "rate of interest",
              "roi",
              "interest %",
            ]
          );

        const interestIndex =
          findColumnIndex(
            headers,
            [
              "interest",
              "interest amount",
              "emi interest",
            ]
          );

        const processingFeeIndex =
          findColumnIndex(
            headers,
            [
              "processing fee",
              "emi processing fee",
            ]
          );

        const gstProcessingIndex =
          findColumnIndex(
            headers,
            [
              "gst on processing fee",
              "processing fee gst",
              "gst processing fee",
            ]
          );

        const gstInterestIndex =
          findColumnIndex(
            headers,
            [
              "gst on interest",
              "interest gst",
            ]
          );

        const emiOtherFeesIndex =
          findColumnIndex(
            headers,
            [
              "other emi fees",
              "other fees",
              "emi other fees",
            ]
          );

        const emiNumberIndex =
          findColumnIndex(
            headers,
            [
              "emi number",
              "installment number",
              "instalment number",
              "emi no",
              "installment no",
            ]
          );

        const totalEmisIndex =
          findColumnIndex(
            headers,
            [
              "total emis",
              "total emi",
              "tenure",
              "total installments",
              "total instalments",
            ]
          );

        const totalPayableIndex =
          findColumnIndex(
            headers,
            [
              "total payable",
              "emi total payable",
              "total amount payable",
            ]
          );

        const emiStartDateIndex =
          findColumnIndex(
            headers,
            [
              "emi start date",
              "installment start date",
              "instalment start date",
            ]
          );

        const emiEndDateIndex =
          findColumnIndex(
            headers,
            [
              "emi end date",
              "installment end date",
              "instalment end date",
            ]
          );

        if (
          merchantIndex <
          0
        ) {
          throw new Error(
            "CardIQ could not identify a merchant/description column in this CSV."
          );
        }

        if (
          amountIndex <
          0
        ) {
          throw new Error(
            "CardIQ could not identify an amount column in this CSV."
          );
        }

        if (
          dateIndex <
          0
        ) {
          throw new Error(
            "CardIQ could not identify a transaction date column in this CSV."
          );
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

        const sourceTransactionIds =
          rows
            .slice(1)
            .map(
              (
                row
              ) =>
                referenceIndex >=
                0
                  ? (
                      row[
                        referenceIndex
                      ] ??
                      ""
                    ).trim()
                  : ""
            )
            .filter(
              Boolean
            );

        let existingSourceIds =
          new Set<string>();

        if (
          sourceTransactionIds.length >
          0
        ) {
          const {
            data:
              existingRows,
            error:
              existingError,
          } =
            await supabase
              .from(
                "spend_transactions"
              )
              .select(
                "source_transaction_id"
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "profile_id",
                currentProfile.id
              )
              .in(
                "source_transaction_id",
                sourceTransactionIds
              );

          if (
            existingError
          ) {
            throw existingError;
          }

          existingSourceIds =
            new Set(
              (
                existingRows ??
                []
              )
                .map(
                  (
                    row
                  ) =>
                    row.source_transaction_id
                )
                .filter(
                  (
                    value
                  ): value is string =>
                    Boolean(
                      value
                    )
                )
            );
        }

        /*
         * Pull recent transactions for broader
         * duplicate checking when the statement
         * doesn't have a unique reference number.
         */
        const {
          data:
            existingTransactions,
          error:
            existingTransactionsError,
        } =
          await supabase
            .from(
              "spend_transactions"
            )
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, transaction_type, source_transaction_id, transaction_fingerprint"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "profile_id",
              currentProfile.id
            )
            .eq(
              "card_id",
              selectedImportCardId
            )
            .limit(500);

        if (
          existingTransactionsError
        ) {
          throw existingTransactionsError;
        }

        const parsedRows: ImportRow[] =
          [];

        rows
          .slice(1)
          .forEach(
            (
              row,
              index
            ) => {
              if (
                row.every(
                  (
                    value
                  ) =>
                    !value.trim()
                )
              ) {
                return;
              }

              const rawMerchant =
                row[
                  merchantIndex
                ]?.trim() ??
                "";

              const parsedAmount =
                parseAmount(
                  row[
                    amountIndex
                  ] ?? ""
                );

              const parsedDate =
                parseDate(
                  row[
                    dateIndex
                  ] ?? ""
                );

              const explicitCategory =
                categoryIndex >=
                0
                  ? (
                      row[
                        categoryIndex
                      ] ?? ""
                    ).trim()
                  : "";

              const categoryResult =
                explicitCategory
                  ? {
                      category:
                        explicitCategory,
                      classificationMethod:
                        "statement",
                    }
                  : inferCategory(
                      rawMerchant
                    );

              const rawMcc =
                mccIndex >=
                0
                  ? (
                      row[
                        mccIndex
                      ] ?? ""
                    ).trim()
                  : "";

              const parsedMcc =
                rawMcc
                  ? Number(
                      rawMcc.replace(
                        /[^\d]/g,
                        ""
                      )
                    )
                  : null;

              const parsedMccValue =
                parsedMcc &&
                Number.isInteger(
                  parsedMcc
                )
                  ? parsedMcc
                  : null;

              const rawTransactionType =
                typeIndex >=
                0
                  ? (
                      row[
                        typeIndex
                      ] ?? ""
                    ).trim()
                  : "";

              const parsedTransactionType =
                normalizeTransactionType(
                  rawTransactionType
                );

              const sourceTransactionId =
                referenceIndex >=
                0
                  ? (
                      row[
                        referenceIndex
                      ] ??
                      ""
                    ).trim() ||
                    null
                  : null;

              const originalReference =
                originalReferenceIndex >=
                0
                  ? (
                      row[
                        originalReferenceIndex
                      ] ??
                      ""
                    ).trim() ||
                    null
                  : null;

              const rawEmiStatus =
                emiStatusIndex >=
                0
                  ? (
                      row[
                        emiStatusIndex
                      ] ?? ""
                    ).trim()
                  : "";

              const parsedEmiStatus =
                normalizeEmiStatus(
                  rawEmiStatus
                );

              const parsedPrincipal =
                principalIndex >=
                0
                  ? parseOptionalNumber(
                      row[
                        principalIndex
                      ] ?? ""
                    )
                  : null;

              const parsedInterestRate =
                interestRateIndex >=
                0
                  ? parseOptionalNumber(
                      row[
                        interestRateIndex
                      ] ?? ""
                    )
                  : null;

              const parsedInterest =
                interestIndex >=
                0
                  ? parseOptionalNumber(
                      row[
                        interestIndex
                      ] ?? ""
                    )
                  : null;

              const parsedProcessingFee =
                processingFeeIndex >=
                0
                  ? parseOptionalNumber(
                      row[
                        processingFeeIndex
                      ] ?? ""
                    )
                  : null;

              const parsedGstProcessing =
                gstProcessingIndex >=
                0
                  ? parseOptionalNumber(
                      row[
                        gstProcessingIndex
                      ] ?? ""
                    )
                  : null;

              const parsedGstInterest =
                gstInterestIndex >=
                0
                  ? parseOptionalNumber(
                      row[
                        gstInterestIndex
                      ] ?? ""
                    )
                  : null;

              const parsedOtherFees =
                emiOtherFeesIndex >=
                0
                  ? parseOptionalNumber(
                      row[
                        emiOtherFeesIndex
                      ] ?? ""
                    )
                  : null;

              const parsedEmiNumber =
                emiNumberIndex >=
                0
                  ? parseInteger(
                      row[
                        emiNumberIndex
                      ] ?? ""
                    )
                  : null;

              const parsedTotalEmis =
                totalEmisIndex >=
                0
                  ? parseInteger(
                      row[
                        totalEmisIndex
                      ] ?? ""
                    )
                  : null;

              const parsedTotalPayable =
                totalPayableIndex >=
                0
                  ? parseOptionalNumber(
                      row[
                        totalPayableIndex
                      ] ?? ""
                    )
                  : null;

              const parsedEmiStartDate =
                emiStartDateIndex >=
                0
                  ? parseDate(
                      row[
                        emiStartDateIndex
                      ] ?? ""
                    )
                  : null;

              const parsedEmiEndDate =
                emiEndDateIndex >=
                0
                  ? parseDate(
                      row[
                        emiEndDateIndex
                      ] ?? ""
                    )
                  : null;

              const paymentRouteValue =
                paymentRouteIndex >=
                0
                  ? (
                      row[
                        paymentRouteIndex
                      ] ?? ""
                    ).trim() ||
                    null
                  : null;

              const hasError =
                !rawMerchant
                  ? "Merchant/description is missing."
                  : parsedAmount ===
                        null ||
                      parsedAmount ===
                        0
                    ? "Amount could not be read."
                    : !parsedDate
                      ? "Transaction date could not be read."
                      : null;

              const normalizedAmount =
                Math.abs(
                  parsedAmount ??
                    0
                );

              const fingerprint =
                buildFingerprintInput({
                  cardId:
                    selectedImportCardId,
                  transactionDate:
                    parsedDate ??
                    "",
                  amount:
                    normalizedAmount,
                  merchant:
                    rawMerchant,
                  transactionType:
                    parsedTransactionType,
                });

              const sourceDuplicate =
                Boolean(
                  sourceTransactionId &&
                    existingSourceIds.has(
                      sourceTransactionId
                    )
                );

              const broaderDuplicate =
                !sourceDuplicate &&
                !hasError
                  ? (
                      (
                        existingTransactions ??
                        []
                      ) as SpendTransaction[]
                    ).some(
                      (
                        existing
                      ) =>
                        isPotentialDuplicate(
                          existing,
                          {
                            cardId:
                              selectedImportCardId,
                            merchant:
                              rawMerchant,
                            amount:
                              normalizedAmount,
                            transactionDate:
                              parsedDate ??
                              "",
                            transactionType:
                              parsedTransactionType,
                          }
                        )
                    )
                  : false;

              parsedRows.push({
                rowNumber:
                  index + 2,

                merchant:
                  rawMerchant,

                merchantRaw:
                  rawMerchant,

                amount:
                  normalizedAmount,

                originalTransactionAmount:
                  normalizedAmount,

                transactionDate:
                  parsedDate ??
                  "",

                category:
                  categoryResult.category,

                cardId:
                  selectedImportCardId,

                sourceTransactionId,

                transactionType:
                  parsedTransactionType,

                paymentRoute:
                  paymentRouteValue,

                mcc:
                  parsedMccValue,

                mccDescription:
                  mccDescriptionIndex >=
                  0
                    ? (
                        row[
                          mccDescriptionIndex
                        ] ?? ""
                      ).trim() ||
                      null
                    : null,

                classificationMethod:
                  parsedMccValue !==
                  null
                    ? "mcc"
                    : categoryResult.classificationMethod,

                emiStatus:
                  parsedEmiStatus,

                emiPrincipal:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedPrincipal
                    : null,

                emiInterestRate:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedInterestRate
                    : null,

                emiInterest:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedInterest
                    : null,

                emiProcessingFee:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedProcessingFee
                    : null,

                gstOnProcessingFee:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedGstProcessing
                    : null,

                gstOnInterest:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedGstInterest
                    : null,

                emiOtherFees:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedOtherFees
                    : null,

                emiNumber:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedEmiNumber
                    : null,

                totalEmis:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedTotalEmis
                    : null,

                emiTotalPayable:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedTotalPayable
                    : null,

                emiStartDate:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedEmiStartDate
                    : null,

                emiEndDate:
                  parsedEmiStatus !==
                  "regular"
                    ? parsedEmiEndDate
                    : null,

                totalTransactionCost:
                  parsedTotalPayable ??
                  normalizedAmount,

                rawValues:
                  row,

                duplicate:
                  sourceDuplicate ||
                  broaderDuplicate,

                selected:
                  !sourceDuplicate &&
                  !broaderDuplicate &&
                  !hasError,

                error:
                  hasError,
              });
            }
          );

        if (
          parsedRows.length ===
          0
        ) {
          throw new Error(
            "No transaction rows could be read from this statement."
          );
        }

        const {
          data: batch,
          error:
            batchError,
        } =
          await supabase
            .from(
              "transaction_import_batches"
            )
            .insert({
              user_id:
                user.id,

              profile_id:
                currentProfile.id,

              card_id:
                selectedImportCardId,

              source_type:
                "statement_csv",

              status:
                "review_required",

              transactions_found:
                parsedRows.length,

              transactions_skipped:
                parsedRows.filter(
                  (
                    row
                  ) =>
                    row.duplicate
                ).length,
            })
            .select(
              "id"
            )
            .single();

        if (
          batchError
        ) {
          throw batchError;
        }

        setImportBatchId(
          batch.id
        );

        setImportRows(
          parsedRows
        );

        const readyRows =
          parsedRows.filter(
            (
              row
            ) =>
              !row.error &&
              !row.duplicate
          ).length;

        setSuccessMessage(
          `${parsedRows.length} transaction${
            parsedRows.length ===
            1
              ? ""
              : "s"
          } found. ${readyRows} ready for review.`
        );
      } catch (err) {
        console.error(
          "Statement import error:",
          err
        );

        const message =
          err &&
          typeof err ===
            "object" &&
          "message" in err
            ? String(
                (
                  err as {
                    message: unknown;
                  }
                ).message
              )
            : null;

        setError(
          message ||
            "Unable to process this statement."
        );
      } finally {
        event.target.value =
          "";
      }
    };

  const toggleImportRow = (
    rowNumber: number
  ) => {
    setImportRows(
      (current) =>
        current.map(
          (row) =>
            row.rowNumber ===
            rowNumber
              ? {
                  ...row,
                  selected:
                    row.error ||
                    row.duplicate
                      ? false
                      : !row.selected,
                }
              : row
        )
    );
  };

  const handleImportTransactions =
    async () => {
      const currentProfile =
        activeProfile;

      if (
        !currentProfile?.id
      ) {
        setError(
          "No active profile is available."
        );
        return;
      }

      if (
        !selectedImportCardId
      ) {
        setError(
          "Please select the card represented by the statement."
        );
        return;
      }

      const rowsToImport =
        importRows.filter(
          (row) =>
            row.selected &&
            !row.error &&
            !row.duplicate
        );

      if (
        rowsToImport.length ===
        0
      ) {
        setError(
          "There are no transactions selected for import."
        );
        return;
      }

      setImportingStatement(
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
          await Promise.all(
            rowsToImport.map(
              async (
                row
              ) => {
                const fingerprint =
                  await createTransactionFingerprint({
                    cardId:
                      selectedImportCardId,

                    transactionDate:
                      row.transactionDate,

                    amount:
                      row.amount,

                    merchant:
                      row.merchant,

                    transactionType:
                      row.transactionType,
                  });

                return {
                  user_id:
                    user.id,

                  profile_id:
                    currentProfile.id,

                  card_id:
                    selectedImportCardId,

                  merchant:
                    row.merchant,

                  merchant_raw:
                    row.merchantRaw,

                  amount:
                    row.amount,

                  original_transaction_amount:
                    row.originalTransactionAmount,

                  currency_code:
                    currentProfile.currency_code,

                  category:
                    row.category,

                  mcc:
                    row.mcc,

                  mcc_description:
                    row.mccDescription,

                  classification_method:
                    row.classificationMethod,

                  payment_route:
                    row.paymentRoute,

                  transaction_type:
                    row.transactionType,

                  source_type:
                    "statement_csv",

                  source_transaction_id:
                    row.sourceTransactionId,

                  import_batch_id:
                    importBatchId,

                  original_transaction_id:
                    null,

                  emi_status:
                    row.emiStatus,

                  emi_principal:
                    row.emiPrincipal,

                  emi_interest_rate:
                    row.emiInterestRate,

                  emi_interest:
                    row.emiInterest,

                  emi_processing_fee:
                    row.emiProcessingFee,

                  gst_on_processing_fee:
                    row.gstOnProcessingFee,

                  gst_on_interest:
                    row.gstOnInterest,

                  emi_other_fees:
                    row.emiOtherFees,

                  emi_number:
                    row.emiNumber,

                  total_emis:
                    row.totalEmis,

                  emi_total_payable:
                    row.emiTotalPayable,

                  emi_start_date:
                    row.emiStartDate,

                  emi_end_date:
                    row.emiEndDate,

                  total_transaction_cost:
                    row.totalTransactionCost,

                  transaction_fingerprint:
                    fingerprint,
                };
              }
            )
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
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, merchant_raw, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id, emi_status, emi_principal, emi_interest_rate, emi_interest, emi_processing_fee, emi_tax, gst_on_processing_fee, gst_on_interest, emi_other_fees, emi_number, total_emis, emi_total_payable, emi_start_date, emi_end_date, original_transaction_amount, total_transaction_cost, reward_adjustment_amount, fee_waiver_adjustment_amount, original_transaction_id, transaction_fingerprint"
            );

        if (
          insertError
        ) {
          throw insertError;
        }

        if (
          importBatchId
        ) {
          const {
            error:
              batchUpdateError,
          } =
            await supabase
              .from(
                "transaction_import_batches"
              )
              .update({
                transactions_imported:
                  data?.length ??
                  0,

                transactions_skipped:
                  importRows.filter(
                    (
                      row
                    ) =>
                      row.duplicate
                  ).length,

                status:
                  "completed",

                completed_at:
                  new Date().toISOString(),
              })
              .eq(
                "id",
                importBatchId
              )
              .eq(
                "user_id",
                user.id
              );

          if (
            batchUpdateError
          ) {
            console.error(
              "Import batch update error:",
              batchUpdateError
            );
          }
        }

        setTransactions(
          (current) => [
            ...((data ??
              []) as SpendTransaction[]),
            ...current,
          ]
        );

        setImportRows(
          (current) =>
            current.filter(
              (row) =>
                !rowsToImport.some(
                  (
                    imported
                  ) =>
                    imported.rowNumber ===
                    row.rowNumber
                )
            )
        );

        setSuccessMessage(
          `${
            data?.length ??
            0
          } transaction${
            data?.length ===
            1
              ? ""
              : "s"
          } imported successfully.`
        );
      } catch (err) {
        console.error(
          "Transaction import save error:",
          err
        );

        const message =
          err &&
          typeof err ===
            "object" &&
          "message" in err
            ? String(
                (
                  err as {
                    message: unknown;
                  }
                ).message
              )
            : null;

        setError(
          message ||
            "Unable to import the selected transactions."
        );
      } finally {
        setImportingStatement(
          false
        );
      }
    };

  const clearImport =
    () => {
      setImportRows([]);
      setImportFileName("");
      setImportBatchId(
        null
      );

      setError("");
      setSuccessMessage("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  const formatAmount = (
    value: number
  ) => {
    try {
      return new Intl.NumberFormat(
        undefined,
        {
          style:
            "currency",

          currency:
            profile?.currency_code ??
            "INR",

          maximumFractionDigits: 2,
        }
      ).format(value);
    } catch {
      return `${
        profile?.currency_code ??
        ""
      } ${value.toFixed(
        2
      )}`;
    }
  };

  const getCardName = (
    transaction: SpendTransaction
  ) => {
    if (
      !transaction.card_id
    ) {
      return "No card";
    }

    const card =
      cards.find(
        (
          item
        ) =>
          item.id ===
          transaction.card_id
      );

    if (!card) {
      return "Card";
    }

    return card.card_last_four
      ? `${card.name} ···· ${card.card_last_four}`
      : card.name;
  };

  const getTransactionTypeLabel =
    (
      type:
        | string
        | null
        | undefined
    ) =>
      TRANSACTION_TYPES.find(
        (
          item
        ) =>
          item.value ===
          type
      )?.label ??
      "Purchase";

  const getEmiLabel = (
    status:
      | string
      | null
      | undefined
  ) => {
    if (
      status ===
      "no_cost_emi"
    ) {
      return "No-Cost EMI";
    }

    if (
      status ===
      "emi"
    ) {
      return "EMI";
    }

    return null;
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

  if (!profile) {
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
                router.push(
                  "/profiles"
                )
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

  const isAdjustment =
    transactionType ===
      "refund" ||
    transactionType ===
      "reversal";

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CardIQHeader />

      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            {profile.name} profile
          </p>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Track Spend
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
                Record and import transactions so CardIQ can track spend,
                rewards, EMI costs and renewal-fee progress accurately.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Net profile spend
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatAmount(
                  totalSpend
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Transaction sources */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Add transactions
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Import your statement or record a transaction manually.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Statement */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                ↑
              </div>

              <h3 className="mt-4 font-semibold">
                Import statement
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Upload a CSV statement and review transactions before they
                become part of your ledger.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="statement-card"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"
                >
                  Statement card
                </label>

                <select
                  id="statement-card"
                  value={
                    selectedImportCardId
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedImportCardId(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                >
                  {cards.length ===
                  0 ? (
                    <option value="">
                      No cards available
                    </option>
                  ) : (
                    cards.map(
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
                    )
                  )}
                </select>
              </div>

              <input
                ref={
                  fileInputRef
                }
                id="statement-file"
                type="file"
                accept=".csv,text/csv"
                onChange={
                  handleStatementFile
                }
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  cards.length ===
                  0
                }
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Choose CSV statement
              </button>

              <p className="mt-2 text-xs text-[var(--muted)]">
                PDF and Excel will use the secure document-processing layer in
                the next ingestion stage.
              </p>
            </div>

            {/* Connected cards */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                ↔
              </div>

              <h3 className="mt-4 font-semibold">
                Connected cards
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Account Aggregator connections will feed the same transaction
                and duplicate-detection system.
              </p>

              <div className="mt-5 space-y-2">
                {cards.length ===
                0 ? (
                  <p className="text-xs text-[var(--muted)]">
                    Add a card first.
                  </p>
                ) : (
                  cards.map(
                    (
                      card
                    ) => (
                      <div
                        key={
                          card.id
                        }
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {
                              card.name
                            }
                          </p>

                          <p className="text-xs text-[var(--muted)]">
                            {
                              card.bank
                            }
                            {card.card_last_four
                              ? ` ···· ${card.card_last_four}`
                              : ""}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {formatConnectionStatus(
                            card
                          )}
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            {/* Manual */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                +
              </div>

              <h3 className="mt-4 font-semibold">
                Add manually
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Add a purchase, EMI, refund or reversal when no statement or
                connected source is available.
              </p>

              <button
                type="button"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior:
                      "smooth",
                  })
                }
                className="mt-5 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Use manual entry below
              </button>
            </div>
          </div>
        </section>

        {/* Import review */}
        {importRows.length >
          0 && (
          <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-lg font-semibold">
                  Review imported transactions
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  {importFileName ||
                    "Imported statement"}
                  {selectedImportCard
                    ? ` · ${selectedImportCard.name}${
                        selectedImportCard.card_last_four
                          ? ` ···· ${selectedImportCard.card_last_four}`
                          : ""
                      }`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  clearImport
                }
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Clear import
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--card-muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  Transactions found
                </p>

                <p className="mt-1 text-xl font-bold">
                  {
                    importRows.length
                  }
                </p>
              </div>

              <div className="rounded-xl bg-[var(--card-muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  Ready to import
                </p>

                <p className="mt-1 text-xl font-bold">
                  {
                    importSelectedCount
                  }
                </p>
              </div>

              <div className="rounded-xl bg-[var(--card-muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  Potential duplicates
                </p>

                <p className="mt-1 text-xl font-bold">
                  {
                    importDuplicateCount
                  }
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[980px] border-collapse text-sm">
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
                      Category / MCC
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
                      row
                    ) => (
                      <tr
                        key={
                          row.rowNumber
                        }
                        className="border-b border-[var(--border)] last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={
                              row.selected
                            }
                            disabled={
                              Boolean(
                                row.error ||
                                  row.duplicate
                              )
                            }
                            onChange={() =>
                              toggleImportRow(
                                row.rowNumber
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                          {
                            row.transactionDate ||
                            "—"
                          }
                        </td>

                        <td className="max-w-[240px] px-4 py-3">
                          <p className="truncate font-medium">
                            {
                              row.merchant
                            }
                          </p>

                          {row.sourceTransactionId && (
                            <p className="mt-1 truncate text-xs text-[var(--muted)]">
                              Ref:{" "}
                              {
                                row.sourceTransactionId
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p>
                            {
                              row.category
                            }
                          </p>

                          {row.mcc && (
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              MCC{" "}
                              {
                                row.mcc
                              }
                              {row.mccDescription
                                ? ` · ${row.mccDescription}`
                                : ""}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p>
                            {getTransactionTypeLabel(
                              row.transactionType
                            )}
                          </p>

                          {getEmiLabel(
                            row.emiStatus
                          ) && (
                            <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                              {
                                getEmiLabel(
                                  row.emiStatus
                                )
                              }
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                          {formatAmount(
                            row.amount
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {row.error ? (
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                              {row.error}
                            </span>
                          ) : row.duplicate ? (
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              Possible duplicate
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
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  clearImport
                }
                disabled={
                  importingStatement
                }
                className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
              >
                Cancel import
              </button>

              <button
                type="button"
                onClick={
                  handleImportTransactions
                }
                disabled={
                  importingStatement ||
                  importSelectedCount ===
                    0
                }
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {importingStatement
                  ? "Importing..."
                  : `Import ${importSelectedCount} transaction${
                      importSelectedCount ===
                      1
                        ? ""
                        : "s"
                    }`}
              </button>
            </div>
          </section>
        )}

        {/* Manual transaction */}
        <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              {editingTransactionId
                ? "Edit transaction"
                : "Record a transaction"}
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Store enough transaction detail for CardIQ to evaluate rewards,
              EMI costs, monthly limits and annual fee-waiver progress.
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-6"
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
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-semibold"
                >
                  Amount ({profile.currency_code})
                </label>

                <input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
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
                  onChange={(
                    event
                  ) =>
                    setCardId(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700 dark:focus:ring-slate-700"
                >
                  <option value="">
                    No card / cash
                  </option>

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

              {/* Date */}
              <div>
                <label
                  htmlFor="transaction-date"
                  className="mb-2 block text-sm font-semibold"
                >
                  Transaction date
                </label>

                <input
                  id="transaction-date"
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
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
              </div>

              {/* Transaction type */}
              <div>
                <label
                  htmlFor="transaction-type"
                  className="mb-2 block text-sm font-semibold"
                >
                  Transaction type
                </label>

                <select
                  id="transaction-type"
                  value={
                    transactionType
                  }
                  onChange={(
                    event
                  ) =>
                    handleTransactionTypeChange(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
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
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
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

              {/* MCC */}
              <div>
                <label
                  htmlFor="mcc"
                  className="mb-2 block text-sm font-semibold"
                >
                  MCC
                  <span className="ml-2 font-normal text-[var(--muted)]">
                    Optional
                  </span>
                </label>

                <input
                  id="mcc"
                  type="text"
                  inputMode="numeric"
                  maxLength={
                    4
                  }
                  value={mcc}
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
                  placeholder="e.g. 5812"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm tracking-widest text-[var(--foreground)] outline-none placeholder:tracking-normal placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                />
              </div>

              {/* Payment route */}
              <div>
                <label
                  htmlFor="payment-route"
                  className="mb-2 block text-sm font-semibold"
                >
                  Payment route
                </label>

                <select
                  id="payment-route"
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
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                >
                  <option value="">
                    Select payment route
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
            </div>

            {/* Original transaction */}
            {isAdjustment && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
                <label
                  htmlFor="original-transaction"
                  className="mb-2 block text-sm font-semibold"
                >
                  Original transaction
                </label>

                <select
                  id="original-transaction"
                  value={
                    originalTransactionId
                  }
                  onChange={(
                    event
                  ) =>
                    setOriginalTransactionId(
                      event.target
                        .value
                    )
                  }
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                >
                  <option value="">
                    Select original purchase
                  </option>

                  {originalTransactionOptions
                    .filter(
                      (
                        transaction
                      ) =>
                        transaction.card_id ===
                        (cardId ||
                          null)
                    )
                    .map(
                      (
                        transaction
                      ) => (
                        <option
                          key={
                            transaction.id
                          }
                          value={
                            transaction.id
                          }
                        >
                          {
                            transaction.transaction_date
                          }{" "}
                          ·{" "}
                          {
                            transaction.merchant
                          }{" "}
                          ·{" "}
                          {formatAmount(
                            Number(
                              transaction.amount
                            )
                          )}
                        </option>
                      )
                    )}
                </select>

                <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                  CardIQ will use this link to reverse the original transaction's
                  spend and, through the reward engine, reverse associated rewards
                  where applicable.
                </p>
              </div>
            )}

            {/* EMI */}
            <div className="border-t border-[var(--border)] pt-6">
              <div className="mb-5">
                <h3 className="text-sm font-semibold">
                  EMI details
                </h3>

                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  EMI transactions often have different reward treatment and
                  additional costs. Enter the values shown on your statement.
                </p>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="emi-status"
                  className="mb-2 block text-sm font-semibold"
                >
                  EMI status
                </label>

                <select
                  id="emi-status"
                  value={
                    emiStatus
                  }
                  onChange={(
                    event
                  ) => {
                    const value =
                      event.target
                        .value as (typeof EMI_STATUSES)[number]["value"];

                    setEmiStatus(
                      value
                    );

                    if (
                      value ===
                      "regular"
                    ) {
                      resetEmiFields();
                    }
                  }}
                  disabled={
                    transactionType !==
                    "purchase"
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                >
                  {EMI_STATUSES.map(
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

              {emiStatus !==
                "regular" && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="emi-principal"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Principal amount
                    </label>

                    <input
                      id="emi-principal"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        emiPrincipal
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiPrincipal(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 50000"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emi-interest-rate"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Interest rate (%)
                    </label>

                    <input
                      id="emi-interest-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        emiInterestRate
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiInterestRate(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 15.99"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emi-interest"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Interest amount
                    </label>

                    <input
                      id="emi-interest"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        emiInterest
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiInterest(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 2400"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emi-processing-fee"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Processing fee
                    </label>

                    <input
                      id="emi-processing-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        emiProcessingFee
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiProcessingFee(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 999"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gst-processing-fee"
                      className="mb-2 block text-sm font-semibold"
                    >
                      GST on processing fee
                    </label>

                    <input
                      id="gst-processing-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        gstOnProcessingFee
                      }
                      onChange={(
                        event
                      ) =>
                        setGstOnProcessingFee(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 179.82"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gst-interest"
                      className="mb-2 block text-sm font-semibold"
                    >
                      GST on interest
                    </label>

                    <input
                      id="gst-interest"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        gstOnInterest
                      }
                      onChange={(
                        event
                      ) =>
                        setGstOnInterest(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 432"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emi-other-fees"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Other EMI fees
                    </label>

                    <input
                      id="emi-other-fees"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        emiOtherFees
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiOtherFees(
                          event.target
                            .value
                        )
                      }
                      placeholder="Optional"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emi-number"
                      className="mb-2 block text-sm font-semibold"
                    >
                      EMI number
                    </label>

                    <input
                      id="emi-number"
                      type="number"
                      min="1"
                      step="1"
                      value={
                        emiNumber
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiNumber(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 1"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="total-emis"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Total EMIs
                    </label>

                    <input
                      id="total-emis"
                      type="number"
                      min="1"
                      step="1"
                      value={
                        totalEmis
                      }
                      onChange={(
                        event
                      ) =>
                        setTotalEmis(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 6"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emi-total-payable"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Total EMI payable
                    </label>

                    <input
                      id="emi-total-payable"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        emiTotalPayable
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiTotalPayable(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 63400"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emi-start-date"
                      className="mb-2 block text-sm font-semibold"
                    >
                      EMI start date
                    </label>

                    <input
                      id="emi-start-date"
                      type="date"
                      value={
                        emiStartDate
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiStartDate(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="emi-end-date"
                      className="mb-2 block text-sm font-semibold"
                    >
                      EMI end date
                    </label>

                    <input
                      id="emi-end-date"
                      type="date"
                      value={
                        emiEndDate
                      }
                      onChange={(
                        event
                      ) =>
                        setEmiEndDate(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    />
                  </div>
                </div>
              )}
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
                value={
                  notes
                }
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target
                      .value
                  )
                }
                placeholder="Optional note"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              />
            </div>

            {/* Error */}
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

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
              {editingTransactionId && (
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
                >
                  Cancel edit
                </button>
              )}

              <button
                type="submit"
                disabled={
                  saving
                }
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {saving
                  ? editingTransactionId
                    ? "Saving changes..."
                    : "Saving transaction..."
                  : editingTransactionId
                    ? "Save changes"
                    : "Record transaction"}
              </button>
            </div>
          </form>
        </section>

        {/* Recent Transactions */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Recent transactions
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Your latest transactions in the{" "}
              {profile.name} profile.
            </p>
          </div>

          {transactions.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-sm font-medium">
                No transactions recorded yet.
              </p>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Record a transaction or import a statement above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(
                (
                  transaction
                ) => {
                  const emiLabel =
                    getEmiLabel(
                      transaction.emi_status
                    );

                  const isRefundOrReversal =
                    transaction.transaction_type ===
                      "refund" ||
                    transaction.transaction_type ===
                      "reversal";

                  return (
                    <div
                      key={
                        transaction.id
                      }
                      className="rounded-xl border border-[var(--border)] p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold">
                              {
                                transaction.merchant
                              }
                            </h3>

                            {transaction.source_type &&
                              transaction.source_type !==
                                "manual" && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {transaction.source_type
                                    .replace(
                                      "statement_",
                                      ""
                                    )
                                    .replace(
                                      "_",
                                      " "
                                    )}
                                </span>
                              )}

                            {emiLabel && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {
                                  emiLabel
                                }
                              </span>
                            )}

                            {isRefundOrReversal && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                {
                                  getTransactionTypeLabel(
                                    transaction.transaction_type
                                  )
                                }
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {
                              transaction.category
                            }{" "}
                            ·{" "}
                            {getCardName(
                              transaction
                            )}
                          </p>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {
                              transaction.transaction_date
                            }

                            {transaction.payment_route
                              ? ` · ${transaction.payment_route}`
                              : ""}
                          </p>

                          {transaction.mcc && (
                            <p className="mt-2 text-[11px] text-[var(--muted)]">
                              MCC{" "}
                              {
                                transaction.mcc
                              }
                              {transaction.mcc_description
                                ? ` · ${transaction.mcc_description}`
                                : ""}
                            </p>
                          )}

                          {transaction.emi_status &&
                            transaction.emi_status !==
                              "regular" && (
                              <div className="mt-2 text-[11px] text-[var(--muted)]">
                                {transaction.emi_principal !=
                                null
                                  ? `Principal ${formatAmount(
                                      Number(
                                        transaction.emi_principal
                                      )
                                    )}`
                                  : ""}

                                {transaction.emi_number !=
                                    null &&
                                  transaction.total_emis !=
                                    null
                                  ? ` · EMI ${transaction.emi_number}/${transaction.total_emis}`
                                  : ""}

                                {transaction.emi_interest !=
                                null
                                  ? ` · Interest ${formatAmount(
                                      Number(
                                        transaction.emi_interest
                                      )
                                    )}`
                                  : ""}
                              </div>
                            )}

                          {transaction.original_transaction_id && (
                            <p className="mt-2 text-[11px] text-[var(--muted)]">
                              Linked to original transaction
                            </p>
                          )}

                          {transaction.notes && (
                            <p className="mt-2 text-xs text-[var(--muted)]">
                              {
                                transaction.notes
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <p
                            className={`shrink-0 text-base font-semibold ${
                              isRefundOrReversal
                                ? "text-amber-700 dark:text-amber-300"
                                : ""
                            }`}
                          >
                            {isRefundOrReversal
                              ? "−"
                              : ""}

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
                                setOpenMenuId(
                                  openMenuId ===
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

                            {openMenuId ===
                              transaction.id && (
                              <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditTransaction(
                                      transaction
                                    )
                                  }
                                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  Edit transaction
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
                                    : "Delete transaction"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <span>
              CardIQ
            </span>

            <span>
              Make every card spend count.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function getDateOffset(
  dateString: string,
  days: number
): string {
  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  date.setDate(
    date.getDate() + days
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(
    2,
    "0"
  )}-${String(
    date.getDate()
  ).padStart(
    2,
    "0"
  )}`;
}

function formatCurrencyValue(
  value: number
): string {
  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style:
          "currency",
        currency:
          "INR",
        maximumFractionDigits: 2,
      }
    ).format(value);
  } catch {
    return `₹${value.toFixed(
      2
    )}`;
  }
}
