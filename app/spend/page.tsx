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
};

type ImportRow = {
  rowNumber: number;
  merchant: string;
  merchantRaw: string;
  amount: number;
  transactionDate: string;
  category: string;
  cardId: string;
  sourceTransactionId: string | null;
  transactionType: string;
  paymentRoute: string | null;
  classificationMethod: string;
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
  "Other",
];

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

  values.push(current.trim());

  return values;
}

function parseCsv(
  content: string
): string[][] {
  const cleaned = content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const rows: string[][] = [];
  let current = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < cleaned.length;
    index += 1
  ) {
    const character = cleaned[index];

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
          parseCsvLine(current)
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
    headers.map(normalizeHeader);

  for (const candidate of candidates) {
    const normalizedCandidate =
      normalizeHeader(candidate);

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

  const cleaned = raw
    .replace(/,/g, "")
    .replace(/[₹$€£\s]/g, "")
    .trim();

  if (!cleaned) {
    return null;
  }

  const negative =
    cleaned.startsWith("(") &&
    cleaned.endsWith(")");

  const withoutParens =
    cleaned
      .replace(/[()]/g, "")
      .trim();

  const numeric = Number(
    withoutParens
  );

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return negative
    ? -Math.abs(numeric)
    : numeric;
}

function parseDate(
  raw: string
): string | null {
  const value = raw.trim();

  if (!value) {
    return null;
  }

  /*
   * ISO date: 2026-08-29
   */
  const isoMatch =
    value.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
    );

  if (isoMatch) {
    const year = Number(
      isoMatch[1]
    );
    const month = Number(
      isoMatch[2]
    );
    const day = Number(
      isoMatch[3]
    );

    if (
      year >= 1900 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${String(
        year
      ).padStart(4, "0")}-${String(
        month
      ).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
    }
  }

  /*
   * DD/MM/YYYY or DD-MM-YYYY
   */
  const dmyMatch =
    value.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
    );

  if (dmyMatch) {
    const day = Number(
      dmyMatch[1]
    );
    const month = Number(
      dmyMatch[2]
    );
    const year = Number(
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
      ).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1
  ).padStart(2, "0")}-${String(
    parsed.getDate()
  ).padStart(2, "0")}`;
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
      category: "Utilities",
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
      category: "Entertainment",
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

export default function SpendPage() {
  const router = useRouter();

  const {
    activeProfile,
    loadingProfiles,
  } = useCardIQProfile();

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
      .slice(0, 10)
  );

  const [
    notes,
    setNotes,
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

  const selectedCard = useMemo(
    () =>
      cards.find(
        (card) =>
          card.id === cardId
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

  const totalSpend = useMemo(
    () =>
      transactions.reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.amount
          ),
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

      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setLoadingCards(true);
      setLoadingTransactions(true);
      setError("");

      const [
        cardsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from("cards")
          .select(
            "id, name, bank, network, variant, card_last_four, connection_type, connection_status, last_synced_at"
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
              ascending: false,
            }
          ),

        supabase
          .from(
            "spend_transactions"
          )
          .select(
            "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, merchant_raw, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id"
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
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(100),
      ]);

      if (cardsResult.error) {
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
            loadedCards[0].id
          );
        }

        if (
          loadedCards.length >
            0 &&
          !selectedImportCardId
        ) {
          setSelectedImportCardId(
            loadedCards[0].id
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
          transactionsResult.error.message ||
            "Unable to load your purchases."
        );

        setTransactions([]);
      } else {
        setTransactions(
          (transactionsResult.data ??
            []) as SpendTransaction[]
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
      setCardId(
        cards[0].id
      );
    } else {
      setCardId("");
    }

    setTransactionDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setNotes("");
    setEditingTransactionId(
      null
    );
    setOpenMenuId(null);
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

    const trimmedMerchant =
      merchant.trim();

    const numericAmount =
      Number(amount);

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
        "Please select a purchase date."
      );
      return;
    }

    setSaving(true);

    try {
      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (
        editingTransactionId
      ) {
        const {
          data,
          error: updateError,
        } =
          await supabase
            .from(
              "spend_transactions"
            )
            .update({
              card_id:
                selectedCard?.id ??
                null,
              merchant:
                trimmedMerchant,
              merchant_raw:
                trimmedMerchant,
              amount:
                numericAmount,
              currency_code:
                activeProfile.currency_code,
              category,
              classification_method:
                "manual",
              transaction_date:
                transactionDate,
              notes:
                notes.trim() ||
                null,
              transaction_type:
                "purchase",
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
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, merchant_raw, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id"
            )
            .single();

        if (updateError) {
          throw updateError;
        }

        setTransactions(
          (current) =>
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
          "Purchase updated successfully."
        );
      } else {
        const {
          data,
          error: insertError,
        } =
          await supabase
            .from(
              "spend_transactions"
            )
            .insert({
              user_id:
                user.id,
              profile_id:
                activeProfile.id,
              card_id:
                selectedCard?.id ??
                null,
              merchant:
                trimmedMerchant,
              merchant_raw:
                trimmedMerchant,
              amount:
                numericAmount,
              currency_code:
                activeProfile.currency_code,
              category,
              classification_method:
                "manual",
              transaction_date:
                transactionDate,
              notes:
                notes.trim() ||
                null,
              transaction_type:
                "purchase",
              source_type:
                "manual",
            })
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, merchant_raw, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id"
            )
            .single();

        if (insertError) {
          throw insertError;
        }

        setTransactions(
          (current) => [
            data as SpendTransaction,
            ...current,
          ]
        );

        setSuccessMessage(
          "Purchase recorded successfully."
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
        typeof err === "object" &&
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
            ? "Unable to update this purchase."
            : "Unable to record this purchase.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditTransaction = (
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
      transaction.card_id ?? ""
    );

    setTransactionDate(
      transaction.transaction_date
    );

    setNotes(
      transaction.notes ?? ""
    );

    setEditingTransactionId(
      transaction.id
    );

    setOpenMenuId(null);

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
      const confirmed =
        window.confirm(
          `Delete the "${transaction.merchant}" purchase permanently?\n\nThis action cannot be undone.`
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
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (!activeProfile?.id) {
        setError(
          "No active profile is available."
        );

        setDeletingTransactionId(
          null
        );

        return;
      }

      const {
        error: deleteError,
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
            activeProfile.id
          );

      if (deleteError) {
        console.error(
          deleteError
        );

        setError(
          deleteError.message ||
            "Unable to delete this purchase."
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
        "Purchase deleted successfully."
      );

      setDeletingTransactionId(
        null
      );
    };

  /*
   * Convert an uploaded CSV statement into
   * reviewable CardIQ transaction rows.
   */
  const handleStatementFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError("");
    setSuccessMessage("");
    setImportRows([]);
    setImportBatchId(null);

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!selectedImportCardId) {
      setError(
        "Please select the card represented by this statement first."
      );

      event.target.value = "";
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setError(
        "CSV statement import is available at this stage. PDF and Excel statement processing will be added through the secure document-ingestion layer."
      );

      event.target.value = "";
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

      const typeIndex =
        findColumnIndex(
          headers,
          [
            "transaction type",
            "type",
            "debit credit",
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
        router.push("/login");
        return;
      }

      /*
       * Create the import batch before parsing
       * into the review queue.
       */
      const {
        data: batch,
        error: batchError,
      } =
        await supabase
          .from(
            "transaction_import_batches"
          )
          .insert({
            user_id:
              user.id,
            profile_id:
              activeProfile.id,
            card_id:
              selectedImportCardId,
            source_type:
              "statement_csv",
            status:
              "review_required",
          })
          .select(
            "id"
          )
          .single();

      if (batchError) {
        throw batchError;
      }

      const sourceTransactionIds =
        rows
          .slice(1)
          .map(
            (row) =>
              referenceIndex >=
              0
                ? row[
                    referenceIndex
                  ]?.trim()
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
          data: existingRows,
          error: existingError,
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
              activeProfile.id
            )
            .eq(
              "source_type",
              "statement_csv"
            )
            .in(
              "source_transaction_id",
              sourceTransactionIds
            );

        if (existingError) {
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
                  Boolean(value)
              )
          );
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
                (value) =>
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

            const numericAmount =
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
                ? row[
                    categoryIndex
                  ]?.trim()
                : "";

            const classification =
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

            const rawType =
              typeIndex >=
              0
                ? (
                    row[
                      typeIndex
                    ] ?? ""
                  )
                    .trim()
                    .toLowerCase()
                : "";

            const transactionType =
              /refund|reversal|credit/.test(
                rawType
              )
                ? "refund"
                : "purchase";

            const sourceTransactionId =
              referenceIndex >=
              0
                ? (
                    row[
                      referenceIndex
                    ] ?? ""
                  ).trim() ||
                  null
                : null;

            const hasError =
              !rawMerchant
                ? "Merchant/description is missing."
                : numericAmount ===
                    null ||
                  numericAmount <=
                    0
                ? "Amount could not be read."
                : !parsedDate
                  ? "Transaction date could not be read."
                  : null;

            const duplicate =
              Boolean(
                sourceTransactionId &&
                  existingSourceIds.has(
                    sourceTransactionId
                  )
              );

            const mccRaw =
              mccIndex >= 0
                ? row[
                    mccIndex
                  ]?.trim()
                : "";

            parsedRows.push({
              rowNumber:
                index + 2,
              merchant:
                rawMerchant,
              merchantRaw:
                rawMerchant,
              amount:
                Math.abs(
                  numericAmount ??
                    0
                ),
              transactionDate:
                parsedDate ??
                "",
              category:
                classification.category,
              cardId:
                selectedImportCardId,
              sourceTransactionId,
              transactionType,
              paymentRoute:
                null,
              classificationMethod:
                mccRaw
                  ? "mcc"
                  : classification.classificationMethod,
              rawValues:
                row,
              duplicate,
              selected:
                !duplicate &&
                !hasError,
              error:
                hasError,
            });
          }
        );

      setImportBatchId(
        batch.id
      );

      setImportRows(
        parsedRows
      );

      const validRows =
        parsedRows.filter(
          (row) =>
            !row.error &&
            !row.duplicate
        ).length;

      await supabase
        .from(
          "transaction_import_batches"
        )
        .update({
          transactions_found:
            parsedRows.length,
          transactions_skipped:
            parsedRows.filter(
              (row) =>
                row.duplicate
            ).length,
          status:
            "review_required",
        })
        .eq(
          "id",
          batch.id
        )
        .eq(
          "user_id",
          user.id
        );

      setSuccessMessage(
        `${parsedRows.length} transaction${
          parsedRows.length ===
          1
            ? ""
            : "s"
        } found. ${validRows} ready for review.`
      );
    } catch (err) {
      console.error(
        "Statement import error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to process this statement."
      );
    } finally {
      event.target.value = "";
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
      if (
        !activeProfile?.id
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
          router.push("/login");
          return;
        }

        const payload =
          rowsToImport.map(
            (row) => ({
              user_id:
                user.id,
              profile_id:
                activeProfile.id,
              card_id:
                selectedImportCardId,
              merchant:
                row.merchant,
              merchant_raw:
                row.merchantRaw,
              amount:
                row.amount,
              currency_code:
                activeProfile.currency_code,
              category:
                row.category,
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
              transaction_date:
                row.transactionDate,
            }));

        const {
          data,
          error: insertError,
        } =
          await supabase
            .from(
              "spend_transactions"
            )
            .insert(
              payload
            )
            .select(
              "id, merchant, amount, currency_code, category, transaction_date, notes, card_id, merchant_raw, mcc, mcc_description, classification_method, payment_route, transaction_type, source_type, source_transaction_id"
            );

        if (insertError) {
          throw insertError;
        }

        await supabase
          .from(
            "transaction_import_batches"
          )
          .update({
            transactions_imported:
              data?.length ??
              0,
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

  const clearImport = () => {
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
          style: "currency",
          currency:
            activeProfile?.currency_code ??
            "INR",
          maximumFractionDigits: 2,
        }
      ).format(value);
    } catch {
      return `${
        activeProfile?.currency_code ??
        ""
      } ${value.toFixed(2)}`;
    }
  };

  const getCardName = (
    transaction: SpendTransaction
  ) => {
    if (!transaction.card_id) {
      return "No card";
    }

    const card =
      cards.find(
        (item) =>
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

  const formatConnectionBadge =
    (card: Card) =>
      formatConnectionStatus(
        card
      );

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
                Keep your spending history in one place and let CardIQ use it
                for rewards, fee and milestone calculations.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Profile spend tracked
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
              Choose how you want CardIQ to receive your spending data.
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
                Upload a CSV statement and review the transactions before
                importing them.
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
                  onChange={(event) =>
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
                          {card.name}
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
                ref={fileInputRef}
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
                PDF and Excel imports will use the secure document-processing
                layer added next.
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
                Automatic account connections will use the same transaction
                pipeline as statement imports.
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
                          {formatConnectionBadge(
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
                Record a transaction yourself when you don't have a statement
                or connected source available.
              </p>

              <button
                type="button"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
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
                  {importFileName
                    ? importFileName
                    : "Imported statement"}
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
                  Already recorded
                </p>

                <p className="mt-1 text-xl font-bold">
                  {
                    importDuplicateCount
                  }
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[760px] border-collapse text-sm">
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
                    (row) => (
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

                        <td className="max-w-[260px] px-4 py-3">
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
                          {
                            row.category
                          }
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
                ? "Edit purchase"
                : "Record a purchase"}
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              {editingTransactionId
                ? "Update the selected purchase and save your changes."
                : `Add a transaction manually to the ${activeProfile.name} profile.`}
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
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
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
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

                {cards.length ===
                  0 && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Add a card to your profile first.
                  </p>
                )}
              </div>

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

          {transactions.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-sm font-medium">
                No purchases recorded yet.
              </p>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Record a purchase or import a statement above to start building
                your spending history.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(
                (
                  transaction
                ) => (
                  <div
                    key={
                      transaction.id
                    }
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                        </p>

                        {transaction.notes && (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            {
                              transaction.notes
                            }
                          </p>
                        )}

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
