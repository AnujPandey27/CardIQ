export type CardSpendTransaction = {
  id: string;
  amount: number;
  transactionDate: string;
};

export type CardSpendSettings = {
  anniversaryMonth: number | null;
  anniversaryYear: number | null;

  isLifetimeFree: boolean;

  annualFeeWaiverThreshold: number | null;
};

export type CardSpendSummary = {
  monthlySpend: number;
  monthlyTransactionCount: number;

  anniversaryYearSpend: number;
  anniversaryYearTransactionCount: number;

  lifetimeSpend: number;
  lifetimeTransactionCount: number;

  anniversaryPeriodStart: string | null;
  anniversaryPeriodEnd: string | null;

  annualFeeWaiverThreshold: number | null;
  remainingToFeeWaiver: number | null;
  feeWaiverProgressPercent: number | null;

  isLifetimeFree: boolean;

  anniversaryTrackingAvailable: boolean;

  notes: string[];
};

function normalizeDate(
  date: string
): Date | null {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function startOfMonth(
  year: number,
  month: number
): Date {
  return new Date(
    year,
    month,
    1
  );
}

function endOfMonth(
  year: number,
  month: number
): Date {
  return new Date(
    year,
    month + 1,
    0,
    23,
    59,
    59,
    999
  );
}

function getCurrentAnniversaryPeriod(
  anniversaryMonth: number,
  anniversaryYear: number,
  referenceDate: Date
): {
  start: Date;
  end: Date;
} {
  /*
   * anniversaryMonth is 1-12.
   *
   * Example:
   * Issue month = August
   *
   * Current period:
   * August 2025 → July 2026
   *
   * or
   * August 2026 → July 2027
   */
  const currentYear =
    referenceDate.getFullYear();

  const currentMonth =
    referenceDate.getMonth() + 1;

  let periodStartYear =
    currentYear;

  if (
    currentMonth <
    anniversaryMonth
  ) {
    periodStartYear =
      currentYear - 1;
  }

  /*
   * For the very first anniversary period,
   * don't return a period that begins before
   * the card was issued.
   */
  if (
    periodStartYear <
    anniversaryYear
  ) {
    periodStartYear =
      anniversaryYear;
  }

  const periodStart =
    startOfMonth(
      periodStartYear,
      anniversaryMonth - 1
    );

  const periodEnd =
    endOfMonth(
      periodStartYear + 1,
      anniversaryMonth - 2 >= 0
        ? anniversaryMonth - 2
        : 11
    );

  return {
    start: periodStart,
    end: periodEnd,
  };
}

function isDateInRange(
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

function roundCurrency(
  value: number
): number {
  return Math.round(
    (value + Number.EPSILON) *
      100
  ) / 100;
}

export function calculateCardSpendSummary(
  transactions: CardSpendTransaction[],
  settings: CardSpendSettings,
  referenceDate: Date = new Date()
): CardSpendSummary {
  const validTransactions =
    transactions.filter(
      (transaction) => {
        const date =
          normalizeDate(
            transaction.transactionDate
          );

        return (
          date !== null &&
          Number.isFinite(
            Number(transaction.amount)
          ) &&
          Number(transaction.amount) >
            0
        );
      }
    );

  const monthlyStart =
    startOfMonth(
      referenceDate.getFullYear(),
      referenceDate.getMonth()
    );

  const monthlyEnd =
    endOfMonth(
      referenceDate.getFullYear(),
      referenceDate.getMonth()
    );

  const monthlyTransactions =
    validTransactions.filter(
      (transaction) => {
        const date =
          normalizeDate(
            transaction.transactionDate
          );

        return (
          date !== null &&
          isDateInRange(
            date,
            monthlyStart,
            monthlyEnd
          )
        );
      }
    );

  const monthlySpend =
    monthlyTransactions.reduce(
      (
        total,
        transaction
      ) =>
        total +
        Number(
          transaction.amount
        ),
      0
    );

  let anniversaryPeriodStart:
    | string
    | null = null;

  let anniversaryPeriodEnd:
    | string
    | null = null;

  let anniversaryYearSpend = 0;

  let anniversaryYearTransactionCount = 0;

  let anniversaryTrackingAvailable =
    false;

  const notes: string[] = [];

  if (
    settings.anniversaryMonth !==
      null &&
    settings.anniversaryYear !==
      null &&
    Number.isInteger(
      settings.anniversaryMonth
    ) &&
    settings.anniversaryMonth >=
      1 &&
    settings.anniversaryMonth <=
      12 &&
    Number.isInteger(
      settings.anniversaryYear
    )
  ) {
    anniversaryTrackingAvailable =
      true;

    const {
      start,
      end,
    } =
      getCurrentAnniversaryPeriod(
        settings.anniversaryMonth,
        settings.anniversaryYear,
        referenceDate
      );

    anniversaryPeriodStart =
      start
        .toISOString()
        .slice(0, 10);

    anniversaryPeriodEnd =
      end
        .toISOString()
        .slice(0, 10);

    const anniversaryTransactions =
      validTransactions.filter(
        (transaction) => {
          const date =
            normalizeDate(
              transaction.transactionDate
            );

          return (
            date !== null &&
            isDateInRange(
              date,
              start,
              end
            )
          );
        }
      );

    anniversaryYearSpend =
      anniversaryTransactions.reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.amount
          ),
        0
      );

    anniversaryYearTransactionCount =
      anniversaryTransactions.length;
  } else {
    notes.push(
      "Card issue month and year have not been configured, so anniversary-year tracking is unavailable."
    );
  }

  const lifetimeSpend =
    validTransactions.reduce(
      (
        total,
        transaction
      ) =>
        total +
        Number(
          transaction.amount
        ),
      0
    );

  const annualFeeWaiverThreshold =
    settings.isLifetimeFree
      ? null
      : settings.annualFeeWaiverThreshold;

  let remainingToFeeWaiver:
    | number
    | null = null;

  let feeWaiverProgressPercent:
    | number
    | null = null;

  if (
    annualFeeWaiverThreshold !==
      null &&
    annualFeeWaiverThreshold >
      0 &&
    anniversaryTrackingAvailable
  ) {
    remainingToFeeWaiver =
      Math.max(
        0,
        roundCurrency(
          annualFeeWaiverThreshold -
            anniversaryYearSpend
        )
      );

    feeWaiverProgressPercent =
      Math.min(
        100,
        roundCurrency(
          (anniversaryYearSpend /
            annualFeeWaiverThreshold) *
            100
        )
      );
  }

  if (
    settings.isLifetimeFree
  ) {
    notes.push(
      "This card is marked Lifetime Free, so renewal-fee waiver tracking is not applicable."
    );
  } else if (
    annualFeeWaiverThreshold ===
    null
  ) {
    notes.push(
      "No renewal-fee waiver threshold is configured for this card."
    );
  }

  return {
    monthlySpend:
      roundCurrency(
        monthlySpend
      ),

    monthlyTransactionCount:
      monthlyTransactions.length,

    anniversaryYearSpend:
      roundCurrency(
        anniversaryYearSpend
      ),

    anniversaryYearTransactionCount,

    lifetimeSpend:
      roundCurrency(
        lifetimeSpend
      ),

    lifetimeTransactionCount:
      validTransactions.length,

    anniversaryPeriodStart,

    anniversaryPeriodEnd,

    annualFeeWaiverThreshold,

    remainingToFeeWaiver,

    feeWaiverProgressPercent,

    isLifetimeFree:
      settings.isLifetimeFree,

    anniversaryTrackingAvailable,

    notes,
  };
}

export function getAnniversaryPeriodLabel(
  summary: CardSpendSummary,
  locale = "en-IN"
): string | null {
  if (
    !summary.anniversaryPeriodStart ||
    !summary.anniversaryPeriodEnd
  ) {
    return null;
  }

  const start =
    normalizeDate(
      summary.anniversaryPeriodStart
    );

  const end =
    normalizeDate(
      summary.anniversaryPeriodEnd
    );

  if (!start || !end) {
    return null;
  }

  const formatter =
    new Intl.DateTimeFormat(
      locale,
      {
        month: "short",
        year: "numeric",
      }
    );

  return `${formatter.format(
    start
  )} – ${formatter.format(
    end
  )}`;
}
